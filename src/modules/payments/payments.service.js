import { ObjectId } from "mongodb";
import { getDB, getMongoClient } from "../../config/db.js";
import stripe from "../../config/stripe.js";

// Create Stripe Checkout Session
export const createCheckoutSession = async (booking) => {
  const checkoutCollection = getDB().collection("checkout_sessions");

  const checkoutId = new ObjectId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  // Convert BDT to USD and calculate the exact Stripe amount in cents.
  const amountInCents = Math.round(Number(booking.totalAmount) * 0.00804 * 100);

  if (!Number.isInteger(amountInCents) || amountInCents < 50) {
    throw new Error("The rental amount is too low for Stripe Checkout.");
  }

  const checkoutData = {
    _id: checkoutId,
    ...booking,
    status: "pending",
    paymentStatus: "unpaid",
    stripeSessionId: null,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  };

  // Step 1: Save temporary checkout data.
  await checkoutCollection.insertOne(checkoutData);

  try {
    // Step 2: Create Stripe Checkout Session.
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.renterEmail,
      expires_at: Math.floor(expiresAt.getTime() / 1000),

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: booking.equipmentName,
              description: `Rental for ${booking.rentalDuration} ${booking.rentalType} period(s)`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],

      metadata: {
        checkoutId: checkoutId.toString(),
        renterId: String(booking.renterId),
      },

      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    });

    if (!stripeSession.url) {
      throw new Error("Stripe Checkout URL was not generated.");
    }

    // Step 3: Update checkout record with Stripe session ID.
    await checkoutCollection.updateOne(
      { _id: checkoutId },
      {
        $set: {
          stripeSessionId: stripeSession.id,
          updatedAt: new Date(),
        },
      },
    );

    return {
      checkoutUrl: stripeSession.url,
      sessionId: stripeSession.id,
    };
  } catch (error) {
    await checkoutCollection.deleteOne({ _id: checkoutId });
    throw error;
  }
};

// Complete Booking After Successful Payment
export const completeCheckoutSession = async (stripeSession) => {
  const client = getMongoClient();
  const db = getDB();

  const checkoutCollection = db.collection("checkout_sessions");
  const bookingsCollection = db.collection("bookings");
  const paymentsCollection = db.collection("payments");
  const equipmentCollection = db.collection("equipment");

  // Step 1: Verify successful Stripe payment.
  if (
    stripeSession.payment_status !== "paid" ||
    !stripeSession.id ||
    !stripeSession.metadata?.checkoutId ||
    !stripeSession.metadata?.renterId
  ) {
    throw new Error("Invalid or incomplete Stripe payment.");
  }

  const checkoutId = stripeSession.metadata.checkoutId;

  if (!ObjectId.isValid(checkoutId)) {
    throw new Error("Invalid checkout ID.");
  }

  const mongoSession = client.startSession();

  try {
    let result;

    // Step 2: Start MongoDB transaction.
    await mongoSession.withTransaction(async () => {
      // Prevent duplicate booking if Stripe sends the webhook again.
      const existingPayment = await paymentsCollection.findOne(
        { stripeSessionId: stripeSession.id },
        { session: mongoSession },
      );

      if (existingPayment) {
        result = {
          alreadyProcessed: true,
          bookingId: existingPayment.bookingId,
        };

        return;
      }

      // Step 3: Find the temporary checkout record.
      const checkout = await checkoutCollection.findOne(
        {
          _id: new ObjectId(checkoutId),
          stripeSessionId: stripeSession.id,
          renterId: stripeSession.metadata.renterId,
          status: "pending",
          paymentStatus: "unpaid",
        },
        { session: mongoSession },
      );

      if (!checkout) {
        throw new Error("Checkout record not found or already processed.");
      }

      // Step 4: Verify Stripe amount and currency.
      const expectedAmount = Math.round(
        Number(checkout.totalAmount) * 0.00804 * 100,
      );

      if (
        stripeSession.currency !== "usd" ||
        stripeSession.amount_total !== expectedAmount
      ) {
        throw new Error("Stripe payment amount verification failed.");
      }

      // Step 5: Check equipment availability again.
      const equipment = await equipmentCollection.findOne(
        {
          _id: checkout.equipmentId,
          status: "approved",
        },
        { session: mongoSession },
      );

      let availableQuantity = 0;

      if (equipment) {
        const existingBookings = await bookingsCollection
          .find(
            {
              equipmentId: checkout.equipmentId,
              status: "confirmed",
              startDate: { $lt: checkout.endDate },
              endDate: { $gt: checkout.startDate },
            },
            { session: mongoSession },
          )
          .toArray();

        const bookedQuantity = existingBookings.reduce(
          (total, booking) => total + Number(booking.quantity || 0),
          0,
        );

        availableQuantity = Math.max(equipment.quantity - bookedQuantity, 0);
      }

      // A successful payment is never discarded.
      // If availability changed, save it for admin review.
      const bookingStatus =
        equipment && checkout.quantity <= availableQuantity
          ? "confirmed"
          : "payment_review";

      const bookingId = new ObjectId();
      const now = new Date();

      // Step 6: Create the booking record.
      const bookingData = {
        ...checkout,
        _id: bookingId,
        checkoutId: checkout._id,
        status: bookingStatus,
        paymentStatus: "paid",
        stripeSessionId: stripeSession.id,
        createdAt: now,
        updatedAt: now,
      };

      delete bookingData.expiresAt;

      await bookingsCollection.insertOne(bookingData, {
        session: mongoSession,
      });

      // Step 7: Save payment transaction.
      await paymentsCollection.insertOne(
        {
          bookingId,
          checkoutId: checkout._id,
          renterId: checkout.renterId,
          ownerId: checkout.ownerId,
          stripeSessionId: stripeSession.id,
          stripePaymentIntentId: stripeSession.payment_intent,
          amount: stripeSession.amount_total / 100,
          currency: stripeSession.currency,
          paymentStatus: "paid",
          createdAt: now,
        },
        { session: mongoSession },
      );

      // Step 8: Update checkout status.
      await checkoutCollection.updateOne(
        {
          _id: checkout._id,
          status: "pending",
        },
        {
          $set: {
            status:
              bookingStatus === "confirmed" ? "completed" : "payment_review",
            paymentStatus: "paid",
            bookingId,
            updatedAt: now,
          },
        },
        { session: mongoSession },
      );

      result = {
        alreadyProcessed: false,
        bookingId,
        status: bookingStatus,
      };
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
};

// Get Stripe Checkout Session Status
export const getCheckoutSessionStatus = async (sessionId, renterId) => {
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("Invalid Stripe session ID.");
  }

  // Retrieve the session directly from Stripe
  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

  if (!stripeSession || stripeSession.id !== sessionId) {
    throw new Error("Payment session not found.");
  }

  // Ensure this session belongs to the logged-in renter
  if (stripeSession.metadata?.renterId !== String(renterId)) {
    const error = new Error("You are not authorized to access this payment.");
    error.statusCode = 403;
    throw error;
  }

  const db = getDB();

  const checkout = await db.collection("checkout_sessions").findOne({
    stripeSessionId: sessionId,
    renterId: String(renterId),
  });

  if (!checkout) {
    throw new Error("Checkout record not found.");
  }

  // Check whether the webhook has saved the payment
  const payment = await db.collection("payments").findOne({
    stripeSessionId: sessionId,
    renterId: String(renterId),
  });

  // Stripe payment succeeded, but webhook may still be processing
  if (stripeSession.payment_status === "paid" && !payment) {
    return {
      paymentStatus: "paid",
      processingStatus: "processing",
      message: "Payment received. Booking confirmation is being processed.",
    };
  }

  // Payment and booking have both been saved
  if (payment) {
    const booking = await db.collection("bookings").findOne({
      _id: payment.bookingId,
      renterId: String(renterId),
    });

    return {
      paymentStatus: payment.paymentStatus,
      processingStatus: "completed",
      booking: booking
        ? {
            id: booking._id.toString(),
            status: booking.status,
            equipmentName: booking.equipmentName,
            totalAmount: booking.totalAmount,
          }
        : null,
      payment: {
        amount: payment.amount,
        currency: payment.currency,
        paymentStatus: payment.paymentStatus,
      },
    };
  }

  return {
    paymentStatus: stripeSession.payment_status,
    processingStatus:
      stripeSession.status === "expired" ? "expired" : "pending",
    message:
      stripeSession.status === "expired"
        ? "This checkout session has expired."
        : "Payment has not been completed yet.",
  };
};

import { ObjectId } from "mongodb";
import { getDB, getMongoClient } from "../../config/db.js";
import stripe from "../../config/stripe.js";

// Create Stripe Checkout Session
export const createCheckoutSession = async (booking) => {
  const checkoutCollection = getDB().collection("checkout_sessions");

  const checkoutId = new ObjectId();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Step-1: Save temporary checkout data
  const checkoutData = {
    _id: checkoutId,
    ...booking,
    status: "pending",
    paymentStatus: "unpaid",
    stripeSessionId: null,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await checkoutCollection.insertOne(checkoutData);

  try {
    // Step-2: Convert BDT to USD for test payment
    const amountInUSD = booking.totalAmount * 0.00804;

    // Step-3: Create Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
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
            unit_amount: Math.round(amountInUSD * 100),
          },
          quantity: 1,
        },
      ],

      metadata: {
        checkoutId: checkoutId.toString(),
        renterId: booking.renterId,
      },

      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    });

    // Step-4: Update checkout record
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

  // Step-1: Verify successful payment
  if (stripeSession.payment_status !== "paid") {
    throw new Error("Payment is not completed.");
  }

  const checkoutId = stripeSession.metadata?.checkoutId;

  if (!ObjectId.isValid(checkoutId)) {
    throw new Error("Invalid checkout ID.");
  }

  const mongoSession = client.startSession();

  try {
    let result;

    // Step-2: Start MongoDB transaction
    await mongoSession.withTransaction(async () => {
      // Check duplicate payment
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

      // Find temporary checkout record
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

      // Verify Stripe amount and currency
      const expectedAmount = Math.round(checkout.totalAmount * 0.00804 * 100);

      if (
        stripeSession.currency !== "usd" ||
        stripeSession.amount_total !== expectedAmount
      ) {
        throw new Error("Stripe payment amount verification failed.");
      }

      // Check equipment availability again
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
        (total, booking) => total + booking.quantity,
        0,
      );

      const equipment = await db
        .collection("equipment")
        .findOne({ _id: checkout.equipmentId }, { session: mongoSession });

      const availableQuantity = equipment
        ? equipment.quantity - bookedQuantity
        : 0;

      // Step-3: Prepare booking record
      const bookingId = new ObjectId();
      const now = new Date();

      const bookingStatus =
        checkout.quantity <= availableQuantity ? "confirmed" : "payment_review";

      const bookingData = {
        _id: bookingId,
        ...checkout,
        checkoutId: checkout._id,
        status: bookingStatus,
        paymentStatus: "paid",
        stripeSessionId: stripeSession.id,
        createdAt: now,
        updatedAt: now,
      };

      delete bookingData._id;
      delete bookingData.expiresAt;
      delete bookingData.stripeSessionId;

      bookingData._id = bookingId;
      bookingData.checkoutId = checkout._id;
      bookingData.status = bookingStatus;
      bookingData.paymentStatus = "paid";
      bookingData.stripeSessionId = stripeSession.id;
      bookingData.createdAt = now;
      bookingData.updatedAt = now;

      // Step-4: Save booking
      await bookingsCollection.insertOne(bookingData, {
        session: mongoSession,
      });

      // Step-5: Save payment transaction
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

      // Step-6: Update checkout status
      await checkoutCollection.updateOne(
        { _id: checkout._id, status: "pending" },
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

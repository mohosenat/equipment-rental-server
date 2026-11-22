import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";
import { calculateRental } from "../../utils/calculateRental.js";

export const createBooking = async (bookingData, user) => {
  const equipmentCollection = getDB().collection("equipment");
  const bookingsCollection = getDB().collection("bookings");

  const {
    equipmentId,
    startDate,
    endDate,
    quantity,
    contactNumber,
    deliveryAddress,
    notes,
  } = bookingData;

  if (!ObjectId.isValid(equipmentId)) {
    throw new Error("Invalid equipment ID.");
  }

  // Find approved equipment
  const equipment = await equipmentCollection.findOne({
    _id: new ObjectId(equipmentId),
    status: "approved",
  });

  if (!equipment) {
    throw new Error("Equipment not found or not available.");
  }

  // Check overlapping confirmed bookings
  const existingBookings = await bookingsCollection
    .find({
      equipmentId: equipment._id,
      status: "confirmed",
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    })
    .toArray();

  const bookedQuantity = existingBookings.reduce(
    (total, booking) => total + booking.quantity,
    0,
  );

  const availableQuantity = equipment.quantity - bookedQuantity;

  if (quantity > availableQuantity) {
    throw new Error(
      `Only ${Math.max(availableQuantity, 0)} equipment available.`,
    );
  }

  // Calculate rental amount
  const rental = calculateRental(
    startDate,
    endDate,
    equipment.price,
    equipment.rentalType,
    quantity,
  );

  // Prepare booking data for Stripe Checkout
  // Booking will be saved after successful payment
  return {
    equipmentId: equipment._id,
    equipmentName: equipment.name,

    renterId: user.id,
    renterEmail: user.email,

    ownerId: equipment.ownerId,
    ownerEmail: equipment.ownerEmail,

    startDate,
    endDate,
    quantity,

    contactNumber,
    deliveryAddress,
    notes,

    rentalDuration: rental.duration,
    rentalType: rental.rentalType,
    pricePerUnit: rental.price,
    totalAmount: rental.totalAmount,
  };
};

export const getMyBookings = async (userId) => {
  const bookingsCollection = getDB().collection("bookings");

  const bookings = await bookingsCollection
    .find({
      renterId: userId,
    })
    .sort({ createdAt: -1 })
    .toArray();

  return bookings;
};

export const getBookingById = async (bookingId, userId) => {
  const bookingsCollection = getDB().collection("bookings");

  if (!ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking ID.");
  }

  const booking = await bookingsCollection.findOne({
    _id: new ObjectId(bookingId),
    renterId: userId,
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  return booking;
};

// Cancel Booking
export const cancelBooking = async (bookingId, userId) => {
  if (!ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking ID.");
  }

  const bookingCollection = getDB().collection("bookings");

  const booking = await bookingCollection.findOne({
    _id: new ObjectId(bookingId),
    renterId: userId,
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.status === "cancelled") {
    throw new Error("Booking is already cancelled.");
  }

  if (booking.status !== "confirmed") {
    throw new Error("Only confirmed bookings can request cancellation.");
  }

  if (booking.paymentStatus !== "paid") {
    throw new Error("Only paid bookings can request cancellation.");
  }

  if (booking.cancellationStatus === "requested") {
    throw new Error("Cancellation request already submitted.");
  }

  if (booking.status === "in_progress" || booking.status === "completed") {
    throw new Error("This booking cannot be cancelled.");
  }

  const result = await bookingCollection.updateOne(
    {
      _id: booking._id,
      renterId: userId,
      status: "confirmed",
      paymentStatus: "paid",
      cancellationStatus: { $ne: "requested" },
    },
    {
      $set: {
        cancellationStatus: "requested",
        cancellationRequestedAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  if (result.modifiedCount === 0) {
    throw new Error("Unable to submit cancellation request.");
  }

  return {
    message:
      "Cancellation request submitted successfully. It is waiting for admin review.",
  };
};

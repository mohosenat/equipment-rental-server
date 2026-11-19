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

export const cancelBooking = async (bookingId, userId) => {
  const bookingsCollection = getDB().collection("bookings");

  if (!ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking ID.");
  }

  const result = await bookingsCollection.updateOne(
    {
      _id: new ObjectId(bookingId),
      renterId: userId,
      status: "pending_payment",
    },
    {
      $set: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new Error("Booking not found or cannot be cancelled.");
  }

  return {
    message: "Booking cancelled successfully.",
  };
};

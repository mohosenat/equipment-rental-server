import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// Get bookings for the logged-in owner
export const getOwnerBookings = async (ownerId) => {
  const bookingsCollection = getDB().collection("bookings");

  const bookings = await bookingsCollection
    .find({
      ownerId,
      status: { $in: ["confirmed", "in_progress", "completed"] },
    })
    .sort({ createdAt: -1 })
    .toArray();

  return bookings;
};

// Get a single booking belonging to the owner
export const getOwnerBookingById = async (bookingId, ownerId) => {
  const bookingsCollection = getDB().collection("bookings");

  if (!ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking ID.");
  }

  const booking = await bookingsCollection.findOne({
    _id: new ObjectId(bookingId),
    ownerId,
    status: { $in: ["confirmed", "in_progress", "completed"] },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  return booking;
};

// Update rental status
export const updateOwnerBookingStatus = async (
  bookingId,
  ownerId,
  newStatus,
) => {
  const bookingsCollection = getDB().collection("bookings");

  if (!ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking ID.");
  }

  const booking = await bookingsCollection.findOne({
    _id: new ObjectId(bookingId),
    ownerId,
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  // Only paid bookings can be managed by the owner
  if (booking.paymentStatus !== "paid") {
    throw new Error("Only paid bookings can be managed.");
  }

  // Allowed status transitions
  const allowedTransitions = {
    confirmed: ["in_progress"],
    in_progress: ["completed"],
    completed: [],
  };

  const currentStatus = booking.status;

  if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(
      `Cannot change booking status from ${currentStatus} to ${newStatus}.`,
    );
  }

  const result = await bookingsCollection.updateOne(
    {
      _id: new ObjectId(bookingId),
      ownerId,
      status: currentStatus,
      paymentStatus: "paid",
    },
    {
      $set: {
        status: newStatus,
        updatedAt: new Date(),
      },
    },
  );

  if (result.modifiedCount === 0) {
    throw new Error("Booking status could not be updated.");
  }

  return {
    message: `Booking status updated to ${newStatus} successfully.`,
  };
};

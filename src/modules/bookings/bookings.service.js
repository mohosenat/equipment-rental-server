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

  // Step 1: Validate equipment ID.
  if (!ObjectId.isValid(equipmentId)) {
    throw new Error("Invalid equipment ID.");
  }

  // Step 2: Validate dates.
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start <= new Date() ||
    end <= start
  ) {
    throw new Error("Please select valid future rental dates.");
  }

  // Normalize dates to UTC ISO strings.
  const normalizedStartDate = start.toISOString();
  const normalizedEndDate = end.toISOString();

  // Step 3: Validate quantity.
  const rentalQuantity = Number(quantity);

  if (!Number.isInteger(rentalQuantity) || rentalQuantity < 1) {
    throw new Error("Please select a valid equipment quantity.");
  }

  // Step 4: Validate contact information.
  if (!contactNumber?.trim() || !deliveryAddress?.trim()) {
    throw new Error("Contact number and delivery address are required.");
  }

  // Step 5: Find approved equipment.
  const equipment = await equipmentCollection.findOne({
    _id: new ObjectId(equipmentId),
    status: "approved",
  });

  if (!equipment) {
    throw new Error("Equipment not found or not available.");
  }

  // Prevent booking your own equipment.
  if (String(equipment.ownerId) === String(user.id)) {
    throw new Error("You cannot book your own equipment.");
  }

  if (rentalQuantity > equipment.quantity) {
    throw new Error(`Only ${equipment.quantity} equipment available.`);
  }

  // Step 6: Check overlapping confirmed bookings.
  const existingBookings = await bookingsCollection
    .find({
      equipmentId: equipment._id,
      status: "confirmed",
      startDate: { $lt: normalizedEndDate },
      endDate: { $gt: normalizedStartDate },
    })
    .toArray();

  const bookedQuantity = existingBookings.reduce(
    (total, booking) => total + Number(booking.quantity || 0),
    0,
  );

  const availableQuantity = Math.max(equipment.quantity - bookedQuantity, 0);

  if (rentalQuantity > availableQuantity) {
    throw new Error(
      `Only ${availableQuantity} equipment available for these dates.`,
    );
  }

  // Step 7: Calculate rental amount.
  const rental = calculateRental(
    normalizedStartDate,
    normalizedEndDate,
    equipment.price,
    equipment.rentalType,
    rentalQuantity,
  );

  // Step 8: Prepare booking data for Stripe Checkout.
  // Booking will be saved after successful payment.
  return {
    equipmentId: equipment._id,
    equipmentName: equipment.name,

    renterId: user.id,
    renterEmail: user.email,

    ownerId: equipment.ownerId,
    ownerEmail: equipment.ownerEmail,

    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    quantity: rentalQuantity,

    contactNumber: contactNumber.trim(),
    deliveryAddress: deliveryAddress.trim(),
    notes: notes?.trim() || "",

    rentalDuration: rental.duration,
    rentalType: rental.rentalType,
    pricePerUnit: rental.price,
    totalAmount: rental.totalAmount,
  };
};

export const getMyBookings = async (userId) => {
  const bookingsCollection = getDB().collection("bookings");

  const bookings = await bookingsCollection
    .find({ renterId: userId })
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

// Cancellation request only.
// No automatic cancellation or refund.
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

  if (booking.status === "in_progress" || booking.status === "completed") {
    throw new Error("This booking cannot be cancelled.");
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

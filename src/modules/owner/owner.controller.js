import {
  getOwnerBookings,
  getOwnerBookingById,
  updateOwnerBookingStatus,
} from "./owner.service.js";

import { validateBookingStatus } from "./owner.validation.js";

// Get Owner Bookings
export const getOwnerBookingsController = async (req, res) => {
  const bookings = await getOwnerBookings(req.user.id);

  return res.status(200).json({
    success: true,
    message: "Owner bookings retrieved successfully.",
    data: bookings,
  });
};

// Get Owner Booking Details
export const getOwnerBookingByIdController = async (req, res) => {
  const { id } = req.params;

  const booking = await getOwnerBookingById(id, req.user.id);

  return res.status(200).json({
    success: true,
    message: "Booking details retrieved successfully.",
    data: booking,
  });
};

// Update Booking Status
export const updateOwnerBookingStatusController = async (req, res) => {
  const validation = validateBookingStatus(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: "Booking status validation failed.",
      errors: validation.errors,
    });
  }

  const { id } = req.params;

  const result = await updateOwnerBookingStatus(
    id,
    req.user.id,
    validation.data.status,
  );

  return res.status(200).json({
    success: true,
    message: result.message,
  });
};

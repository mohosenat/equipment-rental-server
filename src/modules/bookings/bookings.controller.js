import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from "./bookings.service.js";

import { validateBooking } from "./bookings.validation.js";

// Create Booking
export const createBookingController = async (req, res) => {
  const validation = validateBooking(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  const booking = await createBooking(validation.data, req.user);

  return res.status(201).json({
    success: true,
    message: "Booking created successfully. Please complete payment.",
    data: booking,
  });
};

// Get My Bookings
export const getMyBookingsController = async (req, res) => {
  const bookings = await getMyBookings(req.user.id);

  return res.status(200).json({
    success: true,
    message: "Bookings retrieved successfully.",
    data: bookings,
  });
};

// Get Booking Details
export const getBookingByIdController = async (req, res) => {
  const { id } = req.params;

  const booking = await getBookingById(id, req.user.id);

  return res.status(200).json({
    success: true,
    message: "Booking details retrieved successfully.",
    data: booking,
  });
};

// Cancel Booking
export const cancelBookingController = async (req, res) => {
  const { id } = req.params;

  const result = await cancelBooking(id, req.user.id);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
};

import { Router } from "express";
import { verifyToken, verifyRenter } from "../../middlewares/auth.js";

import {
  createBookingController,
  getMyBookingsController,
  getBookingByIdController,
  cancelBookingController,
} from "./bookings.controller.js";

const router = Router();

// All booking routes require customer authentication
router.use(verifyToken, verifyRenter);

// Create a booking
router.post("/", createBookingController);

// Get all bookings of the logged-in customer
router.get("/my-bookings", getMyBookingsController);

// Get a single booking
router.get("/:id", getBookingByIdController);

// Cancel a booking
router.patch("/:id/cancel", cancelBookingController);

export default router;

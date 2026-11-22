import { Router } from "express";

import { verifyToken, verifyOwner } from "../../middlewares/auth.js";

import {
  getOwnerBookingsController,
  getOwnerBookingByIdController,
  updateOwnerBookingStatusController,
} from "./owner.controller.js";

const router = Router();

// All owner routes require owner authentication
router.use(verifyToken, verifyOwner);

// Get all bookings belonging to the owner
router.get("/bookings", getOwnerBookingsController);

// Get a single owner booking
router.get("/bookings/:id", getOwnerBookingByIdController);

// Update rental status
router.patch("/bookings/:id/status", updateOwnerBookingStatusController);

export default router;

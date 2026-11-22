import { Router } from "express";

import { verifyToken, verifyRenter } from "../../middlewares/auth.js";

import {
  createReviewController,
  getEquipmentReviewsController,
  getMyReviewsController,
  updateReviewController,
  deleteReviewController,
} from "./reviews.controller.js";

const router = Router();

// Get public reviews for equipment
router.get("/equipment/:equipmentId", getEquipmentReviewsController);

// All customer review management routes require authentication
router.use(verifyToken, verifyRenter);

// Create Review
router.post("/", createReviewController);

// Get My Reviews
router.get("/my-reviews", getMyReviewsController);

// Update Review
router.patch("/:id", updateReviewController);

// Delete Review
router.delete("/:id", deleteReviewController);

export default router;

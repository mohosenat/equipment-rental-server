import {
  createReview,
  getEquipmentReviews,
  getMyReviews,
  updateReview,
  deleteReview,
} from "./reviews.service.js";

import { validateReview, validateReviewUpdate } from "./reviews.validation.js";

// Create Review
export const createReviewController = async (req, res) => {
  const validation = validateReview(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: "Review validation failed.",
      errors: validation.errors,
    });
  }

  const review = await createReview(validation.data, req.user);

  return res.status(201).json({
    success: true,
    message: "Review created successfully.",
    data: review,
  });
};

// Get Equipment Reviews
export const getEquipmentReviewsController = async (req, res) => {
  const { equipmentId } = req.params;

  const result = await getEquipmentReviews(equipmentId);

  return res.status(200).json({
    success: true,
    message: "Equipment reviews retrieved successfully.",
    data: result,
  });
};

// Get My Reviews
export const getMyReviewsController = async (req, res) => {
  const reviews = await getMyReviews(req.user.id);

  return res.status(200).json({
    success: true,
    message: "My reviews retrieved successfully.",
    data: reviews,
  });
};

// Update Review
export const updateReviewController = async (req, res) => {
  const validation = validateReviewUpdate(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: "Review validation failed.",
      errors: validation.errors,
    });
  }

  const { id } = req.params;

  const result = await updateReview(id, req.user.id, validation.data);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
};

// Delete Review
export const deleteReviewController = async (req, res) => {
  const { id } = req.params;

  const result = await deleteReview(id, req.user.id);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
};

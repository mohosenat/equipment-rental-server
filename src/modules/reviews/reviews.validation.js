export const validateReview = (data) => {
  const errors = {};
  const validatedData = {};

  // Validate booking ID
  if (!data.bookingId || typeof data.bookingId !== "string") {
    errors.bookingId = "Booking ID is required.";
  } else {
    validatedData.bookingId = data.bookingId.trim();
  }

  // Validate rating
  if (
    typeof data.rating !== "number" ||
    !Number.isInteger(data.rating) ||
    data.rating < 1 ||
    data.rating > 5
  ) {
    errors.rating = "Rating must be an integer between 1 and 5.";
  } else {
    validatedData.rating = data.rating;
  }

  // Validate comment
  if (typeof data.comment !== "string") {
    errors.comment = "Comment must be a string.";
  } else if (data.comment.trim().length < 10) {
    errors.comment = "Comment must be at least 10 characters.";
  } else if (data.comment.trim().length > 1000) {
    errors.comment = "Comment cannot exceed 1000 characters.";
  } else {
    validatedData.comment = data.comment.trim();
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: validatedData,
  };
};

// Validate review update
export const validateReviewUpdate = (data) => {
  const errors = {};
  const validatedData = {};

  // Validate rating
  if (data.rating !== undefined) {
    if (
      typeof data.rating !== "number" ||
      !Number.isInteger(data.rating) ||
      data.rating < 1 ||
      data.rating > 5
    ) {
      errors.rating = "Rating must be an integer between 1 and 5.";
    } else {
      validatedData.rating = data.rating;
    }
  }

  // Validate comment
  if (data.comment !== undefined) {
    if (typeof data.comment !== "string") {
      errors.comment = "Comment must be a string.";
    } else if (data.comment.trim().length < 10) {
      errors.comment = "Comment must be at least 10 characters.";
    } else if (data.comment.trim().length > 1000) {
      errors.comment = "Comment cannot exceed 1000 characters.";
    } else {
      validatedData.comment = data.comment.trim();
    }
  }

  if (Object.keys(validatedData).length === 0) {
    errors.review = "At least one review field is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: validatedData,
  };
};

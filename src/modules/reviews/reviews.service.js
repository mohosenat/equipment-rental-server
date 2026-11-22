import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// Create Review
export const createReview = async (reviewData, user) => {
  const db = getDB();

  const bookingsCollection = db.collection("bookings");
  const equipmentCollection = db.collection("equipment");
  const reviewsCollection = db.collection("reviews");
  const usersCollection = db.collection("user");

  const { bookingId, rating, comment } = reviewData;

  if (!ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking ID.");
  }

  // Find completed booking belonging to the customer
  const booking = await bookingsCollection.findOne({
    _id: new ObjectId(bookingId),
    renterId: user.id,
    status: "completed",
    paymentStatus: "paid",
  });

  if (!booking) {
    throw new Error(
      "Completed booking not found or you are not eligible to review.",
    );
  }

  // Find approved equipment
  const equipment = await equipmentCollection.findOne({
    _id: booking.equipmentId,
    status: "approved",
  });

  if (!equipment) {
    throw new Error("Equipment not found.");
  }

  // Check existing review
  const existingReview = await reviewsCollection.findOne({
    bookingId: booking._id,
    reviewerId: user.id,
  });

  if (existingReview) {
    throw new Error("You have already reviewed this booking.");
  }

  // Get reviewer information
  const reviewer = await usersCollection.findOne({
    _id: ObjectId.isValid(user.id) ? new ObjectId(user.id) : user.id,
  });

  const review = {
    bookingId: booking._id,
    equipmentId: booking.equipmentId,
    reviewerId: user.id,
    reviewerName: reviewer?.name || user.email,
    reviewerImage: reviewer?.image || "",
    rating,
    comment,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await reviewsCollection.insertOne(review);

  return {
    ...review,
    _id: result.insertedId,
  };
};

// Get Reviews for Equipment
export const getEquipmentReviews = async (equipmentId) => {
  const db = getDB();

  const equipmentCollection = db.collection("equipment");
  const reviewsCollection = db.collection("reviews");

  if (!ObjectId.isValid(equipmentId)) {
    throw new Error("Invalid equipment ID.");
  }

  // Find approved equipment
  const equipment = await equipmentCollection.findOne({
    _id: new ObjectId(equipmentId),
    status: "approved",
  });

  if (!equipment) {
    throw new Error("Equipment not found.");
  }

  // Get equipment reviews
  const reviews = await reviewsCollection
    .find({
      equipmentId: equipment._id,
    })
    .sort({ createdAt: -1 })
    .toArray();

  // Calculate rating statistics
  const statistics = await reviewsCollection
    .aggregate([
      {
        $match: {
          equipmentId: equipment._id,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const ratingStats = statistics[0] || {
    averageRating: 0,
    totalReviews: 0,
  };

  return {
    reviews,
    averageRating: Number((ratingStats.averageRating || 0).toFixed(1)),
    totalReviews: ratingStats.totalReviews,
  };
};

// Get My Reviews
export const getMyReviews = async (userId) => {
  const reviewsCollection = getDB().collection("reviews");

  const reviews = await reviewsCollection
    .find({
      reviewerId: userId,
    })
    .sort({ createdAt: -1 })
    .toArray();

  return reviews;
};

// Update Review
export const updateReview = async (reviewId, userId, reviewData) => {
  const reviewsCollection = getDB().collection("reviews");

  if (!ObjectId.isValid(reviewId)) {
    throw new Error("Invalid review ID.");
  }

  const result = await reviewsCollection.updateOne(
    {
      _id: new ObjectId(reviewId),
      reviewerId: userId,
    },
    {
      $set: {
        ...reviewData,
        updatedAt: new Date(),
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new Error("Review not found.");
  }

  return {
    message: "Review updated successfully.",
  };
};

// Delete Review
export const deleteReview = async (reviewId, userId) => {
  const reviewsCollection = getDB().collection("reviews");

  if (!ObjectId.isValid(reviewId)) {
    throw new Error("Invalid review ID.");
  }

  const result = await reviewsCollection.deleteOne({
    _id: new ObjectId(reviewId),
    reviewerId: userId,
  });

  if (result.deletedCount === 0) {
    throw new Error("Review not found.");
  }

  return {
    message: "Review deleted successfully.",
  };
};

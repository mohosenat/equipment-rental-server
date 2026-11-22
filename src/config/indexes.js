import { getDB } from "./db.js";

// Create Database Indexes
export const createIndexes = async () => {
  const db = getDB();

  // Favorites Index
  await db
    .collection("favorites")
    .createIndex({ userId: 1, equipmentId: 1 }, { unique: true });

  // Reviews Index
  await db
    .collection("reviews")
    .createIndex({ bookingId: 1, reviewerId: 1 }, { unique: true });

  // Bookings Index
  await db.collection("bookings").createIndex({
    equipmentId: 1,
    status: 1,
    startDate: 1,
    endDate: 1,
  });

  await db.collection("bookings").createIndex({
    renterId: 1,
    createdAt: -1,
  });

  await db.collection("bookings").createIndex({
    ownerId: 1,
    createdAt: -1,
  });

  // Payments Index
  await db.collection("payments").createIndex(
    { stripeSessionId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        stripeSessionId: { $type: "string" },
      },
    },
  );

  console.log("Database indexes created successfully.");
};

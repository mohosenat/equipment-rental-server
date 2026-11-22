import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// Add Equipment to Favorites
export const addFavorite = async (equipmentId, userId) => {
  const db = getDB();

  const equipmentCollection = db.collection("equipment");
  const favoritesCollection = db.collection("favorites");

  const equipment = await equipmentCollection.findOne({
    _id: new ObjectId(equipmentId),
    status: "approved",
  });

  if (!equipment) {
    throw new Error("Equipment not found or not available.");
  }

  const existingFavorite = await favoritesCollection.findOne({
    userId,
    equipmentId: new ObjectId(equipmentId),
  });

  if (existingFavorite) {
    throw new Error("Equipment is already in your favorites.");
  }

  const favorite = {
    userId,
    equipmentId: new ObjectId(equipmentId),
    createdAt: new Date(),
  };

  const result = await favoritesCollection.insertOne(favorite);

  return {
    _id: result.insertedId,
    ...favorite,
  };
};

// Get My Favorite Equipment
export const getMyFavorites = async (userId) => {
  const favoritesCollection = getDB().collection("favorites");

  const favorites = await favoritesCollection
    .aggregate([
      {
        $match: { userId },
      },
      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      {
        $unwind: "$equipment",
      },
      {
        $match: {
          "equipment.status": "approved",
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          userId: 1,
          equipmentId: 1,
          createdAt: 1,
          equipment: 1,
        },
      },
    ])
    .toArray();

  return favorites;
};

// Remove Equipment from Favorites
export const removeFavorite = async (equipmentId, userId) => {
  const favoritesCollection = getDB().collection("favorites");

  if (!ObjectId.isValid(equipmentId)) {
    throw new Error("Invalid equipment ID.");
  }

  const result = await favoritesCollection.deleteOne({
    userId,
    equipmentId: new ObjectId(equipmentId),
  });

  return result;
};

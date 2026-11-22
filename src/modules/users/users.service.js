import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// Find user by ID
const getUserFilter = (userId) => {
  const filters = [{ _id: userId }, { id: userId }];

  if (ObjectId.isValid(userId)) {
    filters.push({
      _id: new ObjectId(userId),
    });
  }

  return { $or: filters };
};

// Return safe user information
const formatUser = (user) => {
  if (!user) return null;

  return {
    id: user.id || user._id?.toString(),
    name: user.name,
    email: user.email,
    image: user.image || null,
    phone: user.phone || "",
    address: user.address || "",
    role: user.role || "customer",
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Get My Profile
export const getMyProfile = async (userId) => {
  const userCollection = getDB().collection("user");

  const user = await userCollection.findOne(getUserFilter(userId));

  if (!user) {
    throw new Error("User not found.");
  }

  return formatUser(user);
};

// Update My Profile
export const updateMyProfile = async (userId, updateData) => {
  const userCollection = getDB().collection("user");

  const result = await userCollection.updateOne(getUserFilter(userId), {
    $set: {
      ...updateData,
      updatedAt: new Date(),
    },
  });

  if (result.matchedCount === 0) {
    throw new Error("User not found.");
  }

  const updatedUser = await userCollection.findOne(getUserFilter(userId));

  return formatUser(updatedUser);
};

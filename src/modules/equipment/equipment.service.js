import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// Create new equipment
export const createEquipment = async (equipmentData) => {
  const equipmentCollection = getDB().collection("equipment");

  const equipment = {
    ...equipmentData,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await equipmentCollection.insertOne(equipment);

  return {
    _id: result.insertedId,
    ...equipment,
  };
};

// Get approved equipment with search, filtering, sorting and optional limit
export const getAllEquipment = async (query = {}) => {
  const equipmentCollection = getDB().collection("equipment");

  const {
    search,
    category,
    rentalType,
    minPrice,
    maxPrice,
    availability,
    sort,
    limit,
  } = query;

  const filter = {
    status: "approved",
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (rentalType) {
    filter.rentalType = rentalType;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  if (availability === "available") {
    filter.quantity = { $gt: 0 };
  } else if (availability === "unavailable") {
    filter.quantity = 0;
  }

  let sortOption = { createdAt: -1 };

  if (sort === "price-low") {
    sortOption = { price: 1 };
  } else if (sort === "price-high") {
    sortOption = { price: -1 };
  } else if (sort === "recent") {
    sortOption = { createdAt: -1 };
  }

  let equipmentQuery = equipmentCollection.find(filter).sort(sortOption);

  if (limit !== undefined) {
    const parsedLimit = Math.max(1, Math.min(Number(limit) || 6, 100));
    equipmentQuery = equipmentQuery.limit(parsedLimit);
  }

  return await equipmentQuery.toArray();
};

// Get single approved equipment by ID
export const getEquipmentById = async (id) => {
  const equipmentCollection = getDB().collection("equipment");

  return await equipmentCollection.findOne({
    _id: new ObjectId(id),
    status: "approved",
  });
};

// Update equipment
export const updateEquipment = async (id, ownerId, equipmentData) => {
  const equipmentCollection = getDB().collection("equipment");

  return await equipmentCollection.updateOne(
    {
      _id: new ObjectId(id),
      ownerId,
    },
    {
      $set: {
        ...equipmentData,
        updatedAt: new Date(),
      },
    },
  );
};

// Delete equipment
export const deleteEquipment = async (id, ownerId) => {
  const equipmentCollection = getDB().collection("equipment");

  return await equipmentCollection.deleteOne({
    _id: new ObjectId(id),
    ownerId,
  });
};

// Get all equipment belonging to the logged-in owner
export const getMyEquipment = async (ownerId) => {
  const equipmentCollection = getDB().collection("equipment");

  return await equipmentCollection
    .find({ ownerId })
    .sort({ createdAt: -1 })
    .toArray();
};

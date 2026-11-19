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

// Get all approved equipment with search, filtering and sorting
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
  } = query;

  // Base query: only approved equipment
  const filter = {
    status: "approved",
  };

  // Search by equipment name and location
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by category
  if (category) {
    filter.category = category;
  }

  // Filter by rental type
  if (rentalType) {
    filter.rentalType = rentalType;
  }

  // Filter by price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  // Filter by availability
  if (availability === "available") {
    filter.quantity = { $gt: 0 };
  } else if (availability === "unavailable") {
    filter.quantity = 0;
  }

  // Sorting
  let sortOption = { createdAt: -1 };

  if (sort === "price-low") {
    sortOption = { price: 1 };
  } else if (sort === "price-high") {
    sortOption = { price: -1 };
  } else if (sort === "recent") {
    sortOption = { createdAt: -1 };
  }

  const equipment = await equipmentCollection
    .find(filter)
    .sort(sortOption)
    .toArray();

  return equipment;
};

// Get single equipment by ID
export const getEquipmentById = async (id) => {
  const equipmentCollection = getDB().collection("equipment");

  const equipment = await equipmentCollection.findOne({
    _id: new ObjectId(id),
    status: "approved",
  });

  return equipment;
};

// Update equipment
export const updateEquipment = async (id, ownerId, equipmentData) => {
  const equipmentCollection = getDB().collection("equipment");

  const result = await equipmentCollection.updateOne(
    {
      _id: new ObjectId(id),
      ownerId: ownerId,
    },
    {
      $set: {
        ...equipmentData,
        updatedAt: new Date(),
      },
    },
  );

  return result;
};

// Delete equipment
export const deleteEquipment = async (id, ownerId) => {
  const equipmentCollection = getDB().collection("equipment");

  const result = await equipmentCollection.deleteOne({
    _id: new ObjectId(id),
    ownerId: ownerId,
  });

  return result;
};

import { getDB } from "../../config/db.js";

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

// Get all approved equipment
export const getAllEquipment = async () => {
  const equipmentCollection = getDB().collection("equipment");

  const equipment = await equipmentCollection
    .find({ status: "approved" })
    .sort({ createdAt: -1 })
    .toArray();

  return equipment;
};

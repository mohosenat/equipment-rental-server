import { createEquipment, getAllEquipment } from "./equipment.service.js";
import { validateEquipment } from "./equipment.validation.js";

// Create new equipment
export const createEquipmentController = async (req, res) => {
  try {
    // Validate request data
    const validation = validateEquipment(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Equipment validation failed.",
        errors: validation.errors,
      });
    }

    // Prepare equipment data
    const equipmentData = {
      ...validation.data,
      ownerId: req.user.id,
      ownerEmail: req.user.email,
    };

    // Save equipment
    const equipment = await createEquipment(equipmentData);

    return res.status(201).json({
      success: true,
      message: "Equipment created successfully. Waiting for admin approval.",
      data: equipment,
    });
  } catch (error) {
    console.error("Create equipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create equipment.",
    });
  }
};

// Get all approved equipment
export const getAllEquipmentController = async (req, res) => {
  try {
    const equipment = await getAllEquipment();

    return res.status(200).json({
      success: true,
      message: "Equipment retrieved successfully.",
      data: equipment,
    });
  } catch (error) {
    console.error("Get equipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve equipment.",
    });
  }
};

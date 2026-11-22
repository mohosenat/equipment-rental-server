import {
  createEquipment,
  getAllEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  getMyEquipment,
} from "./equipment.service.js";

import {
  validateEquipment,
  validateEquipmentUpdate,
} from "./equipment.validation.js";

import { uploadImage } from "../../services/imgbb.service.js";

// Upload Base64 image or use an existing image URL
const processEquipmentImage = async (image) => {
  if (image.startsWith("data:image/")) {
    const uploadedImage = await uploadImage(image);
    return uploadedImage.url;
  }

  return image;
};

// Create new equipment
export const createEquipmentController = async (req, res) => {
  try {
    const validation = validateEquipment(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Equipment validation failed.",
        errors: validation.errors,
      });
    }

    const imageUrl = await processEquipmentImage(validation.data.image);

    const equipmentData = {
      ...validation.data,
      image: imageUrl,
      ownerId: req.user.id,
      ownerEmail: req.user.email,
    };

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
    const equipment = await getAllEquipment(req.query);

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

// Get single equipment by ID
export const getEquipmentByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await getEquipmentById(id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Equipment retrieved successfully.",
      data: equipment,
    });
  } catch (error) {
    console.error("Get equipment by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve equipment.",
    });
  }
};

// Update equipment
export const updateEquipmentController = async (req, res) => {
  try {
    const { id } = req.params;

    const validation = validateEquipmentUpdate(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Equipment validation failed.",
        errors: validation.errors,
      });
    }

    const equipmentData = { ...validation.data };

    if (equipmentData.image) {
      equipmentData.image = await processEquipmentImage(equipmentData.image);
    }

    const result = await updateEquipment(id, req.user.id, equipmentData);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found or you are not the owner.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Equipment updated successfully.",
    });
  } catch (error) {
    console.error("Update equipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update equipment.",
    });
  }
};

// Delete equipment
export const deleteEquipmentController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteEquipment(id, req.user.id);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found or you are not the owner.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Equipment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete equipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete equipment.",
    });
  }
};

// Get all equipment of the logged-in owner
export const getMyEquipmentController = async (req, res) => {
  try {
    const equipment = await getMyEquipment(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Your equipment retrieved successfully.",
      data: equipment,
    });
  } catch (error) {
    console.error("Get my equipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your equipment.",
    });
  }
};

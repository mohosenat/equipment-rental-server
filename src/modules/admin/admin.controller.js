import {
  getAdminEquipment,
  updateAdminEquipmentStatus,
  getAdminUsers,
  updateAdminUserRole,
  getAdminBookings,
  getAdminPayments,
  updateAdminEquipment,
  deleteAdminEquipment,
} from "./admin.service.js";

import {
  validateAdminQuery,
  validateEquipmentStatus,
  validateUserRole,
} from "./admin.validation.js";

import { validateEquipmentUpdate } from "../equipment/equipment.validation.js";

// Get All Equipment
export const getAdminEquipmentController = async (req, res) => {
  try {
    const validation = validateAdminQuery(req.query);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await getAdminEquipment(validation.data);

    return res.status(200).json({
      success: true,
      message: "Equipment retrieved successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Admin equipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve equipment.",
    });
  }
};

// Approve or Reject Equipment
export const updateAdminEquipmentStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = validateEquipmentStatus(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await updateAdminEquipmentStatus(id, validation.data.status);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Pending equipment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Equipment ${validation.data.status} successfully.`,
    });
  } catch (error) {
    console.error("Equipment moderation error:", error);

    if (error.message === "Invalid equipment ID.") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update equipment status.",
    });
  }
};

// Get All Users
export const getAdminUsersController = async (req, res) => {
  try {
    const validation = validateAdminQuery(req.query);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await getAdminUsers(validation.data);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
    });
  }
};

// Update User Role
export const updateAdminUserRoleController = async (req, res) => {
  try {
    const { userId } = req.params;
    const validation = validateUserRole(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await updateAdminUserRole(
      userId,
      validation.data.role,
      req.user.id,
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
    });
  } catch (error) {
    console.error("Update user role error:", error);

    if (error.message === "You cannot change your own role.") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user role.",
    });
  }
};

// Get All Bookings
export const getAdminBookingsController = async (req, res) => {
  try {
    const validation = validateAdminQuery(req.query);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await getAdminBookings(validation.data);

    return res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Admin bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings.",
    });
  }
};

// Get All Payments
export const getAdminPaymentsController = async (req, res) => {
  try {
    const validation = validateAdminQuery(req.query);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await getAdminPayments(validation.data);

    return res.status(200).json({
      success: true,
      message: "Payments retrieved successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Admin payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payments.",
    });
  }
};
// Update Equipment for Admin
export const updateAdminEquipmentController = async (req, res) => {
  try {
    const { id } = req.params;

    const validation = validateEquipmentUpdate(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const result = await updateAdminEquipment(id, validation.data);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Equipment updated successfully.",
    });
  } catch (error) {
    console.error("Admin equipment update error:", error);

    if (error.message === "Invalid equipment ID.") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update equipment.",
    });
  }
};

// Delete Equipment for Admin
export const deleteAdminEquipmentController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteAdminEquipment(id);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Equipment deleted successfully.",
    });
  } catch (error) {
    console.error("Admin equipment delete error:", error);

    if (error.message === "Invalid equipment ID.") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete equipment.",
    });
  }
};

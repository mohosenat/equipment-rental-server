import { Router } from "express";

import { verifyToken, verifyOwner } from "../../middlewares/auth.js";
import {
  createEquipmentController,
  getAllEquipmentController,
  getEquipmentByIdController,
  updateEquipmentController,
  deleteEquipmentController,
} from "./equipment.controller.js";

const router = Router();

// Get all approved equipment
router.get("/", getAllEquipmentController);

// Get single equipment by ID
router.get("/:id", getEquipmentByIdController);

// Create new equipment
router.post("/", verifyToken, verifyOwner, createEquipmentController);

// Update equipment
router.patch("/:id", verifyToken, verifyOwner, updateEquipmentController);

// Delete equipment
router.delete("/:id", verifyToken, verifyOwner, deleteEquipmentController);

export default router;

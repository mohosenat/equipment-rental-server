import { Router } from "express";

import { verifyToken, verifyOwner } from "../../middlewares/auth.js";
import {
  createEquipmentController,
  getAllEquipmentController,
} from "./equipment.controller.js";

const router = Router();

// Get all approved equipment
router.get("/", getAllEquipmentController);

// Create new equipment
router.post("/", verifyToken, verifyOwner, createEquipmentController);

export default router;

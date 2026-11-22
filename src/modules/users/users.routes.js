import { Router } from "express";

import { verifyToken } from "../../middlewares/auth.js";

import {
  getMyProfileController,
  updateMyProfileController,
} from "./users.controller.js";

const router = Router();

// Get My Profile
router.get("/me", verifyToken, getMyProfileController);

// Update My Profile
router.patch("/me", verifyToken, updateMyProfileController);

export default router;

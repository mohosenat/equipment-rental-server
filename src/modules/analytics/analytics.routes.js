import { Router } from "express";

import {
  verifyToken,
  verifyOwner,
  verifyAdmin,
} from "../../middlewares/auth.js";

import {
  getOwnerAnalyticsController,
  getAdminAnalyticsController,
} from "./analytics.controller.js";

const router = Router();

// Owner dashboard analytics
router.get("/owner", verifyToken, verifyOwner, getOwnerAnalyticsController);

// Admin dashboard analytics
router.get("/admin", verifyToken, verifyAdmin, getAdminAnalyticsController);

export default router;

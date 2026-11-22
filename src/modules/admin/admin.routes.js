import { Router } from "express";

import { verifyToken, verifyAdmin } from "../../middlewares/auth.js";

import {
  getAdminEquipmentController,
  updateAdminEquipmentStatusController,
  getAdminUsersController,
  updateAdminUserRoleController,
  getAdminBookingsController,
  getAdminPaymentsController,
  updateAdminEquipmentController,
  deleteAdminEquipmentController,
} from "./admin.controller.js";

const router = Router();

// Protect all admin routes
router.use(verifyToken, verifyAdmin);

// Equipment Management
router.get("/equipment", getAdminEquipmentController);

router.patch("/equipment/:id/status", updateAdminEquipmentStatusController);

router.patch("/equipment/:id", updateAdminEquipmentController);

router.delete("/equipment/:id", deleteAdminEquipmentController);
// User Management
router.get("/users", getAdminUsersController);

router.patch("/users/:userId/role", updateAdminUserRoleController);

// Booking Management
router.get("/bookings", getAdminBookingsController);

// Payment Management
router.get("/payments", getAdminPaymentsController);

export default router;

import { Router } from "express";
import equipmentRoutes from "../modules/equipment/equipment.routes.js";
import bookingsRoutes from "../modules/bookings/bookings.routes.js";

const router = Router();

// Equipment routes
router.use("/equipment", equipmentRoutes);

// Booking routes
router.use("/bookings", bookingsRoutes);

export default router;

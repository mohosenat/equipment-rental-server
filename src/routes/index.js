import { Router } from "express";
import equipmentRoutes from "../modules/equipment/equipment.routes.js";

const router = Router();

// Equipment routes
router.use("/equipment", equipmentRoutes);

export default router;

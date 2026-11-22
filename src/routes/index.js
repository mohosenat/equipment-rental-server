import { Router } from "express";
import equipmentRoutes from "../modules/equipment/equipment.routes.js";
import bookingsRoutes from "../modules/bookings/bookings.routes.js";
import paymentsRoutes from "../modules/payments/payments.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import favoritesRoutes from "../modules/favorites/favorites.routes.js";
import ownerRoutes from "../modules/owner/owner.routes.js";
import reviewsRoutes from "../modules/reviews/reviews.routes.js";

const router = Router();

// Equipment routes
router.use("/equipment", equipmentRoutes);

// Booking routes
router.use("/bookings", bookingsRoutes);

// Payment routes
router.use("/payments", paymentsRoutes);

// Users routes
router.use("/users", usersRoutes);

// Analytics routes
router.use("/analytics", analyticsRoutes);

// Admin routes
router.use("/admin", adminRoutes);

// Favorites routes
router.use("/favorites", favoritesRoutes);

// Owner routes
router.use("/owner", ownerRoutes);

// Reviews routes
router.use("/reviews", reviewsRoutes);

export default router;

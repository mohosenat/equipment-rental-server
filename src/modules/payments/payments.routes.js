import { Router } from "express";
import { verifyToken, verifyRenter } from "../../middlewares/auth.js";
import { createCheckoutSessionController } from "./payments.controller.js";

const router = Router();

// All payment routes require authenticated renter
router.use(verifyToken, verifyRenter);

// Create Stripe Checkout Session
router.post("/create-checkout-session", createCheckoutSessionController);

export default router;

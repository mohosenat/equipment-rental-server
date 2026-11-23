import { Router } from "express";

import { verifyToken, verifyRenter } from "../../middlewares/auth.js";

import {
  createCheckoutSessionController,
  getCheckoutSessionStatusController,
} from "./payments.controller.js";

const router = Router();

// Protected renter routes
router.use(verifyToken, verifyRenter);

// Create Stripe Checkout Session
router.post("/create-checkout-session", createCheckoutSessionController);

// Verify Stripe Checkout Session
router.get("/session-status/:sessionId", getCheckoutSessionStatusController);

export default router;

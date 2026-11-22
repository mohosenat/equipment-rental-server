import { createBooking } from "../bookings/bookings.service.js";
import { validateBooking } from "../bookings/bookings.validation.js";
import {
  createCheckoutSession,
  completeCheckoutSession,
} from "./payments.service.js";
import stripe from "../../config/stripe.js";

// Create Stripe Checkout Session
export const createCheckoutSessionController = async (req, res) => {
  try {
    const validation = validateBooking(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Prepare booking data and check equipment availability.
    const booking = await createBooking(validation.data, req.user);

    // Create Stripe Checkout Session.
    const session = await createCheckoutSession(booking);

    return res.status(201).json({
      success: true,
      message: "Checkout session created successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Create Checkout Session Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create checkout session.",
    });
  }
};

// Verify Stripe Webhook
export const stripeWebhookController = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({
      success: false,
      message: "Stripe signature is missing.",
    });
  }

  let event;

  // Step 1: Verify Stripe webhook signature.
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Stripe Webhook Signature Error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Invalid Stripe webhook signature.",
    });
  }

  // Step 2: Handle successful Checkout Session.
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      await completeCheckoutSession(session);
    }

    return res.status(200).json({
      success: true,
      message: "Webhook received successfully.",
    });
  } catch (error) {
    // Return 500 so Stripe can retry the webhook.
    console.error("Stripe Webhook Processing Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process Stripe webhook.",
    });
  }
};

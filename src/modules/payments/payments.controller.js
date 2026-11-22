import { createBooking } from "../bookings/bookings.service.js";
import { validateBooking } from "../bookings/bookings.validation.js";
import {
  createCheckoutSession,
  completeCheckoutSession,
} from "./payments.service.js";
import stripe from "../../config/stripe.js";

// Create Checkout Session
export const createCheckoutSessionController = async (req, res) => {
  const validation = validateBooking(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  // Prepare booking data and check equipment availability
  const booking = await createBooking(validation.data, req.user);

  // Create Stripe Checkout Session
  const session = await createCheckoutSession(booking);

  return res.status(201).json({
    success: true,
    message: "Checkout session created successfully.",
    data: session,
  });
};

// Verify Stripe Webhook
export const stripeWebhookController = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid Stripe webhook signature.",
    });
  }

  // Handle successful Checkout Session
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    await completeCheckoutSession(session);
  }

  return res.status(200).json({
    success: true,
    message: "Webhook received successfully.",
  });
};

import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

import { verifyToken } from "./middlewares/auth.js";

import apiRoutes from "./routes/index.js";

export const createApp = (auth) => {
  const app = express();

  // CORS
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    }),
  );

  // Health check
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      message: "RENTRO API is running.",
    });
  });

  // Better Auth handler
  // Must be before express.json()
  app.all("/api/auth/*splat", toNodeHandler(auth));

  // Body parser
  app.use(express.json());

  //API routes
  app.use("/api", apiRoutes);

  // Temporary authentication test route
  app.get("/api/test-auth", verifyToken, (req, res) => {
    res.status(200).json({
      success: true,
      message: "JWT verification successful!",
      user: req.user,
    });
  });

  return app;
};

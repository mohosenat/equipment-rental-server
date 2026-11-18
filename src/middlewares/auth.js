import { jwtVerify, createRemoteJWKSet } from "jose";
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

let JWKS;

const getJWKS = () => {
  if (!JWKS) {
    const baseURL = process.env.BETTER_AUTH_URL;

    if (!baseURL) {
      throw new Error("BETTER_AUTH_URL is missing.");
    }

    JWKS = createRemoteJWKSet(new URL(`${baseURL}/api/auth/jwks`));
  }

  return JWKS;
};

// Verify JWT and identify the current user
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Authentication token required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const baseURL = process.env.BETTER_AUTH_URL;

    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: baseURL,
      audience: baseURL,
    });

    if (!payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // Get the latest user information and role from MongoDB
    if (!ObjectId.isValid(payload.sub)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID in token.",
      });
    }

    const user = await getDB()
      .collection("user")
      .findOne({ _id: new ObjectId(payload.sub) });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    req.user = {
      id: payload.sub,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

// Role-based authorization
const checkRole = (allowedRole) => {
  return (req, res, next) => {
    if (req.user?.role !== allowedRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have permission.",
      });
    }

    next();
  };
};

// Customer (Renter) access
export const verifyRenter = checkRole("customer");

// Equipment Owner access
export const verifyOwner = checkRole("owner");

// Admin access
export const verifyAdmin = checkRole("admin");

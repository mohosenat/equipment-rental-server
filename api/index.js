import { connectDB } from "../src/config/db.js";
import { createIndexes } from "../src/config/indexes.js";
import { createAuth } from "../src/config/auth.js";
import { createApp } from "../src/app.js";

let app;
let initializationPromise;

const initializeApp = async () => {
  await connectDB();
  await createIndexes();

  const auth = createAuth();

  return createApp(auth);
};

export default async function handler(req, res) {
  try {
    if (!initializationPromise) {
      initializationPromise = initializeApp();
    }

    if (!app) {
      app = await initializationPromise;
    }

    return app(req, res);
  } catch (error) {
    initializationPromise = undefined;

    console.error("Application initialization failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

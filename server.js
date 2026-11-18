import dotenv from "dotenv";

import { connectDB } from "./src/config/db.js";
import { createAuth } from "./src/config/auth.js";
import { createApp } from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Connect MongoDB
    await connectDB();

    // Initialize Better Auth
    const auth = createAuth();

    // Create Express application
    const app = createApp(auth);

    // Start listening
    app.listen(PORT, () => {
      console.log(`RENTRO server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

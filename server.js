import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Import project modules after loading .env
    const { connectDB } = await import("./src/config/db.js");
    const { createIndexes } = await import("./src/config/indexes.js");
    const { createAuth } = await import("./src/config/auth.js");
    const { createApp } = await import("./src/app.js");

    // Connect MongoDB
    await connectDB();

    // Create Database Indexes
    await createIndexes();

    // Initialize Better Auth
    const auth = createAuth();

    // Create Express application
    const app = createApp(auth);

    // Start listening
    app.listen(PORT, () => {
      console.log(`RENTRO server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

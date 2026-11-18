import { MongoClient } from "mongodb";

let client;
let database;

export const connectDB = async () => {
  try {
    if (database) {
      return database;
    }

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    if (!uri) {
      throw new Error("MONGODB_URI is missing from environment variables.");
    }

    if (!dbName) {
      throw new Error("DB_NAME is missing from environment variables.");
    }

    client = new MongoClient(uri);

    await client.connect();

    database = client.db(dbName);

    await database.command({ ping: 1 });

    console.log(`MongoDB connected successfully: ${dbName}`);

    return database;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export const getDB = () => {
  if (!database) {
    throw new Error("Database is not connected yet.");
  }

  return database;
};

export const getMongoClient = () => {
  if (!client) {
    throw new Error("MongoDB client is not initialized.");
  }

  return client;
};

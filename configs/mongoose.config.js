import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smart_constructor";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.info("✅ MongoDB connected!", mongoose.connection.name);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

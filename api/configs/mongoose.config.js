import mongoose from "mongoose";
import { config } from "./env.js";

export async function initMongoDB() {
  try {
    await mongoose.connect(config.mongodb.uri);

    await mongoose.connection.db.admin().ping();

    console.info("connected to mongodb");
  } catch (error) {
    console.error("failed connecting to mongodb", error);

    process.exit(1);
  }
}

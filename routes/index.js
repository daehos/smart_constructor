import express from "express";
import authRoutes from "./auth.route.js";

const router = express.Router();

console.log("✅ routes/index.js loaded");
router.use("/auth", authRoutes);

export default router;

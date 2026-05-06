import express from "express";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("", authenticateJWT, userRoutes);

export default router;

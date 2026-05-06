import express from "express";
import { attachActivityCtx } from "../middlewares/activity-log.middleware.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import activityLogRoutes from "./activity-log.route.js";
import attendanceRoutes from "./attendance.route.js";
import authRoutes from "./auth.route.js";
import materialRoutes from "./material.route.js";
import orderRoutes from "./order.route.js";
import payrollRoutes from "./payroll.route.js";
import projectRoutes from "./project.route.js";
import userRoutes from "./user.route.js";
import vendorRoutes from "./vendor.route.js";
import workerRoutes from "./worker.route.js";

const router = express.Router();

router.use(attachActivityCtx);

router.use("/auth", authRoutes);
router.use("", authenticateJWT, userRoutes);
router.use("/vendors", vendorRoutes);
router.use("/projects", projectRoutes);
router.use("/materials", materialRoutes);
router.use("/orders", orderRoutes);
router.use("/workers", workerRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/payroll", payrollRoutes);
router.use("/activity-logs", activityLogRoutes);

export default router;

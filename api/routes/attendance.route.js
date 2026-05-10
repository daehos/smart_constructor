import { Router } from "express";
import AttendanceController from "../controllers/attendance.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateJWT);

router.get("/site", AttendanceController.getSite);
router.post("/check-location", AttendanceController.checkLocation);
router.post("/clock-in", AttendanceController.clockIn);
router.post("/clock-out", AttendanceController.clockOut);
router.get("/today", AttendanceController.getToday);
router.get("/me", AttendanceController.listMine);
router.get("/me/week", AttendanceController.weekSummary);
router.get("/me/calendar", AttendanceController.monthCalendar);

export default router;

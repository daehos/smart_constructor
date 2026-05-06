import { Router } from "express";
import ActivityLogController from "../controllers/activity-log.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateJWT);

router.get("/", ActivityLogController.list);
router.get("/me", ActivityLogController.listMe);

export default router;

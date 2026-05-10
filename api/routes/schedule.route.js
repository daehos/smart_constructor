import { Router } from "express";
import ScheduleController from "../controllers/schedule.controller.js";

const router = Router();

router.post("/", ScheduleController.create);
router.get("/", ScheduleController.list);
router.get("/:id", ScheduleController.getById);
router.patch("/:id", ScheduleController.update);
router.delete("/:id", ScheduleController.cancel);

export default router;

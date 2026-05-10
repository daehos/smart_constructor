import { Router } from "express";
import WorkerController from "../controllers/worker.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateJWT);

router.get("/", WorkerController.list);
router.post("/", WorkerController.create);
router.get("/:id", WorkerController.getById);
router.patch("/:id", WorkerController.update);
router.delete("/:id", WorkerController.delete);

export default router;

import { Router } from "express";
import ProjectController from "../controllers/project.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateJWT);

router.get("/", ProjectController.list);
router.post("/", ProjectController.create);
router.get("/:id", ProjectController.getById);
router.patch("/:id", ProjectController.update);
router.delete("/:id", ProjectController.delete);

export default router;

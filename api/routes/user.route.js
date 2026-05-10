import { Router } from "express";
import UserController from "../controllers/user.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateJWT);
router.get("/profile", UserController.getProfile);

export default router;

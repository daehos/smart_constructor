import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/register/verify-otp", AuthController.verifyRegisterOTP);

router.post("/login", AuthController.login);

export default router;

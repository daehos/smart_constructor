import { Router } from "express";
import OrderController from "../controllers/order.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateJWT);

router.post("/", OrderController.create);
router.get("/", OrderController.list);
router.get("/:id", OrderController.getById);
router.post("/:id/cancel", OrderController.cancel);
router.post("/:id/return", OrderController.return);
router.post("/:id/repeat", OrderController.repeat);

export default router;

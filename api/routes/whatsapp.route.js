import { Router } from "express";
import WhatsappController from "../controllers/whatsapp.controller.js";

const router = Router();

router.get("/status", WhatsappController.getStatus);
router.get("/qr", WhatsappController.getQR);
router.post("/send", WhatsappController.sendImmediate);

export default router;

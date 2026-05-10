import { Router } from "express";
import ReceiptController from "../controllers/receipt.controller.js";
import { handleReceiptUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/", handleReceiptUpload, ReceiptController.create);
router.get("/", ReceiptController.list);
router.get("/:id", ReceiptController.getById);
router.post("/:id/confirm", ReceiptController.confirm);

export default router;

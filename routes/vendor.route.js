import { Router } from "express";
import VendorController from "../controllers/vendor.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateJWT);

router.get("/", VendorController.list);
router.post("/", VendorController.create);
router.get("/:id", VendorController.getById);
router.patch("/:id", VendorController.update);
router.delete("/:id", VendorController.delete);
router.get("/:id/material-history", VendorController.getMaterialPriceHistory);
router.post("/:id/material-history", VendorController.addMaterialPrice);
router.get("/:id/audit", VendorController.getAuditHistory);

export default router;

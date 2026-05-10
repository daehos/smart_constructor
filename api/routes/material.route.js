import { Router } from "express";
import MaterialController from "../controllers/material.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateJWT);

// price-comparison must be before /:id to avoid Express matching "price-comparison" as an id
router.get("/price-comparison", MaterialController.priceComparison);
router.get("/", MaterialController.list);
router.post("/", MaterialController.create);
router.get("/:id", MaterialController.getById);
router.patch("/:id", MaterialController.update);
router.delete("/:id", MaterialController.delete);

export default router;

import { Router } from "express";
import PayrollController from "../controllers/payroll.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateJWT);

router.get("/me", PayrollController.getMyPayroll);
router.get("/", PayrollController.list);
router.post("/", PayrollController.create);
router.get("/:id", PayrollController.getById);
router.patch("/:id", PayrollController.update);
router.delete("/:id", PayrollController.delete);
router.post("/:id/mark-paid", PayrollController.markPaid);

export default router;

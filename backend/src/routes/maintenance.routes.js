import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getMaintenanceExpenses,
  createMaintenanceExpense,
  updateMaintenanceExpense,
  deleteMaintenanceExpense,
} from "../controllers/maintenance.controller.js";
import upload from "../utils/multer.config.js";

const router = express.Router();
router.use(protect, authorize("property-owner", "property-manager", "super-admin"));

router.route("/")
  .get(getMaintenanceExpenses)
  .post(upload.single("receipt"), createMaintenanceExpense);

router.route("/:id")
  .put(upload.single("receipt"), updateMaintenanceExpense)
  .delete(deleteMaintenanceExpense);

export default router;

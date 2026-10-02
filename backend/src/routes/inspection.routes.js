import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  addInspectionDamage,
  compareInspections,
} from "../controllers/inspection.controller.js";
import upload from "../utils/multer.config.js";

const router = express.Router();
router.use(protect, authorize("property-owner", "property-manager", "super-admin"));

router.route("/")
  .get(getInspections)
  .post(upload.array("media", 10), createInspection);

router.route("/compare/:propertyId")
  .get(compareInspections);

router.route("/:id")
  .get(getInspection)
  .put(upload.array("media", 10), updateInspection);

router.route("/:id/damages")
  .post(addInspectionDamage);

export default router;
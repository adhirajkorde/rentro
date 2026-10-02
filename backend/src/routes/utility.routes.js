import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getUtilityCharges,
  createUtilityCharge,
  updateUtilityCharge,
  deleteUtilityCharge,
} from "../controllers/utility.controller.js";
import upload from "../utils/multer.config.js";

const router = express.Router();
router.use(protect, authorize("property-owner", "property-manager", "super-admin"));

router.route("/")
  .get(getUtilityCharges)
  .post(upload.single("meterPhoto"), createUtilityCharge);

router.route("/:id")
  .put(upload.single("meterPhoto"), updateUtilityCharge)
  .delete(deleteUtilityCharge);

export default router;

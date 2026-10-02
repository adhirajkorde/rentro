import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getAgreements,
  getAgreement,
  createAgreement,
  updateAgreement,
  deleteAgreement,
  toggleAgreementStatus,
  downloadAgreementPdf,
} from "../controllers/agreement.controller.js";

const router = express.Router();
router.use(protect, authorize("property-owner", "property-manager", "super-admin"));

router.route("/")
  .get(getAgreements)
  .post(createAgreement);

router.route("/:id")
  .get(getAgreement)
  .put(updateAgreement)
  .delete(deleteAgreement);

router.route("/:id/status")
  .put(toggleAgreementStatus);

router.route("/:id/pdf")
  .get(downloadAgreementPdf);

export default router;
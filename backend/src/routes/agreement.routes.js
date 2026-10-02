import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getAgreements,
  getAgreement,
  createAgreement,
  updateAgreement,
  deleteAgreement,
  toggleAgreementStatus,
  generateAgreementPdf,
} from "../controllers/agreement.controller.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(getAgreements);

router.route("/")
  .post(createAgreement);

router.route("/:id")
  .get(getAgreement)
  .put(updateAgreement);

router.route("/:id/status")
  .put(toggleAgreementStatus);

router.route("/:id/pdf")
  .get(generateAgreementPdf);

export default router;
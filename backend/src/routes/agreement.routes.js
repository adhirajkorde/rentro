import express from "express";
import {
  getAgreements,
  getAgreement,
  createAgreement,
  updateAgreement,
  deleteAgreement,
  toggleAgreementStatus,
} from "../controllers/agreement.controller.js";

const router = express.Router();

router.route("/")
  .get(getAgreements);

router.route("/")
  .post(createAgreement);

router.route("/:id")
  .get(getAgreement)
  .put(updateAgreement);

router.route("/:id/status")
  .put(toggleAgreementStatus);

export default router;
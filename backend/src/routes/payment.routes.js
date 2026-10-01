import express from "express";
import {
  getPayments,
  getPayment,
  createPayment,
  getTenantPayments,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.route("/")
  .get(getPayments);

router.route("/tenant/:tenantId")
  .get(getTenantPayments);

router.route("/")
  .post(createPayment);

router.route("/:id")
  .get(getPayment);

export default router;
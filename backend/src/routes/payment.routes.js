import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getPayments,
  getPayment,
  createPayment,
  getTenantPayments,
  generatePaymentReceipt,
} from "../controllers/payment.controller.js";

const router = express.Router();
router.use(protect, authorize("property-owner"));

router.route("/")
  .get(getPayments);

router.route("/tenant/:tenantId")
  .get(getTenantPayments);

router.route("/")
  .post(createPayment);

router.route("/:id")
  .get(getPayment);

router.route("/:id/receipt")
  .get(generatePaymentReceipt);

export default router;
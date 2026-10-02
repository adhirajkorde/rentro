import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getPayments,
  getPayment,
  createPayment,
  getTenantPayments,
  downloadPaymentReceipt,
} from "../controllers/payment.controller.js";

const router = express.Router();
router.use(protect, authorize("property-owner", "property-manager", "super-admin"));

router.route("/")
  .get(getPayments)
  .post(createPayment);

router.route("/tenant/:tenantId")
  .get(getTenantPayments);

router.route("/:id")
  .get(getPayment);

router.route("/:id/receipt")
  .get(downloadPaymentReceipt);

export default router;
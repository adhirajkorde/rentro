import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getPayments,
  getPayment,
  createPayment,
  getTenantPayments,
} from "../controllers/payment.controller.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(getPayments);

router.route("/tenant/:tenantId")
  .get(getTenantPayments);

router.route("/")
  .post(createPayment);

router.route("/:id")
  .get(getPayment);

export default router;
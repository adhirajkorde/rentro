import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getSecurityDeposits,
  getSecurityDeposit,
  createSecurityDeposit,
  updateSecurityDeposit,
  processFinalSettlement,
} from "../controllers/deposit.controller.js";

const router = express.Router();
router.use(protect, authorize("property-owner", "property-manager", "super-admin"));

router.route("/")
  .get(getSecurityDeposits)
  .post(createSecurityDeposit);

router.route("/settlement")
  .post(processFinalSettlement);

router.route("/:id")
  .get(getSecurityDeposit)
  .put(updateSecurityDeposit);

router.route("/:id/settlement")
  .post(processFinalSettlement);

export default router;

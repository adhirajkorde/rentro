import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getRentRecords,
  getRentRecord,
  createRentRecord,
  updateRentRecord,
  getTenantRentHistory,
} from "../controllers/rent.controller.js";

const router = express.Router();
router.use(protect, authorize("property-owner"));

router.route("/")
  .get(getRentRecords);

router.route("/tenant/:tenantId")
  .get(getTenantRentHistory);

router.route("/")
  .post(createRentRecord);

router.route("/:id")
  .get(getRentRecord)
  .put(updateRentRecord);

export default router;
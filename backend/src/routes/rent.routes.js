import express from "express";
import {
  getRentRecords,
  getRentRecord,
  createRentRecord,
  updateRentRecord,
  getTenantRentHistory,
} from "../controllers/rent.controller.js";

const router = express.Router();

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
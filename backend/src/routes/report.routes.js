import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { getReportsSummary, exportReportsCsv } from "../controllers/report.controller.js";

const router = express.Router();
router.use(protect, authorize("property-owner", "property-manager", "super-admin"));

router.get("/summary", getReportsSummary);
router.get("/export", exportReportsCsv);
router.get("/", getReportsSummary);

export default router;

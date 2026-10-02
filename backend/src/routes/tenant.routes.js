import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  searchTenants,
  filterTenants,
} from "../controllers/tenant.controller.js";

const router = express.Router();
// Tenant routes - authenticated owner can manage tenant records
router.use(protect, authorize("property-owner"));

router.route("/")
  .get(getTenants);

router.route("/:id")
  .get(getTenant)
  .put(updateTenant)
  .delete(deleteTenant);

router.route("/search")
  .get(searchTenants);

router.route("/filters")
  .get(filterTenants);

export default router;
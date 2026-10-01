import express from "express";
import { protect } from "../middleware/auth.middleware.js";
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
router.use(protect);

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
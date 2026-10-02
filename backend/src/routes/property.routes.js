import express from "express";
import * as propertyController from "../controllers/property.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protect, authorize("property-owner", "property-manager", "super-admin"));

router.route("/")
  .get(propertyController.getProperties)
  .post(propertyController.createProperty);

router.route("/search")
  .get(propertyController.searchProperties);

router.route("/filters")
  .get(propertyController.filterProperties);

router.route("/:id")
  .get(propertyController.getProperty)
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

router.route("/:id/status")
  .put(propertyController.togglePropertyStatus);

export default router;
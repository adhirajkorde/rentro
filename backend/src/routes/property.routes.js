import express from "express";
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties,
  filterProperties,
  togglePropertyStatus,
} from "../controllers/property.controller.js";

const router = express.Router();

router.route("/")
  .get(getProperties)
  .post(createProperty);

router.route("/search")
  .get(searchProperties);

router.route("/filters")
  .get(filterProperties);

router.route("/:id")
  .get(getProperty)
  .put(updateProperty)
  .delete(deleteProperty);

router.route("/:id/status")
  .put(togglePropertyStatus);

export default router;
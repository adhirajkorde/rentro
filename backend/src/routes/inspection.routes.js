import express from "express";
import {
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  getPropertyInspections,
} from "../controllers/inspection.controller.js";

const router = express.Router();

router.route("/")
  .get(getInspections);

router.route("/property/:propertyId")
  .get(getPropertyInspections);

router.route("/:id")
  .get(getInspection)
  .put(updateInspection);

export default router;
import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getPoliceVerifications,
  createPoliceVerification,
} from "../controllers/document.controller.js";
import upload from "../utils/multer.config.js";

const router = express.Router();
router.use(protect, authorize("property-owner", "property-manager", "super-admin"));

router.route("/")
  .get(getDocuments)
  .post(upload.single("file"), createDocument);

router.route("/police-verification")
  .get(getPoliceVerifications)
  .post(createPoliceVerification);

router.route("/:id")
  .get(getDocument)
  .put(upload.single("file"), updateDocument)
  .delete(deleteDocument);

export default router;
import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/document.controller.js";

const router = express.Router();
router.use(protect, authorize("property-owner"));

router.route("/")
  .get(getDocuments);

router.route("/:id")
  .get(getDocument);

router.route("/")
  .post(createDocument);

router.route("/:id")
  .put(updateDocument);

router.route("/:id")
  .delete(deleteDocument);

export default router;
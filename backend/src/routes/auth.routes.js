import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Owner-only routes
router.post("/login", authController.login);
router.post("/change-password", protect, authorize("property-owner"), authController.changePassword);
router.get("/me", protect, authController.getMe);

export default router;
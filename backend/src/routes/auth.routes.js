import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", protect, authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", protect, authController.changePassword);
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);

export default router;
import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);
router.get("/me", getMe);

export default router;
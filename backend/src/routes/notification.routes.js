import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.route("/")
  .get(getNotifications);

router.route("/:id/read")
  .put(markNotificationAsRead);

router.route("/read-all")
  .put(markAllRead);

export default router;
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.model.js";

export const logAction = async (req, res, next) => {
  req.logAction = async (action, resource, resourceId, previousData, newData) => {
    try {
      const userId = req.user ? req.user.id : null;

      await AuditLog.create({
        user: userId,
        action,
        resource,
        resourceId,
        previousData,
        newData,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
    } catch (error) {
      // Log to console but don't block the request
      console.error("Audit log error:", error.message);
    }
  };

  next();
};
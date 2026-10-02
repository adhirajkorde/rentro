import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "rentora-super-secret-owner-jwt-key-2026-prod";
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized to access this route" });
    }
    next();
  };
};

export const checkOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.body.resourceId;
      const resource = await resourceModel.findById(resourceId).select("owner");

      if (!resource) {
        return res.status(404).json({ success: false, message: "Resource not found" });
      }

      if (resource.owner.toString() !== req.user._id.toString() && req.user.role !== "super-admin") {
        return res.status(403).json({ success: false, message: "Not authorized to access this resource" });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

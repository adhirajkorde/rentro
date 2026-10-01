import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }
      res.status(401).json({
        success: false,
        message: "Token invalid",
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
    next();
  };
};

export const checkOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.body.resourceId;

      const resource = await resourceModel.findById(resourceId).select(
        "owner"
      );

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      if (resource.owner.toString() !== req.user._   .id.toString() && req.user.role !== "super-admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this resource",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error checking resource ownership",
      });
    }
  };
};
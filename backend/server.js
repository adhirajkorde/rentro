import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import compression from "compression";
import mongoose from "mongoose";

import authRoutes from "./src/routes/auth.routes.js";
import propertyRoutes from "./src/routes/property.routes.js";
import tenantRoutes from "./src/routes/tenant.routes.js";
import agreementRoutes from "./src/routes/agreement.routes.js";
import rentRoutes from "./src/routes/rent.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import inspectionRoutes from "./src/routes/inspection.routes.js";
import documentRoutes from "./src/routes/document.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import auditRoutes from "./src/routes/audit.routes.js";
import { errorHandler } from "./src/middleware/error.middleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(limiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(mongoSanitize());
app.use(xss());
app.use(compression());

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/agreements", agreementRoutes);
app.use("/api/rent", rentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit", auditRoutes);

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/rentora")
  .then(() => {
    console.log("📊 MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("🚨 MongoDB connection error:", err);
    process.exit(1);
  });

const server = app.listen(PORT, () => {
  console.log(`🏢 Rentora Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`🚨 Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;

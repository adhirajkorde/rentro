import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import path from "path";
import fs from "fs";
import { getDatabase } from "./src/config/database.js";

import authRoutes from "./src/routes/auth.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import propertyRoutes from "./src/routes/property.routes.js";
import tenantRoutes from "./src/routes/tenant.routes.js";
import agreementRoutes from "./src/routes/agreement.routes.js";
import rentRoutes from "./src/routes/rent.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import inspectionRoutes from "./src/routes/inspection.routes.js";
import documentRoutes from "./src/routes/document.routes.js";
import maintenanceRoutes from "./src/routes/maintenance.routes.js";
import utilityRoutes from "./src/routes/utility.routes.js";
import depositRoutes from "./src/routes/deposit.routes.js";
import reportRoutes from "./src/routes/report.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import auditRoutes from "./src/routes/audit.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import { errorHandler } from "./src/middleware/error.middleware.js";

const app = express();

// Ensure uploads dir exists
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helmet with relaxed resource policy for static files
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(limiter);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(compression());

// Static file uploads serving
app.use("/uploads", express.static(uploadDir));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/agreements", agreementRoutes);
app.use("/api/rent", rentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/utilities", utilityRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/upload", uploadRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Rentora API is running", timestamp: new Date().toISOString() });
});

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

getDatabase();
console.log("SQLite connected successfully");

const server = app.listen(PORT, () => {
  console.log(`🏢 Rentora Backend running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`🚨 Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

export default app;

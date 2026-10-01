const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
const mongoose = require("mongoose");

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use(limiter);

// Body parsing with size limit
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// XSS protection
app.use(xss());

// Compression
app.use(compression());

// Routes
app.use("/api/auth", require("./src/routes/auth.routes.js"));
app.use("/api/properties", require("./src/routes/property.routes.js"));
app.use("/api/tenants", require("./src/routes/tenant.routes.js"));
app.use("/api/agreements", require("./src/routes/agreement.routes.js"));
app.use("/api/rent", require("./src/routes/rent.routes.js"));
app.use("/api/payments", require("./src/routes/payment.routes.js"));
app.use("/api/inspections", require("./src/routes/inspection.routes.js"));
app.use("/api/documents", require("./src/routes/document.routes.js"));
app.use("/api/notifications", require("./src/routes/notification.routes.js"));
app.use("/api/audit", require("./src/routes/audit.routes.js"));

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    return res.status(400).json({ success: false, message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists. Please use another value.`;
    return res.status(409).json({ success: false, message });
  }

  // Send generic error (don't send stack trace in production)
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/rentora", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const PORT = process.env.PORT || 4000;

    const server = app.listen(PORT, () => {
      console.log(`🏢 Rentora Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Unhandled promise rejection handler
    process.on("unhandledRejection", (err) => {
      console.log(`🚨 Unhandled Rejection: ${err.message}`);
      server.close(() => {
        process.exit(1);
      });
    });
  })
  .catch((err) => {
    console.error("🚨 MongoDB connection error:", err);
    process.exit(1);
  });
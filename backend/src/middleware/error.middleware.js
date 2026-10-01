import ErrorResponse from "../utils/error.util.js";

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json(new ErrorResponse(404, message));
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    return res.status(400).json(new ErrorResponse(400, message));
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists. Please use another value.`;
    return res.status(409).json(new ErrorResponse(409, message));
  }

  // Mongoose double validation
  if (err.name === "MongoServerError") {
    const message = "Database error occurred";
    return res.status(500).json(new ErrorResponse(500, message));
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(new ErrorResponse(401, "Invalid token"));
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json(new ErrorResponse(401, "Token expired"));
  }

  // Send generic error (don't send stack trace in production)
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
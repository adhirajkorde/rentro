import mongoose, { model, models } from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Property name is required"],
      trim: true,
      maxLength: [100, "Property name cannot exceed 100 characters"],
    },
    type: {
      type: String,
      enum: ["house", "flat", "apartment", "shop", "office", "commercial", "other"],
      required: [true, "Property type is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, "Please provide a valid 6-digit pincode"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: (arr) => arr.length === 2,
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },
    area: {
      type: Number,
      min: [0, "Area cannot be negative"],
    },
    bedrooms: {
      type: Number,
      min: [0, "Bedrooms cannot be negative"],
      default: 0,
    },
    bathrooms: {
      type: Number,
      min: [0, "Bathrooms cannot be negative"],
      default: 0,
    },
    furnishingStatus: {
      type: String,
      enum: ["unfurnished", "semi-furnished", "fully-furnished"],
      default: "unfurnished",
    },
    monthlyRent: {
      type: Number,
      min: [0, "Monthly rent cannot be negative"],
      required: [true, "Monthly rent is required"],
    },
    securityDeposit: {
      type: Number,
      min: [0, "Security deposit cannot be negative"],
      default: 0,
    },
    maintenanceCharge: {
      type: Number,
      min: [0, "Maintenance charge cannot be negative"],
      default: 0,
    },
    electricityDetails: {
      type: String,
      trim: true,
    },
    waterDetails: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    propertyManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "under-maintenance", "archived"],
      default: "available",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
propertySchema.index({ owner: 1, status: 1 });
propertySchema.index({ type: 1, status: 1 });
propertySchema.index({ city: 1, state: 1 });
propertySchema.index({ "location.coordinates": "2dsphere" });

export default model("Property", propertySchema);
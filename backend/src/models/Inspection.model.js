const mongoose = require("mongoose");
const { model, models } = mongoose;

const inspectionSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    inspectionDate: {
      type: Date,
      required: [true, "Inspection date is required"],
    },
    type: {
      type: String,
      enum: ["move-in", "move-out", "routine"],
      default: "move-in",
    },
    electricityMeter: {
      type: Number,
    },
    waterMeter: {
      type: Number,
    },
    gasMeter: {
      type: Number,
    },
    generalCondition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    walls: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    floors: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    doors: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    windows: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    kitchen: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    bathroom: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    furniture: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    appliances: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    otherRemarks: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes
inspectionSchema.index({ property: 1, tenant: 1 });
inspectionSchema.index({ type: 1, status: 1 });
inspectionSchema.index({ inspectionDate: 1 });

module.exports = model("Inspection", inspectionSchema);
import mongoose, { model, models } from "mongoose";

const damageSchema = new mongoose.Schema(
  {
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inspection",
      required: true,
    },
    item: {
      type: String,
      required: [true, "Damage item is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    previousCondition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    currentCondition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
    },
    repairRequired: {
      type: Boolean,
      default: false,
    },
    estimatedCost: {
      type: Number,
      min: [0, "Estimated cost cannot be negative"],
    },
    deductionAmount: {
      type: Number,
      min: [0, "Deduction amount cannot be negative"],
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index
damageSchema.index({ inspection: 1 });

export default model("Damage", damageSchema);
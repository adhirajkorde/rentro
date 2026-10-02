import sqlite from "./sqliteSchema.js";
const { model, models } = sqlite;

const utilityChargeSchema = new sqlite.Schema(
  {
    owner: {
      type: sqlite.Schema.Types.ObjectId,
      ref: "User",
    },
    property: {
      type: sqlite.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: sqlite.Schema.Types.ObjectId,
      ref: "Tenant",
    },
    utilityType: {
      type: String,
      enum: ["electricity", "water", "gas", "internet", "other"],
      required: [true, "Utility type is required"],
    },
    billingPeriod: {
      type: String,
      required: [true, "Billing period is required"],
      trim: true,
    },
    meterNumber: {
      type: String,
      trim: true,
    },
    previousReading: {
      type: Number,
      default: 0,
    },
    currentReading: {
      type: Number,
      default: 0,
    },
    unitsConsumed: {
      type: Number,
      default: 0,
    },
    ratePerUnit: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      min: [0, "Amount cannot be negative"],
      required: [true, "Amount is required"],
    },
    dueDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    meterPhoto: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "waived"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank-transfer", "card", "other"],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
utilityChargeSchema.index({ tenant: 1, billingPeriod: 1 });
utilityChargeSchema.index({ property: 1, billingPeriod: 1 });
utilityChargeSchema.index({ utilityType: 1, status: 1 });

export default model("UtilityCharge", utilityChargeSchema);
import sqlite from "./sqliteSchema.js";
const { model, models } = sqlite;

const utilityChargeSchema = new sqlite.Schema(
  {
    tenant: {
      type: sqlite.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    property: {
      type: sqlite.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    billingPeriod: {
      type: String,
      required: [true, "Billing period is required"],
      trim: true,
    },
    utilityType: {
      type: String,
      enum: ["electricity", "water", "internet", "other"],
      required: [true, "Utility type is required"],
    },
    amount: {
      type: Number,
      min: [0, "Amount cannot be negative"],
      required: [true, "Amount is required"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    paidDate: {
      type: Date,
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
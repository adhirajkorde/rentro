import sqlite from "./sqliteSchema.js";
const { model, models } = sqlite;

const securityDepositSchema = new sqlite.Schema(
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
    agreement: {
      type: sqlite.Schema.Types.ObjectId,
      ref: "RentalAgreement",
      required: true,
    },
    depositAmount: {
      type: Number,
      min: [0, "Deposit amount cannot be negative"],
      required: [true, "Deposit amount is required"],
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
      default: 0,
    },
    deductionAmount: {
      type: Number,
      min: [0, "Deduction amount cannot be negative"],
      default: 0,
    },
    deductionReason: {
      type: String,
      trim: true,
    },
    refundDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "partial", "full", "disputed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes
securityDepositSchema.index({ tenant: 1, status: 1 });
securityDepositSchema.index({ property: 1, status: 1 });
securityDepositSchema.index({ agreement: 1 });

export default model("SecurityDeposit", securityDepositSchema);
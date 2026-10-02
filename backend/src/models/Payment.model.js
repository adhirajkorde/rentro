import sqlite from "./sqliteSchema.js";
const { model, models } = sqlite;

const paymentSchema = new sqlite.Schema(
  {
    rentRecord: {
      type: sqlite.Schema.Types.ObjectId,
      ref: "RentRecord",
      required: true,
    },
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
    },
    amount: {
      type: Number,
      min: [0, "Amount cannot be negative"],
      required: [true, "Amount is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank-transfer", "card", "other"],
      required: [true, "Payment method is required"],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ rentRecord: 1 });
paymentSchema.index({ tenant: 1, paymentDate: 1 });
paymentSchema.index({ paymentDate: 1 });

export default model("Payment", paymentSchema);
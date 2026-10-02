import sqlite from "./sqliteSchema.js";
const { model, models } = sqlite;

const maintenanceSchema = new sqlite.Schema(
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
    title: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["plumbing", "electrical", "painting", "cleaning", "repair", "appliance", "maintenance", "renovation", "other"],
      required: [true, "Category is required"],
    },
    amount: {
      type: Number,
      min: [0, "Amount cannot be negative"],
      required: [true, "Amount is required"],
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    vendorName: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "in-progress", "cancelled"],
      default: "paid",
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
maintenanceSchema.index({ property: 1, category: 1 });
maintenanceSchema.index({ owner: 1, status: 1 });

export default model("Maintenance", maintenanceSchema);
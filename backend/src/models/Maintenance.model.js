import mongoose, { model, models } from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    billingPeriod: {
      type: String,
      required: [true, "Billing period is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["maintenance", "electricity", "water", "internet", "other"],
      required: [true, "Category is required"],
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
maintenanceSchema.index({ tenant: 1, billingPeriod: 1 });
maintenanceSchema.index({ property: 1, billingPeriod: 1 });
maintenanceSchema.index({ category: 1, status: 1 });

export default model("Maintenance", maintenanceSchema);
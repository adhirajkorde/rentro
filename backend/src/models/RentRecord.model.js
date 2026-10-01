import mongoose from "mongoose";
const { model, models } = mongoose;

const rentRecordSchema = new mongoose.Schema(
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
    agreement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalAgreement",
    },
    billingMonth: {
      type: Date,
      required: [true, "Billing month is required"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    rentAmount: {
      type: Number,
      min: [0, "Rent amount cannot be negative"],
      required: [true, "Rent amount is required"],
    },
    paidAmount: {
      type: Number,
      min: [0, "Paid amount cannot be negative"],
      default: 0,
    },
    remainingAmount: {
      type: Number,
      min: [0, "Remaining amount cannot be negative"],
      default: 0,
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank-transfer", "card", "other"],
    },
    lateFee: {
      type: Number,
      min: [0, "Late fee cannot be negative"],
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["paid", "unpaid", "partially-paid", "overdue", "waived"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

// Indexes
rentRecordSchema.index({ tenant: 1, billingMonth: 1 });
rentRecordSchema.index({ property: 1, billingMonth: 1 });
rentRecordSchema.index({ status: 1 });
rentRecordSchema.index({ agreement: 1 });

// Calculate remaining amount and status on save
rentRecordSchema.pre("save", function (next) {
  this.remainingAmount = this.rentAmount - this.paidAmount;

  if (this.paidAmount >= this.rentAmount) {
    this.status = "paid";
  } else if (this.paidAmount > 0) {
    this.status = "partially-paid";
  } else {
    this.status = "unpaid";
  }

  next();
});

export default model("RentRecord", rentRecordSchema);
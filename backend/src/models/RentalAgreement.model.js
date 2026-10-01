const mongoose = require("mongoose");
const { model, models } = mongoose;

const rentalAgreementSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
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
    noticePeriod: {
      type: Number,
      default: 30,
    },
    maintenanceResponsibility: {
      type: String,
      trim: true,
    },
    utilityResponsibility: {
      type: String,
      trim: true,
    },
    termsAndConditions: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "active", "expiring-soon", "expired", "terminated"],
      default: "draft",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
rentalAgreementSchema.index({ owner: 1, status: 1 });
rentalAgreementSchema.index({ tenant: 1, status: 1 });
rentalAgreementSchema.index({ property: 1 });
rentalAgreementSchema.index({ status: 1 });

// Compound index for owner + tenant + property
rentalAgreementSchema.index({ owner: 1, tenant: 1, property: 1 });

module.exports = model("RentalAgreement", rentalAgreementSchema);
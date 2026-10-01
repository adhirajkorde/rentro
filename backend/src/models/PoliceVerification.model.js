import mongoose from "mongoose";
const { model, models } = mongoose;

const policeVerificationSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
    referenceNumber: {
      type: String,
      required: [true, "Reference number is required"],
      unique: true,
      trim: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    verificationDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "verified", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    verificationDocument: {
      type: String,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes
policeVerificationSchema.index({ tenant: 1, status: 1 });
policeVerificationSchema.index({ property: 1 });

export default model("PoliceVerification", policeVerificationSchema);
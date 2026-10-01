import mongoose from "mongoose";
const { model, models } = mongoose;

const agreementSignatureSchema = new mongoose.Schema(
  {
    agreement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalAgreement",
      required: true,
    },
    signedBy: {
      type: String,
      enum: ["owner", "tenant"],
      required: true,
    },
    signatureImage: {
      type: String,
      required: true,
    },
    signedAt: {
      type: Date,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index
agreementSignatureSchema.index({ agreement: 1 });

export default model("AgreementSignature", agreementSignatureSchema);
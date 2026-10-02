import sqlite from "./sqliteSchema.js";
const { model, models } = sqlite;

const agreementSignatureSchema = new sqlite.Schema(
  {
    agreement: {
      type: sqlite.Schema.Types.ObjectId,
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
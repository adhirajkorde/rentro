import mongoose from "mongoose";
const { model, models } = mongoose;

const kycDocumentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    documentType: {
      type: String,
      enum: ["aadhaar", "pan", "passport", "driving-license", "other"],
      required: [true, "Document type is required"],
    },
    documentNumber: {
      type: String,
      required: [true, "Document number is required"],
      select: false,
    },
    documentNumberMasked: {
      type: String,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected", "expired"],
      default: "pending",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
kycDocumentSchema.index({ tenant: 1, documentType: 1 });
kycDocumentSchema.index({ verificationStatus: 1 });
kycDocumentSchema.index({ documentNumber: 1 }, { sparse: true });

// Mask sensitive numbers before saving
kycDocumentSchema.pre("save", function (next) {
  if (this.documentNumber) {
    const num = this.documentNumber.replace(/\s+/g, "");
    if (num.length >= 4) {
      const last4 = num.slice(-4);
      if (num.length >= 12) {
        // Aadhaar: XXXX XXXX 1234
        this.documentNumberMasked = `XXXX XXXX ${last4}`;
      } else if (num.length >= 10) {
        // PAN: AAAAA1234A or masked
        this.documentNumberMasked = `*****${last4}`;
      } else {
        this.documentNumberMasked = `XXXX${last4}`;
      }
    } else {
      this.documentNumberMasked = this.documentNumber;
    }
  }
  next();
});

export default model("KycDocument", kycDocumentSchema);
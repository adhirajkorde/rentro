import mongoose, { model, models } from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    resource: {
      type: String,
      enum: [
        "property",
        "tenant",
        "agreement",
        "rent-record",
        "payment",
        "security-deposit",
        "inspection",
        "document",
        "police-verification",
        "maintenance",
        "user",
      ],
      required: [true, "Resource is required"],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    previousData: {
      type: mongoose.Schema.Types.Mixed,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
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

// Indexes
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });

export default model("AuditLog", auditLogSchema);
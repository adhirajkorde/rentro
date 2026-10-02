import sqlite from "./sqliteSchema.js";
const { model, models } = sqlite;

const auditLogSchema = new sqlite.Schema(
  {
    user: {
      type: sqlite.Schema.Types.ObjectId,
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
      type: sqlite.Schema.Types.ObjectId,
    },
    previousData: {
      type: sqlite.Schema.Types.Mixed,
    },
    newData: {
      type: sqlite.Schema.Types.Mixed,
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
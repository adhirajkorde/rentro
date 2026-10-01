const mongoose = require("mongoose");
const { model, models } = mongoose;

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    relatedResource: {
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
      ],
    },
    relatedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = model("Notification", notificationSchema);
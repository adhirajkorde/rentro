const mongoose = require("mongoose");
const { model, models } = mongoose;

const inspectionMediaSchema = new mongoose.Schema(
  {
    inspection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inspection",
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["photo", "video"],
      default: "photo",
    },
    caption: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    publicId: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index
inspectionMediaSchema.index({ inspection: 1, order: 1 });

module.exports = model("InspectionMedia", inspectionMediaSchema);
import mongoose, { model, models } from "mongoose";

const propertyMediaSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
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
    isPrimary: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    publicId: {
      type: String,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index
propertyMediaSchema.index({ property: 1, isPrimary: 1 });

export default model("PropertyMedia", propertyMediaSchema);
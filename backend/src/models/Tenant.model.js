const mongoose = require("mongoose");
const { model } = mongoose;

const tenantSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Tenant full name is required"],
      trim: true,
      maxLength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Tenant email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w{2,}$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    occupation: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    familyOccupantDetails: {
      type: String,
      trim: true,
    },
    moveInDate: {
      type: Date,
    },
    moveOutDate: {
      type: Date,
    },
    currentProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
    previousRentalHistory: [
      {
        property: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Property",
        },
        duration: {
          type: String,
        },
        reason: {
          type: String,
          trim: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
tenantSchema.index({ email: 1 }, { unique: true });
tenantSchema.index({ currentProperty: 1 });

module.exports = model("Tenant", tenantSchema);
import Inspection from "../models/Inspection.model.js";
import Damage from "../models/Damage.model.js";
import InspectionMedia from "../models/InspectionMedia.model.js";
import ErrorResponse from "../utils/error.util.js";
import upload from "../utils/multer.config.js";

export const getInspections = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.property) {
      filter.property = req.query.property;
    }

    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.inspector) {
      filter.inspector = req.query.inspector;
    }

    const inspections = await Inspection.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ inspectionDate: -1 });

    const total = await Inspection.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: inspections.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: inspections,
    });
  } catch (error) {
    console.error("Get inspections error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching inspections",
    });
  }
};

export const getInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate("tenant", "fullName email phone")
      .populate("property", "name address");

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found",
      });
    }

    // Get media for this inspection
    const media = await InspectionMedia.find({ inspection: inspection._id }).sort({
      order: 1,
    });

    // Get damages
    const damages = await Damage.find({ inspection: inspection._id });

    res.status(200).json({
      success: true,
      data: {
        ...inspection.toObject(),
        media,
        damages,
      },
    });
  } catch (error) {
    console.error("Get inspection error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Inspection not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching inspection",
    });
  }
};

export const createInspection = async (req, res) => {
  try {
    const {
      property,
      tenant,
      inspector,
      inspectionDate,
      type,
      electricityMeter,
      waterMeter,
      gasMeter,
    } = req.body;

    if (!property || !tenant || !inspectionDate) {
      return res.status(400).json({
        success: false,
        message: "Property, tenant, and inspection date are required",
      });
    }

    const inspection = await Inspection.create({
      property,
      tenant,
      inspector,
      inspectionDate: new Date(inspectionDate),
      type: type || "move-in",
      electricityMeter,
      waterMeter,
      gasMeter,
    });

    // Handle photo uploads
    if (req.files && req.files.length > 0) {
      const files = req.files;

      for (const file of files) {
        const url = file.path || `/uploads/${file.filename}`;
        const publicId = file.filename;

        await InspectionMedia.create({
          inspection: inspection._id,
          url,
          type: file.mimetype.startsWith("video/") ? "video" : "photo",
          caption: file.filename,
          order: 0, // Will be updated if multiple photos
        });

        // Clean up local file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    // Log action
    if (req.logAction) {
      req.logAction("inspection-created", "inspection", inspection._id);
    }

    res.status(201).json({
      success: true,
      message: "Inspection created successfully",
      data: inspection,
    });
  } catch (error) {
    console.error("Create inspection error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating inspection",
    });
  }
};

export const updateInspection = async (req, res) => {
  try {
    const {
      generalCondition,
      walls,
      floors,
      doors,
      windows,
      kitchen,
      bathroom,
      furniture,
      appliances,
      otherRemarks,
    } = req.body;

    const inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        generalCondition,
        walls,
        floors,
        doors,
        windows,
        kitchen,
        bathroom,
        furniture,
        appliances,
        otherRemarks,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found",
      });
    }

    // Log action
    if (req.logAction) {
      req.logAction("inspection-updated", "inspection", inspection._id);
    }

    res.status(200).json({
      success: true,
      message: "Inspection updated successfully",
      data: inspection,
    });
  } catch (error) {
    console.error("Update inspection error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Inspection not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating inspection",
    });
  }
};

export const getPropertyInspections = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const inspections = await Inspection.find({ property: propertyId })
      .sort({ inspectionDate: -1 });

    const total = inspections.length;

    res.status(200).json({
      success: true,
      count: inspections.length,
      total,
      data: inspections,
    });
  } catch (error) {
    console.error("Get property inspections error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching property inspections",
    });
  }
};
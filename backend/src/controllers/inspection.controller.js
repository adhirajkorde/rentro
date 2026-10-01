import fs from "fs";
import Inspection from "../models/Inspection.model.js";
import Damage from "../models/Damage.model.js";
import InspectionMedia from "../models/InspectionMedia.model.js";

export const getInspections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.property) filter.property = req.query.property;
    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.inspector) filter.inspector = req.query.inspector;

    const [inspections, total] = await Promise.all([
      Inspection.find(filter).skip(skip).limit(limit).sort({ inspectionDate: -1 }),
      Inspection.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: inspections.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: inspections,
    });
  } catch (error) {
    next(error);
  }
};

export const getInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate("tenant", "fullName email phone")
      .populate("property", "name address");

    if (!inspection) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }

    const [media, damages] = await Promise.all([
      InspectionMedia.find({ inspection: inspection._id }).sort({ order: 1 }),
      Damage.find({ inspection: inspection._id }),
    ]);

    res.status(200).json({ success: true, data: { ...inspection.toObject(), media, damages } });
  } catch (error) {
    next(error);
  }
};

export const createInspection = async (req, res, next) => {
  try {
    const { property, tenant, inspector, inspectionDate, type, electricityMeter, waterMeter, gasMeter } = req.body;

    if (!property || !tenant || !inspectionDate) {
      return res.status(400).json({ success: false, message: "Property, tenant, and inspection date are required" });
    }

    const inspection = await Inspection.create({
      property,
      tenant,
      inspector: inspector || req.user._id,
      inspectionDate: new Date(inspectionDate),
      type: type || "move-in",
      electricityMeter,
      waterMeter,
      gasMeter,
    });

    if (req.files && req.files.length > 0) {
      const mediaRecords = req.files.map((file, index) => ({
        inspection: inspection._id,
        url: file.path || `/uploads/${file.filename}`,
        type: file.mimetype.startsWith("video/") ? "video" : "photo",
        caption: file.originalname,
        order: index,
        publicId: file.filename,
      }));

      await InspectionMedia.insertMany(mediaRecords);

      for (const file of req.files) {
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    if (req.logAction) req.logAction("inspection-created", "inspection", inspection._id);

    res.status(201).json({ success: true, message: "Inspection created successfully", data: inspection });
  } catch (error) {
    next(error);
  }
};

export const updateInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!inspection) {
      return res.status(404).json({ success: false, message: "Inspection not found" });
    }

    if (req.logAction) req.logAction("inspection-updated", "inspection", inspection._id);

    res.status(200).json({ success: true, message: "Inspection updated successfully", data: inspection });
  } catch (error) {
    next(error);
  }
};

export const getPropertyInspections = async (req, res, next) => {
  try {
    const inspections = await Inspection.find({ property: req.params.propertyId }).sort({ inspectionDate: -1 });

    res.status(200).json({ success: true, count: inspections.length, data: inspections });
  } catch (error) {
    next(error);
  }
};

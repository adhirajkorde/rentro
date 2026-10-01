import fs from "fs";
import Property from "../models/Property.model.js";
import PropertyMedia from "../models/PropertyMedia.model.js";

const buildPropertyFilter = (query) => {
  const filter = {};
  if (query.owner) filter.owner = query.owner;
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.city) filter.city = query.city;
  if (query.state) filter.state = query.state;
  if (query.minRent || query.maxRent) {
    filter.monthlyRent = {};
    if (query.minRent) filter.monthlyRent.$gte = Number(query.minRent);
    if (query.maxRent) filter.monthlyRent.$lte = Number(query.maxRent);
  }
  return filter;
};

const processUploadedFiles = (files) =>
  (files || []).map((file, index) => ({
    url: file.path || `/uploads/${file.filename}`,
    type: file.mimetype.startsWith("video/") ? "video" : "photo",
    publicId: file.filename,
    index,
  }));

const cleanupLocalFiles = (files) => {
  for (const file of files || []) {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
};

export const getProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = buildPropertyFilter(req.query);

    const [properties, total] = await Promise.all([
      Property.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Property.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

export const getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const media = await PropertyMedia.find({ property: property._id }).sort({ isPrimary: -1, order: 1 });

    res.status(200).json({ success: true, data: { ...property.toObject(), media } });
  } catch (error) {
    next(error);
  }
};

export const createProperty = async (req, res, next) => {
  try {
    const mediaFiles = processUploadedFiles(req.files);

    const {
      name, type, description, address, city, state, country, pincode,
      area, bedrooms, bathrooms, furnishingStatus, monthlyRent,
      securityDeposit, maintenanceCharge, electricityDetails, waterDetails,
      propertyManager, status,
    } = req.body;

    if (!name || !type || !address || !monthlyRent) {
      cleanupLocalFiles(req.files);
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    // Owner is always the authenticated user — never trust frontend
    const property = await Property.create({
      name, type, description, address, city, state, country, pincode,
      area, bedrooms, bathrooms, furnishingStatus, monthlyRent,
      securityDeposit, maintenanceCharge, electricityDetails, waterDetails,
      owner: req.user._id,
      propertyManager,
      status,
    });

    if (mediaFiles.length > 0) {
      await PropertyMedia.insertMany(
        mediaFiles.map((media) => ({
          property: property._id,
          url: media.url,
          type: media.type,
          publicId: media.publicId,
          isPrimary: media.index === 0,
          order: media.index,
        }))
      );
    }

    cleanupLocalFiles(req.files);

    if (req.logAction) req.logAction("property-created", "property", property._id);

    res.status(201).json({ success: true, message: "Property created successfully", data: property });
  } catch (error) {
    cleanupLocalFiles(req.files);
    next(error);
  }
};

export const updateProperty = async (req, res, next) => {
  try {
    const mediaFiles = processUploadedFiles(req.files);

    // Prevent owner field from being changed via body
    const { owner: _owner, ...updateData } = req.body;

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!property) {
      cleanupLocalFiles(req.files);
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (mediaFiles.length > 0) {
      await PropertyMedia.insertMany(
        mediaFiles.map((media, index) => ({
          property: property._id,
          url: media.url,
          type: media.type,
          publicId: media.publicId,
          isPrimary: false,
          order: index,
        }))
      );
    }

    cleanupLocalFiles(req.files);

    if (req.logAction) req.logAction("property-updated", "property", property._id);

    res.status(200).json({ success: true, message: "Property updated successfully", data: property });
  } catch (error) {
    cleanupLocalFiles(req.files);
    next(error);
  }
};

export const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: "archived" },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (req.logAction) req.logAction("property-archived", "property", property._id);

    res.status(200).json({ success: true, message: "Property archived successfully" });
  } catch (error) {
    next(error);
  }
};

export const togglePropertyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["available", "occupied", "reserved", "under-maintenance", "archived"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    res.status(200).json({ success: true, message: "Property status updated", data: property });
  } catch (error) {
    next(error);
  }
};

export const searchProperties = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const properties = await Property.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { type: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    res.status(200).json({ success: true, count: properties.length, data: properties });
  } catch (error) {
    next(error);
  }
};

export const filterProperties = async (req, res, next) => {
  try {
    const filter = buildPropertyFilter(req.query);
    const properties = await Property.find(filter);
    res.status(200).json({ success: true, count: properties.length, data: properties });
  } catch (error) {
    next(error);
  }
};

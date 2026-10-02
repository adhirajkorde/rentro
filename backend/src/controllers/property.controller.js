import Property from "../models/Property.model.js";
import PropertyMedia from "../models/PropertyMedia.model.js";
import Tenant from "../models/Tenant.model.js";
import RentalAgreement from "../models/RentalAgreement.model.js";

const buildPropertyFilter = (query, userId, userRole) => {
  const filter = {};
  if (userRole !== "super-admin") {
    filter.owner = userId;
  } else if (query.owner) {
    filter.owner = query.owner;
  }
  if (query.status && query.status !== "All statuses" && query.status !== "all") {
    filter.status = query.status.toLowerCase();
  }
  if (query.type && query.type !== "All types" && query.type !== "all") {
    filter.type = query.type.toLowerCase();
  }
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
    url: `/uploads/${file.filename}`,
    type: file.mimetype.startsWith("video/") ? "video" : "photo",
    publicId: file.filename,
    index,
  }));

export const getProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const filter = buildPropertyFilter(req.query, req.user._id, req.user.role);

    const [properties, total] = await Promise.all([
      Property.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Property.countDocuments(filter),
    ]);

    // Attach media & active tenant info
    const enrichedProperties = await Promise.all(
      properties.map(async (p) => {
        const propObj = p.toObject ? p.toObject() : { ...p };
        const media = await PropertyMedia.find({ property: p._id }).sort({ isPrimary: -1, order: 1 });
        let activeTenant = null;
        if (p.tenant) {
          activeTenant = await Tenant.findById(p.tenant);
        }
        return {
          ...propObj,
          media,
          tenantDetails: activeTenant,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedProperties.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: enrichedProperties,
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

    if (req.user.role !== "super-admin" && property.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const [media, activeTenant, agreements] = await Promise.all([
      PropertyMedia.find({ property: property._id }).sort({ isPrimary: -1, order: 1 }),
      property.tenant ? Tenant.findById(property.tenant) : null,
      RentalAgreement.find({ property: property._id }).sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...property.toObject(),
        media,
        tenantDetails: activeTenant,
        agreements,
      },
    });
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
      propertyManager, status, notes,
    } = req.body;

    if (!name || !type || !address || !monthlyRent) {
      return res.status(400).json({ success: false, message: "Please provide property name, type, address, and rent amount" });
    }

    const property = await Property.create({
      name: String(name).trim(),
      type: String(type).toLowerCase(),
      description: description ? String(description).trim() : "",
      address: String(address).trim(),
      city: city ? String(city).trim() : "",
      state: state ? String(state).trim() : "",
      country: country ? String(country).trim() : "India",
      pincode: pincode ? String(pincode).trim() : "",
      area: area ? Number(area) : 0,
      bedrooms: bedrooms !== undefined ? Number(bedrooms) : 0,
      bathrooms: bathrooms !== undefined ? Number(bathrooms) : 0,
      furnishingStatus: furnishingStatus || "unfurnished",
      monthlyRent: Number(monthlyRent),
      securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
      maintenanceCharge: maintenanceCharge ? Number(maintenanceCharge) : 0,
      electricityDetails: electricityDetails ? String(electricityDetails).trim() : "",
      waterDetails: waterDetails ? String(waterDetails).trim() : "",
      owner: req.user._id,
      propertyManager,
      status: status ? String(status).toLowerCase() : "available",
      notes: notes ? String(notes).trim() : "",
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

    if (req.logAction) req.logAction("property-created", "property", property._id);

    const media = await PropertyMedia.find({ property: property._id });
    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: { ...property.toObject(), media },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (req, res, next) => {
  try {
    const existing = await Property.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const mediaFiles = processUploadedFiles(req.files);
    const { owner: _owner, ...updateData } = req.body;

    if (updateData.type) updateData.type = String(updateData.type).toLowerCase();
    if (updateData.status) updateData.status = String(updateData.status).toLowerCase();
    if (updateData.monthlyRent) updateData.monthlyRent = Number(updateData.monthlyRent);
    if (updateData.securityDeposit !== undefined) updateData.securityDeposit = Number(updateData.securityDeposit);
    if (updateData.maintenanceCharge !== undefined) updateData.maintenanceCharge = Number(updateData.maintenanceCharge);

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

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

    if (req.logAction) req.logAction("property-updated", "property", property._id);

    const media = await PropertyMedia.find({ property: property._id }).sort({ isPrimary: -1, order: 1 });
    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: { ...property.toObject(), media },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProperty = async (req, res, next) => {
  try {
    const existing = await Property.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    await Property.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: "archived" },
      { new: true }
    );

    if (req.logAction) req.logAction("property-archived", "property", req.params.id);

    res.status(200).json({ success: true, message: "Property archived successfully" });
  } catch (error) {
    next(error);
  }
};

export const togglePropertyStatus = async (req, res, next) => {
  try {
    const existing = await Property.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const { status } = req.body;
    const validStatuses = ["available", "occupied", "reserved", "under-maintenance", "archived"];

    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status: status.toLowerCase() },
      { new: true }
    );

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

    const ownerFilter = req.user.role === "super-admin" ? {} : { owner: req.user._id };

    const properties = await Property.find({
      ...ownerFilter,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
        { type: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

    res.status(200).json({ success: true, count: properties.length, data: properties });
  } catch (error) {
    next(error);
  }
};

export const filterProperties = async (req, res, next) => {
  try {
    const filter = buildPropertyFilter(req.query, req.user._id, req.user.role);
    const properties = await Property.find(filter);
    res.status(200).json({ success: true, count: properties.length, data: properties });
  } catch (error) {
    next(error);
  }
};

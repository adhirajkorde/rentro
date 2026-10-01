import Property from "../models/Property.model.js";
import PropertyMedia from "../models/PropertyMedia.model.js";
import ErrorResponse from "../utils/error.util.js";
import upload from "../utils/multer.config.js";

export const getProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};

    if (req.query.owner) {
      filter.owner = req.query.owner;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.city) {
      filter.city = req.query.city;
    }

    if (req.query.state) {
      filter.state = req.query.state;
    }

    if (req.query.minRent && req.query.maxRent) {
      filter.monthlyRent = {
        $gte: Number(req.query.minRent),
        $lte: Number(req.query.maxRent),
      };
    }

    const properties = await Property.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Property.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: properties,
    });
  } catch (error) {
    console.error("Get properties error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching properties",
    });
  }
};

export const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Get media for this property
    const media = await PropertyMedia.find({ property: property._id }).sort({
      isPrimary: -1,
      order: 1,
    });

    res.status(200).json({
      success: true,
      data: {
        ...property.toObject(),
        media,
      },
    });
  } catch (error) {
    console.error("Get property error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching property",
    });
  }
};

export const createProperty = async (req, res) => {
  try {
    // Handle file uploads
    let mediaFiles = [];

    if (req.files && req.files.length > 0) {
      const files = req.files;

      for (const file of files) {
        const url = file.path || `/uploads/${file.filename}`;
        const publicId = file.filename;

        // Upload to Cloudinary (configured later)
        // const result = await cloudinary.uploader.upload(file.path);

        mediaFiles.push({
          url,
          type: file.mimetype.startsWith("video/)") ? "video" : "photo",
          publicId,
        });
      }

      // Clean up local files
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    const {
      name,
      type,
      description,
      address,
      city,
      state,
      country,
      pincode,
      area,
      bedrooms,
      bathrooms,
      furnishingStatus,
      monthlyRent,
      securityDeposit,
      maintenanceCharge,
      electricityDetails,
      waterDetails,
      owner,
      propertyManager,
      status,
    } = req.body;

    // Validate required fields
    if (!name || !type || !address || !city || !monthlyRent || !owner) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const property = await Property.create({
      name,
      type,
      description,
      address,
      city,
      state,
      country,
      pincode,
      area,
      bedrooms,
      bathrooms,
      furnishingStatus,
      monthlyRent,
      securityDeposit,
      maintenanceCharge,
      electricityDetails,
      waterDetails,
      owner,
      propertyManager,
      status,
    });

    // Create media records
    if (mediaFiles.length > 0) {
      await PropertyMedia.insertMany(
        mediaFiles.map((media) => ({
          property: property._id,
          url: media.url,
          type: media.type,
          isPrimary: mediaFiles.indexOf(media) === 0, // First image is primary
          order: mediaFiles.indexOf(media),
        }))
      );
    }

    // Log action
    if (req.logAction) {
      req.logAction("property-created", "property", property._id, null, {
        name,
        type,
      });
    }

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: property,
    });
  } catch (error) {
    console.error("Create property error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating property",
    });
  }
};

export const updateProperty = async (req, res) => {
  try {
    let mediaFiles = [];

    if (req.files && req.files.length > 0) {
      const files = req.files;

      for (const file of files) {
        const url = file.path || `/uploads/${file.filename}`;
        const publicId = file.filename;

        mediaFiles.push({
          url,
          type: file.mimetype.startsWith("video/") ? "video" : "photo",
          publicId,
        });

        // Clean up local files
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(mediaFiles.length > 0 && { $push: { media: { $each: mediaFiles } } } },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Log action
    if (req.logAction) {
      req.logAction("property-updated", "property", property._id, null, {
        name: property.name,
      });
    }

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: property,
    });
  } catch (error) {
    console.error("Update property error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating property",
    });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: "archived" },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Log action
    if (req.logAction) {
      req.logAction("property-archived", "property", property._id);
    }

    res.status(200).json({
      success: true,
      message: "Property archived successfully",
    });
  } catch (error) {
    console.error("Delete property error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while archiving property",
    });
  }
};

export const searchProperties = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const properties = await Property.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { type: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error("Search properties error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching properties",
    });
  }
};

export const filterProperties = async (req, res) => {
  try {
    const { type, status, city, minRent, maxRent } = req.query;

    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (city) {
      filter.city = city;
    }

    if (minRent || maxRent) {
      filter.monthlyRent = {};
      if (minRent) filter.monthlyRent.$gte = Number(minRent);
      if (maxRent) filter.monthlyRent.$lte = Number(maxRent);
    }

    const properties = await Property.find(filter);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error("Filter properties error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while filtering properties",
    });
  }
};
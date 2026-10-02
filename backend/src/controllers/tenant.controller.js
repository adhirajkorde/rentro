import Tenant from "../models/Tenant.model.js";
import Property from "../models/Property.model.js";
import ErrorResponse from "../utils/error.util.js";

export const getTenants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.property) {
      filter.currentProperty = req.query.property;
    }

    const tenants = await Tenant.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Tenant.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tenants.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: tenants,
    });
  } catch (error) {
    console.error("Get tenants error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tenants",
    });
  }
};

export const getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("Get tenant error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching tenant",
    });
  }
};

export const createTenant = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      occupation,
      address,
      emergencyContact,
      familyOccupantDetails,
      moveInDate,
      moveOutDate,
      currentProperty,
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required",
      });
    }

    // Check if tenant with this email already exists
    const existingTenant = await Tenant.findOne({ email });

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: "Tenant already exists with this email",
      });
    }

    const tenant = await Tenant.create({
      fullName,
      email,
      phone,
      occupation,
      address,
      emergencyContact,
      familyOccupantDetails,
      moveInDate,
      moveOutDate,
      currentProperty,
    });

    res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Create tenant error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating tenant",
    });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tenant updated successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Update tenant error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating tenant",
    });
  }
};

export const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status: "archived", isActive: false },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tenant archived successfully",
    });
  } catch (error) {
    console.error("Delete tenant error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while archiving tenant",
    });
  }
};

export const searchTenants = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const tenants = await Tenant.find({
      $or: [
        { fullName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants,
    });
  } catch (error) {
    console.error("Search tenants error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching tenants",
    });
  }
};

export const filterTenants = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const tenants = await Tenant.find(filter);

    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants,
    });
  } catch (error) {
    console.error("Filter tenants error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while filtering tenants",
    });
  }
};
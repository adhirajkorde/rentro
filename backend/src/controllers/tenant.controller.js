import Tenant from "../models/Tenant.model.js";
import Property from "../models/Property.model.js";
import RentalAgreement from "../models/RentalAgreement.model.js";
import Payment from "../models/Payment.model.js";
import RentRecord from "../models/RentRecord.model.js";
import KycDocument from "../models/KycDocument.model.js";
import Inspection from "../models/Inspection.model.js";

const getOwnerFilter = (req, baseFilter = {}) => {
  const filter = { ...baseFilter };
  if (req.user.role !== "super-admin") {
    filter.owner = req.user._id;
  }
  return filter;
};

export const getTenants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const baseFilter = {};
    if (req.query.status && req.query.status !== "all" && req.query.status !== "All statuses") {
      baseFilter.status = req.query.status.toLowerCase();
    }
    if (req.query.property) {
      baseFilter.currentProperty = req.query.property;
    }

    const filter = getOwnerFilter(req, baseFilter);

    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Tenant.countDocuments(filter),
    ]);

    // Populate current property details
    const populated = await Promise.all(
      tenants.map(async (tenant) => {
        const tObj = tenant.toObject ? tenant.toObject() : { ...tenant };
        let propertyDetails = null;
        if (tenant.currentProperty) {
          propertyDetails = await Property.findById(tenant.currentProperty);
        }
        return {
          ...tObj,
          propertyDetails,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: populated.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: populated,
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

    if (req.user.role !== "super-admin" && tenant.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const [propertyDetails, agreements, payments, rentRecords, documents, inspections] = await Promise.all([
      tenant.currentProperty ? Property.findById(tenant.currentProperty) : null,
      RentalAgreement.find({ tenant: tenant._id }).sort({ createdAt: -1 }),
      Payment.find({ tenant: tenant._id }).sort({ paymentDate: -1 }),
      RentRecord.find({ tenant: tenant._id }).sort({ billingMonth: -1 }),
      KycDocument.find({ tenant: tenant._id }).sort({ createdAt: -1 }),
      Inspection.find({ tenant: tenant._id }).sort({ inspectionDate: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...tenant.toObject(),
        propertyDetails,
        agreements,
        payments,
        rentRecords,
        documents,
        inspections,
      },
    });
  } catch (error) {
    console.error("Get tenant error:", error);
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
      notes,
      dateOfBirth,
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required",
      });
    }

    const existingTenant = await Tenant.findOne({ email: email.toLowerCase() });

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: "Tenant already exists with this email",
      });
    }

    const tenant = await Tenant.create({
      fullName: String(fullName).trim(),
      email: String(email).toLowerCase().trim(),
      phone: phone ? String(phone).trim() : "",
      occupation: occupation ? String(occupation).trim() : "",
      address: address ? String(address).trim() : "",
      emergencyContact: emergencyContact || {},
      familyOccupantDetails: familyOccupantDetails ? String(familyOccupantDetails).trim() : "",
      moveInDate: moveInDate ? new Date(moveInDate) : new Date(),
      moveOutDate: moveOutDate ? new Date(moveOutDate) : null,
      currentProperty: currentProperty || null,
      owner: req.user._id,
      notes: notes ? String(notes).trim() : "",
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      status: "active",
      isActive: true,
    });

    // If property specified, mark property as occupied and assign tenant
    if (currentProperty) {
      await Property.findByIdAndUpdate(currentProperty, {
        tenant: tenant._id,
        status: "occupied",
      });
    }

    if (req.logAction) req.logAction("tenant-created", "tenant", tenant._id);

    res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Create tenant error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while creating tenant",
    });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const existing = await Tenant.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const { owner: _owner, ...updateData } = req.body;

    if (updateData.email) updateData.email = String(updateData.email).toLowerCase().trim();
    if (updateData.status) updateData.status = String(updateData.status).toLowerCase();

    // If tenant property changed
    if (updateData.currentProperty !== undefined && updateData.currentProperty !== existing.currentProperty?.toString()) {
      // Free old property if changed
      if (existing.currentProperty) {
        await Property.findByIdAndUpdate(existing.currentProperty, {
          tenant: null,
          status: "available",
        });
      }
      // Set new property occupied
      if (updateData.currentProperty) {
        await Property.findByIdAndUpdate(updateData.currentProperty, {
          tenant: existing._id,
          status: "occupied",
        });
      }
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (req.logAction) req.logAction("tenant-updated", "tenant", tenant._id);

    res.status(200).json({
      success: true,
      message: "Tenant updated successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Update tenant error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while updating tenant",
    });
  }
};

export const deleteTenant = async (req, res) => {
  try {
    const existing = await Tenant.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Preserve historical data — soft archive
    await Tenant.findByIdAndUpdate(
      req.params.id,
      { status: "archived", isActive: false, moveOutDate: new Date() },
      { new: true }
    );

    // Free property
    if (existing.currentProperty) {
      await Property.findByIdAndUpdate(existing.currentProperty, {
        tenant: null,
        status: "available",
      });
    }

    if (req.logAction) req.logAction("tenant-archived", "tenant", req.params.id);

    res.status(200).json({
      success: true,
      message: "Tenant archived successfully",
    });
  } catch (error) {
    console.error("Delete tenant error:", error);
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

    const ownerFilter = req.user.role === "super-admin" ? {} : { owner: req.user._id };

    const tenants = await Tenant.find({
      ...ownerFilter,
      $or: [
        { fullName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { occupation: { $regex: q, $options: "i" } },
      ],
    }).limit(20);

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
    const filter = getOwnerFilter(req, {});
    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }
    if (req.query.property) {
      filter.currentProperty = req.query.property;
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
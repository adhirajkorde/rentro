import RentalAgreement from "../models/RentalAgreement.model.js";
import RentRecord from "../models/RentRecord.model.js";
import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";
import User from "../models/User.model.js";
import SecurityDeposit from "../models/SecurityDeposit.model.js";
import { buildAgreementPdf } from "../utils/pdfGenerator.js";

const generateRentRecords = async (agreement) => {
  const { _id, tenant, property, startDate, endDate, monthlyRent } = agreement;

  const start = new Date(startDate);
  start.setDate(1);
  const end = new Date(endDate);

  const records = [];
  let current = new Date(start);

  while (current <= end) {
    const dueDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);

    records.push({
      tenant,
      property,
      agreement: _id,
      billingMonth: new Date(current),
      dueDate,
      rentAmount: Number(monthlyRent),
      paidAmount: 0,
      remainingAmount: Number(monthlyRent),
      status: "unpaid",
    });

    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  if (records.length > 0) {
    await RentRecord.insertMany(records);
  }
};

export const getAgreements = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.user.role !== "super-admin") {
      filter.owner = req.user._id;
    } else if (req.query.owner) {
      filter.owner = req.query.owner;
    }
    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.property) filter.property = req.query.property;
    if (req.query.status && req.query.status !== "all" && req.query.status !== "All statuses") {
      filter.status = req.query.status.toLowerCase();
    }

    if (req.query.expiring) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filter.endDate = { $lte: thirtyDaysFromNow };
      filter.status = "active";
    }

    const [agreements, total] = await Promise.all([
      RentalAgreement.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      RentalAgreement.countDocuments(filter),
    ]);

    // Populate property and tenant details
    const populated = await Promise.all(
      agreements.map(async (agr) => {
        const aObj = agr.toObject ? agr.toObject() : { ...agr };
        const [propertyDetails, tenantDetails] = await Promise.all([
          agr.property ? Property.findById(agr.property) : null,
          agr.tenant ? Tenant.findById(agr.tenant) : null,
        ]);
        return {
          ...aObj,
          propertyDetails,
          tenantDetails,
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
    next(error);
  }
};

export const getAgreement = async (req, res, next) => {
  try {
    const agreement = await RentalAgreement.findById(req.params.id);

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    if (req.user.role !== "super-admin" && agreement.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    const [propertyDetails, tenantDetails, ownerDetails, rentRecords] = await Promise.all([
      Property.findById(agreement.property),
      Tenant.findById(agreement.tenant),
      User.findById(agreement.owner),
      RentRecord.find({ agreement: agreement._id }).sort({ billingMonth: 1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...agreement.toObject(),
        propertyDetails,
        tenantDetails,
        ownerDetails,
        rentRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAgreement = async (req, res, next) => {
  try {
    const {
      tenant, property, startDate, endDate, monthlyRent,
      securityDeposit, noticePeriod, maintenanceResponsibility,
      utilityResponsibility, termsAndConditions, status,
    } = req.body;

    if (!tenant || !property || !startDate || !endDate || !monthlyRent) {
      return res.status(400).json({ success: false, message: "Please provide tenant, property, start date, end date, and rent amount" });
    }

    const existingAgreement = await RentalAgreement.findOne({ tenant, property, status: "active" });
    if (existingAgreement) {
      return res.status(409).json({
        success: false,
        message: "An active agreement already exists for this tenant and property",
      });
    }

    const agreementStatus = status ? String(status).toLowerCase() : "active";

    const agreement = await RentalAgreement.create({
      owner: req.user._id,
      tenant,
      property,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      monthlyRent: Number(monthlyRent),
      securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
      noticePeriod: noticePeriod ? Number(noticePeriod) : 30,
      maintenanceResponsibility: maintenanceResponsibility ? String(maintenanceResponsibility).trim() : "Owner",
      utilityResponsibility: utilityResponsibility ? String(utilityResponsibility).trim() : "Tenant",
      termsAndConditions: termsAndConditions ? String(termsAndConditions).trim() : "",
      status: agreementStatus,
      isActive: agreementStatus === "active",
    });

    // Auto-generate rent schedule
    await generateRentRecords(agreement);

    // Create security deposit entry if deposit amount > 0
    if (Number(securityDeposit) > 0) {
      const existingDep = await SecurityDeposit.findOne({ agreement: agreement._id });
      if (!existingDep) {
        await SecurityDeposit.create({
          owner: req.user._id,
          tenant,
          property,
          agreement: agreement._id,
          depositAmount: Number(securityDeposit),
          receivedDate: new Date(startDate),
          status: "held",
        });
      }
    }

    // Set property to occupied
    await Property.findByIdAndUpdate(property, {
      tenant,
      status: "occupied",
    });

    // Set tenant property
    await Tenant.findByIdAndUpdate(tenant, {
      currentProperty: property,
      status: "active",
    });

    if (req.logAction) req.logAction("agreement-created", "agreement", agreement._id);

    const [propertyDetails, tenantDetails] = await Promise.all([
      Property.findById(property),
      Tenant.findById(tenant),
    ]);

    res.status(201).json({
      success: true,
      message: "Rental agreement created successfully",
      data: { ...agreement.toObject(), propertyDetails, tenantDetails },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAgreement = async (req, res, next) => {
  try {
    const existing = await RentalAgreement.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    const { owner: _owner, ...updateData } = req.body;
    if (updateData.status) updateData.status = String(updateData.status).toLowerCase();
    if (updateData.monthlyRent) updateData.monthlyRent = Number(updateData.monthlyRent);
    if (updateData.securityDeposit !== undefined) updateData.securityDeposit = Number(updateData.securityDeposit);

    const agreement = await RentalAgreement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (req.logAction) req.logAction("agreement-updated", "agreement", agreement._id);

    res.status(200).json({ success: true, message: "Agreement updated successfully", data: agreement });
  } catch (error) {
    next(error);
  }
};

export const deleteAgreement = async (req, res, next) => {
  try {
    const existing = await RentalAgreement.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    await RentalAgreement.findByIdAndUpdate(
      req.params.id,
      { status: "terminated", isActive: false },
      { new: true }
    );

    if (req.logAction) req.logAction("agreement-terminated", "agreement", req.params.id);

    res.status(200).json({ success: true, message: "Agreement terminated successfully" });
  } catch (error) {
    next(error);
  }
};

export const toggleAgreementStatus = async (req, res, next) => {
  try {
    const existing = await RentalAgreement.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    const { status } = req.body;
    const validStatuses = ["draft", "active", "expiring-soon", "expired", "terminated"];

    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const agreement = await RentalAgreement.findByIdAndUpdate(
      req.params.id,
      { status: status.toLowerCase(), isActive: status.toLowerCase() === "active" },
      { new: true }
    );

    res.status(200).json({ success: true, message: "Agreement status updated", data: agreement });
  } catch (error) {
    next(error);
  }
};

export const downloadAgreementPdf = async (req, res, next) => {
  try {
    const agreement = await RentalAgreement.findById(req.params.id);

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    if (req.user.role !== "super-admin" && agreement.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    const [propertyDetails, tenantDetails, ownerDetails, rentRecords] = await Promise.all([
      Property.findById(agreement.property),
      Tenant.findById(agreement.tenant),
      User.findById(agreement.owner),
      RentRecord.find({ agreement: agreement._id }).sort({ billingMonth: 1 }),
    ]);

    const enriched = {
      ...agreement.toObject(),
      propertyDetails,
      tenantDetails,
      ownerDetails,
    };

    buildAgreementPdf(enriched, rentRecords, res);
  } catch (error) {
    console.error("PDF generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to generate agreement PDF" });
    }
  }
};

import RentalAgreement from "../models/RentalAgreement.model.js";
import RentRecord from "../models/RentRecord.model.js";

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
      rentAmount: monthlyRent,
      paidAmount: 0,
      remainingAmount: monthlyRent,
      status: "unpaid",
    });

    // Correctly advance to next month
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  if (records.length > 0) {
    await RentRecord.insertMany(records);
  }
};

export const getAgreements = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.owner) filter.owner = req.query.owner;
    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.property) filter.property = req.query.property;
    if (req.query.status) filter.status = req.query.status;

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

    res.status(200).json({
      success: true,
      count: agreements.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: agreements,
    });
  } catch (error) {
    next(error);
  }
};

export const getAgreement = async (req, res, next) => {
  try {
    const agreement = await RentalAgreement.findById(req.params.id)
      .populate("owner", "fullName email")
      .populate("tenant", "fullName email phone")
      .populate("property", "name address city");

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    res.status(200).json({ success: true, data: agreement });
  } catch (error) {
    next(error);
  }
};

export const createAgreement = async (req, res, next) => {
  try {
    const {
      tenant, property, startDate, endDate, monthlyRent,
      securityDeposit, noticePeriod, maintenanceResponsibility,
      utilityResponsibility, termsAndConditions,
    } = req.body;

    if (!tenant || !property || !startDate || !endDate || !monthlyRent) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    const existingAgreement = await RentalAgreement.findOne({ tenant, property, status: "active" });
    if (existingAgreement) {
      return res.status(409).json({
        success: false,
        message: "An active agreement already exists for this tenant and property",
      });
    }

    const agreement = await RentalAgreement.create({
      owner: req.user._id,
      tenant,
      property,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      noticePeriod,
      maintenanceResponsibility,
      utilityResponsibility,
      termsAndConditions,
    });

    await generateRentRecords(agreement);

    if (req.logAction) req.logAction("agreement-created", "agreement", agreement._id);

    res.status(201).json({ success: true, message: "Rental agreement created successfully", data: agreement });
  } catch (error) {
    next(error);
  }
};

export const updateAgreement = async (req, res, next) => {
  try {
    const { owner: _owner, ...updateData } = req.body;

    const agreement = await RentalAgreement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    if (req.logAction) req.logAction("agreement-updated", "agreement", agreement._id);

    res.status(200).json({ success: true, message: "Agreement updated successfully", data: agreement });
  } catch (error) {
    next(error);
  }
};

export const deleteAgreement = async (req, res, next) => {
  try {
    const agreement = await RentalAgreement.findByIdAndUpdate(
      req.params.id,
      { status: "terminated", isActive: false },
      { new: true }
    );

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    if (req.logAction) req.logAction("agreement-terminated", "agreement", agreement._id);

    res.status(200).json({ success: true, message: "Agreement terminated successfully" });
  } catch (error) {
    next(error);
  }
};

export const toggleAgreementStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["draft", "active", "expiring-soon", "expired", "terminated"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const agreement = await RentalAgreement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!agreement) {
      return res.status(404).json({ success: false, message: "Agreement not found" });
    }

    res.status(200).json({ success: true, message: "Agreement status updated", data: agreement });
  } catch (error) {
    next(error);
  }
};

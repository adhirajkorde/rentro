import RentRecord from "../models/RentRecord.model.js";

export const getRentRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.property) filter.property = req.query.property;
    if (req.query.agreement) filter.agreement = req.query.agreement;
    if (req.query.status) filter.status = req.query.status;

    if (req.query.month) {
      const start = new Date(req.query.month + "-01");
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      filter.billingMonth = { $gte: start, $lte: end };
    }

    const [rentRecords, total] = await Promise.all([
      RentRecord.find(filter).skip(skip).limit(limit).sort({ billingMonth: -1 }),
      RentRecord.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: rentRecords.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: rentRecords,
    });
  } catch (error) {
    next(error);
  }
};

export const getRentRecord = async (req, res, next) => {
  try {
    const rentRecord = await RentRecord.findById(req.params.id);

    if (!rentRecord) {
      return res.status(404).json({ success: false, message: "Rent record not found" });
    }

    res.status(200).json({ success: true, data: rentRecord });
  } catch (error) {
    next(error);
  }
};

export const createRentRecord = async (req, res, next) => {
  try {
    const { tenant, property, agreement, billingMonth, dueDate, rentAmount } = req.body;

    if (!tenant || !property || !rentAmount) {
      return res.status(400).json({ success: false, message: "Tenant, property, and rent amount are required" });
    }

    const rentRecord = await RentRecord.create({
      tenant,
      property,
      agreement,
      billingMonth: billingMonth ? new Date(billingMonth) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      rentAmount: Number(rentAmount),
      paidAmount: 0,
      remainingAmount: Number(rentAmount),
      status: "unpaid",
    });

    if (req.logAction) req.logAction("rent-record-created", "rent-record", rentRecord._id);

    res.status(201).json({ success: true, message: "Rent record created successfully", data: rentRecord });
  } catch (error) {
    next(error);
  }
};

export const updateRentRecord = async (req, res, next) => {
  try {
    // Fetch first so we have current values for server-side calculation
    const existing = await RentRecord.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Rent record not found" });
    }

    const { paidAmount, paymentDate, paymentMethod, notes, status } = req.body;

    if (paidAmount !== undefined) {
      existing.paidAmount = Number(paidAmount);
      existing.remainingAmount = existing.rentAmount - existing.paidAmount;
      existing.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    }

    if (paymentMethod) existing.paymentMethod = paymentMethod;
    if (notes !== undefined) existing.notes = notes;

    // Allow manual overdue/waived status
    if (status === "overdue" || status === "waived") {
      existing.status = status;
    }

    await existing.save(); // pre-save hook recalculates status

    if (req.logAction) req.logAction("rent-record-updated", "rent-record", existing._id);

    res.status(200).json({ success: true, message: "Rent record updated successfully", data: existing });
  } catch (error) {
    next(error);
  }
};

export const getTenantRentHistory = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [rentRecords, total] = await Promise.all([
      RentRecord.find({ tenant: tenantId }).skip(skip).limit(limit).sort({ billingMonth: -1 }),
      RentRecord.countDocuments({ tenant: tenantId }),
    ]);

    res.status(200).json({
      success: true,
      count: rentRecords.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: rentRecords,
    });
  } catch (error) {
    next(error);
  }
};

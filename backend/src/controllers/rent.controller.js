import RentRecord from "../models/RentRecord.model.js";
import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";
import RentalAgreement from "../models/RentalAgreement.model.js";

export const getRentRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Get owner's properties if not super-admin
    let propertyIds = null;
    if (req.user.role !== "super-admin") {
      const ownerProperties = await Property.find({ owner: req.user._id });
      propertyIds = ownerProperties.map((p) => p._id);
    }

    const filter = {};
    if (propertyIds !== null) {
      filter.property = { $in: propertyIds };
    }

    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.property) filter.property = req.query.property;
    if (req.query.agreement) filter.agreement = req.query.agreement;
    if (req.query.status && req.query.status !== "all" && req.query.status !== "All statuses") {
      filter.status = req.query.status.toLowerCase();
    }

    if (req.query.month) {
      const start = new Date(req.query.month + "-01");
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      filter.billingMonth = { $gte: start, $lte: end };
    }

    const [rentRecords, total] = await Promise.all([
      RentRecord.find(filter).skip(skip).limit(limit).sort({ billingMonth: -1 }),
      RentRecord.countDocuments(filter),
    ]);

    // Populate property and tenant details
    const populated = await Promise.all(
      rentRecords.map(async (record) => {
        const rObj = record.toObject ? record.toObject() : { ...record };
        const [propertyDetails, tenantDetails] = await Promise.all([
          record.property ? Property.findById(record.property) : null,
          record.tenant ? Tenant.findById(record.tenant) : null,
        ]);
        return {
          ...rObj,
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

export const getRentRecord = async (req, res, next) => {
  try {
    const rentRecord = await RentRecord.findById(req.params.id);

    if (!rentRecord) {
      return res.status(404).json({ success: false, message: "Rent record not found" });
    }

    const [propertyDetails, tenantDetails, agreementDetails] = await Promise.all([
      Property.findById(rentRecord.property),
      Tenant.findById(rentRecord.tenant),
      rentRecord.agreement ? RentalAgreement.findById(rentRecord.agreement) : null,
    ]);

    if (req.user.role !== "super-admin" && propertyDetails?.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Rent record not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        ...rentRecord.toObject(),
        propertyDetails,
        tenantDetails,
        agreementDetails,
      },
    });
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

    const targetProperty = await Property.findById(property);
    if (!targetProperty || (req.user.role !== "super-admin" && targetProperty.owner?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "You do not own this property" });
    }

    const amount = Number(rentAmount);
    const rentRecord = await RentRecord.create({
      tenant,
      property,
      agreement,
      billingMonth: billingMonth ? new Date(billingMonth) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      rentAmount: amount,
      paidAmount: 0,
      remainingAmount: amount,
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
    const existing = await RentRecord.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Rent record not found" });
    }

    const targetProperty = await Property.findById(existing.property);
    if (!targetProperty || (req.user.role !== "super-admin" && targetProperty.owner?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized to update this rent record" });
    }

    const { paidAmount, paymentDate, paymentMethod, notes, status, lateFee } = req.body;

    if (paidAmount !== undefined) {
      existing.paidAmount = Number(paidAmount);
      existing.remainingAmount = Math.max(0, existing.rentAmount - existing.paidAmount);
      existing.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    }

    if (lateFee !== undefined) existing.lateFee = Number(lateFee);
    if (paymentMethod) existing.paymentMethod = paymentMethod;
    if (notes !== undefined) existing.notes = notes;

    if (status) {
      existing.status = status;
    } else {
      if (existing.paidAmount >= existing.rentAmount) {
        existing.status = "paid";
      } else if (existing.paidAmount > 0) {
        existing.status = "partially-paid";
      } else {
        existing.status = "unpaid";
      }
    }

    await existing.save();

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
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const [rentRecords, total] = await Promise.all([
      RentRecord.find({ tenant: tenantId }).skip(skip).limit(limit).sort({ billingMonth: -1 }),
      RentRecord.countDocuments({ tenant: tenantId }),
    ]);

    const populated = await Promise.all(
      rentRecords.map(async (rec) => {
        const rObj = rec.toObject ? rec.toObject() : { ...rec };
        const propertyDetails = rec.property ? await Property.findById(rec.property) : null;
        return { ...rObj, propertyDetails };
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

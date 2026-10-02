import UtilityCharge from "../models/UtilityCharge.model.js";
import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";

export const getUtilityCharges = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.user.role !== "super-admin") {
      filter.owner = req.user._id;
    }

    if (req.query.property) filter.property = req.query.property;
    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.utilityType && req.query.utilityType !== "all") filter.utilityType = req.query.utilityType;
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;

    const [charges, total] = await Promise.all([
      UtilityCharge.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      UtilityCharge.countDocuments(filter),
    ]);

    const populated = await Promise.all(
      charges.map(async (u) => {
        const uObj = u.toObject ? u.toObject() : { ...u };
        const [propertyDetails, tenantDetails] = await Promise.all([
          u.property ? Property.findById(u.property) : null,
          u.tenant ? Tenant.findById(u.tenant) : null,
        ]);
        return {
          ...uObj,
          propertyDetails,
          tenantDetails,
        };
      })
    );

    const totalAmount = populated.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    res.status(200).json({
      success: true,
      count: populated.length,
      total,
      totalAmount,
      page,
      pages: Math.ceil(total / limit),
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const createUtilityCharge = async (req, res, next) => {
  try {
    const {
      property, tenant, utilityType, billingPeriod,
      meterNumber, previousReading, currentReading, unitsConsumed, ratePerUnit,
      amount, dueDate, meterPhoto, status, paymentMethod, notes,
    } = req.body;

    if (!property || !utilityType) {
      return res.status(400).json({ success: false, message: "Property and utility type are required" });
    }

    const targetProperty = await Property.findById(property);
    if (!targetProperty || (req.user.role !== "super-admin" && targetProperty.owner?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized for this property" });
    }

    let photo = meterPhoto || "";
    if (req.file) {
      photo = `/uploads/${req.file.filename}`;
    }

    const prev = Number(previousReading) || 0;
    const curr = Number(currentReading) || prev;
    const units = unitsConsumed !== undefined ? Number(unitsConsumed) : Math.max(0, curr - prev);
    const rate = Number(ratePerUnit) || 0;
    const finalAmount = amount !== undefined ? Number(amount) : (units * rate);

    const now = new Date();
    const period = billingPeriod || `${now.toLocaleString("en-US", { month: "short" })} ${now.getFullYear()}`;

    const charge = await UtilityCharge.create({
      owner: req.user._id,
      property,
      tenant: tenant || targetProperty.tenant || null,
      utilityType: utilityType.toLowerCase(),
      billingPeriod: period,
      meterNumber: meterNumber ? String(meterNumber).trim() : "",
      previousReading: prev,
      currentReading: curr,
      unitsConsumed: units,
      ratePerUnit: rate,
      amount: finalAmount,
      dueDate: dueDate ? new Date(dueDate) : null,
      meterPhoto: photo,
      status: status || "pending",
      paymentMethod,
      notes: notes ? String(notes).trim() : "",
    });

    const [propertyDetails, tenantDetails] = await Promise.all([
      Property.findById(property),
      charge.tenant ? Tenant.findById(charge.tenant) : null,
    ]);

    res.status(201).json({
      success: true,
      message: "Utility reading recorded successfully",
      data: {
        ...charge.toObject(),
        propertyDetails,
        tenantDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUtilityCharge = async (req, res, next) => {
  try {
    const existing = await UtilityCharge.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Utility record not found" });
    }

    let updateData = { ...req.body };
    if (req.file) {
      updateData.meterPhoto = `/uploads/${req.file.filename}`;
    }

    if (updateData.amount !== undefined) updateData.amount = Number(updateData.amount);

    const updated = await UtilityCharge.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Utility record updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUtilityCharge = async (req, res, next) => {
  try {
    const existing = await UtilityCharge.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Utility record not found" });
    }

    await UtilityCharge.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Utility record deleted successfully" });
  } catch (error) {
    next(error);
  }
};

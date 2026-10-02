import Maintenance from "../models/Maintenance.model.js";
import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";

export const getMaintenanceExpenses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.user.role !== "super-admin") {
      filter.owner = req.user._id;
    }

    if (req.query.property) filter.property = req.query.property;
    if (req.query.category && req.query.category !== "all") filter.category = req.query.category;
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;

    const [expenses, total] = await Promise.all([
      Maintenance.find(filter).skip(skip).limit(limit).sort({ expenseDate: -1 }),
      Maintenance.countDocuments(filter),
    ]);

    const populated = await Promise.all(
      expenses.map(async (m) => {
        const mObj = m.toObject ? m.toObject() : { ...m };
        const [propertyDetails, tenantDetails] = await Promise.all([
          m.property ? Property.findById(m.property) : null,
          m.tenant ? Tenant.findById(m.tenant) : null,
        ]);
        return {
          ...mObj,
          propertyDetails,
          tenantDetails,
        };
      })
    );

    const totalSpent = populated.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    res.status(200).json({
      success: true,
      count: populated.length,
      total,
      totalSpent,
      page,
      pages: Math.ceil(total / limit),
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const createMaintenanceExpense = async (req, res, next) => {
  try {
    const {
      property, tenant, title, category, amount,
      expenseDate, description, vendorName, receiptUrl, status, paymentMethod, notes,
    } = req.body;

    if (!property || !category || !amount) {
      return res.status(400).json({ success: false, message: "Property, category, and amount are required" });
    }

    const targetProperty = await Property.findById(property);
    if (!targetProperty || (req.user.role !== "super-admin" && targetProperty.owner?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized for this property" });
    }

    let finalReceiptUrl = receiptUrl || "";
    if (req.file) {
      finalReceiptUrl = `/uploads/${req.file.filename}`;
    }

    const expense = await Maintenance.create({
      owner: req.user._id,
      property,
      tenant: tenant || null,
      title: title ? String(title).trim() : `${category.toUpperCase()} Expense`,
      category: category.toLowerCase(),
      amount: Number(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      description: description ? String(description).trim() : "",
      vendorName: vendorName ? String(vendorName).trim() : "",
      receiptUrl: finalReceiptUrl,
      status: status || "paid",
      paymentMethod: paymentMethod || "bank-transfer",
      notes: notes ? String(notes).trim() : "",
    });

    if (req.logAction) req.logAction("maintenance-created", "maintenance", expense._id);

    const [propertyDetails, tenantDetails] = await Promise.all([
      Property.findById(property),
      tenant ? Tenant.findById(tenant) : null,
    ]);

    res.status(201).json({
      success: true,
      message: "Maintenance expense recorded successfully",
      data: {
        ...expense.toObject(),
        propertyDetails,
        tenantDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceExpense = async (req, res, next) => {
  try {
    const existing = await Maintenance.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Expense record not found" });
    }

    let updateData = { ...req.body };
    if (req.file) {
      updateData.receiptUrl = `/uploads/${req.file.filename}`;
    }

    if (updateData.amount) updateData.amount = Number(updateData.amount);

    const updated = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Expense record updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMaintenanceExpense = async (req, res, next) => {
  try {
    const existing = await Maintenance.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Expense record not found" });
    }

    await Maintenance.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Expense record deleted successfully" });
  } catch (error) {
    next(error);
  }
};

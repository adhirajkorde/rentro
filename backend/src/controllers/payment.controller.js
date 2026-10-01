import Payment from "../models/Payment.model.js";
import RentRecord from "../models/RentRecord.model.js";

export const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.tenant) filter.tenant = req.query.tenant;
    if (req.query.property) filter.property = req.query.property;
    if (req.query.startDate && req.query.endDate) {
      filter.paymentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter).skip(skip).limit(limit).sort({ paymentDate: -1 }),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const { rentRecordId, tenant, property, agreement, amount, paymentMethod, transactionId, notes } = req.body;

    if (!rentRecordId || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, message: "Rent record, amount, and payment method are required" });
    }

    // Fetch the rent record — never trust amount from frontend
    const record = await RentRecord.findById(rentRecordId);

    if (!record) {
      return res.status(404).json({ success: false, message: "Rent record not found" });
    }

    if (record.status === "paid") {
      return res.status(400).json({ success: false, message: "Rent record is already fully paid" });
    }

    const payableAmount = Math.min(Number(amount), record.remainingAmount);

    const payment = await Payment.create({
      rentRecord: rentRecordId,
      tenant: tenant || record.tenant,
      property: property || record.property,
      agreement: agreement || record.agreement,
      amount: payableAmount,
      paymentMethod,
      transactionId,
      notes,
    });

    // Update rent record — server-side calculation
    record.paidAmount = (record.paidAmount || 0) + payableAmount;
    record.remainingAmount = record.rentAmount - record.paidAmount;
    record.paymentDate = new Date();
    record.paymentMethod = paymentMethod;

    if (record.paidAmount >= record.rentAmount) {
      record.status = "paid";
    } else {
      record.status = "partially-paid";
    }

    await record.save();

    if (req.logAction) req.logAction("payment-recorded", "payment", payment._id);

    res.status(201).json({ success: true, message: "Payment recorded successfully", data: payment });
  } catch (error) {
    next(error);
  }
};

export const getTenantPayments = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ tenant: tenantId }).skip(skip).limit(limit).sort({ paymentDate: -1 }),
      Payment.countDocuments({ tenant: tenantId }),
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

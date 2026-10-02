import Payment from "../models/Payment.model.js";
import RentRecord from "../models/RentRecord.model.js";
import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";
import User from "../models/User.model.js";
import { buildReceiptPdf } from "../utils/pdfGenerator.js";

export const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

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

    const populated = await Promise.all(
      payments.map(async (payment) => {
        const pObj = payment.toObject ? payment.toObject() : { ...payment };
        const [propertyDetails, tenantDetails, rentRecordDetails] = await Promise.all([
          payment.property ? Property.findById(payment.property) : null,
          payment.tenant ? Tenant.findById(payment.tenant) : null,
          payment.rentRecord ? RentRecord.findById(payment.rentRecord) : null,
        ]);
        return {
          ...pObj,
          propertyDetails,
          tenantDetails,
          rentRecordDetails,
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

export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const [propertyDetails, tenantDetails, rentRecordDetails] = await Promise.all([
      Property.findById(payment.property),
      Tenant.findById(payment.tenant),
      RentRecord.findById(payment.rentRecord),
    ]);

    if (req.user.role !== "super-admin" && propertyDetails?.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        ...payment.toObject(),
        propertyDetails,
        tenantDetails,
        rentRecordDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const { rentRecordId, tenant, property, agreement, amount, paymentMethod, transactionId, notes, paymentDate } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ success: false, message: "Amount and payment method are required" });
    }

    let record = null;
    if (rentRecordId) {
      record = await RentRecord.findById(rentRecordId);
    }

    const payAmount = Number(amount);
    const resolvedTenant = tenant || record?.tenant;
    const resolvedProperty = property || record?.property;
    const resolvedAgreement = agreement || record?.agreement;

    if (!resolvedProperty) {
      return res.status(400).json({ success: false, message: "Property is required for payment" });
    }

    const targetProperty = await Property.findById(resolvedProperty);
    if (!targetProperty || (req.user.role !== "super-admin" && targetProperty.owner?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized for this property" });
    }

    const txnId = transactionId || `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await Payment.create({
      rentRecord: rentRecordId || null,
      tenant: resolvedTenant,
      property: resolvedProperty,
      agreement: resolvedAgreement,
      amount: payAmount,
      paymentMethod: paymentMethod.toLowerCase(),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      transactionId: txnId,
      notes: notes ? String(notes).trim() : "",
    });

    // Update associated rent record if linked
    if (record) {
      record.paidAmount = (record.paidAmount || 0) + payAmount;
      record.remainingAmount = Math.max(0, (record.rentAmount || 0) - record.paidAmount);
      record.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
      record.paymentMethod = paymentMethod.toLowerCase();

      if (record.paidAmount >= record.rentAmount) {
        record.status = "paid";
      } else if (record.paidAmount > 0) {
        record.status = "partially-paid";
      }
      await record.save();
    }

    if (req.logAction) req.logAction("payment-recorded", "payment", payment._id);

    const [propertyDetails, tenantDetails] = await Promise.all([
      Property.findById(resolvedProperty),
      resolvedTenant ? Tenant.findById(resolvedTenant) : null,
    ]);

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        ...payment.toObject(),
        propertyDetails,
        tenantDetails,
        rentRecordDetails: record,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadPaymentReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const [propertyDetails, tenantDetails, rentRecordDetails] = await Promise.all([
      Property.findById(payment.property),
      payment.tenant ? Tenant.findById(payment.tenant) : null,
      payment.rentRecord ? RentRecord.findById(payment.rentRecord) : null,
    ]);

    if (req.user.role !== "super-admin" && propertyDetails?.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    let ownerDetails = null;
    if (propertyDetails?.owner) {
      ownerDetails = await User.findById(propertyDetails.owner);
    }

    const enrichedPayment = {
      ...payment.toObject(),
      propertyDetails,
      tenantDetails,
      ownerDetails,
    };

    buildReceiptPdf(enrichedPayment, rentRecordDetails, res);
  } catch (error) {
    console.error("Receipt generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to generate receipt PDF" });
    }
  }
};

export const getTenantPayments = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
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

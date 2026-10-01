import Payment from "../models/Payment.model.js";
import RentRecord from "../models/RentRecord.model.js";
import ErrorResponse from "../utils/error.util.js";

export const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }

    if (req.query.property) {
      filter.property = req.query.property;
    }

    if (req.query.startDate && req.query.endDate) {
      filter.paymentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const payments = await Payment.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payments",
    });
  }
};

export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching payment",
    });
  }
};

export const createPayment = async (req, res) => {
  try {
    const {
      rentRecord,
      tenant,
      property,
      agreement,
      amount,
      paymentMethod,
    } = req.body;

    if (!rentRecord || !amount) {
      return res.status(400).json({
        success: false,
        message: "Rent record and amount are required",
      });
    }

    // Check if amount exceeds remaining
    const rentRecord = await RentRecord.findById(rentRecord);

    if (!rentRecord) {
      return res.status(404).json({
        success: false,
        message: "Rent record not found",
      });
    }

    if (amount > rentRecord.rentAmount) {
      return res.status(400).json({
        success: false,
        message: "Payment amount cannot exceed rent amount",
      });
    }

    const payment = await Payment.create({
      rentRecord,
      tenant,
      property,
      agreement,
      amount,
      paymentMethod,
    });

    // Update rent record
    rentRecord.paidAmount = (rentRecord.paidAmount || 0) + amount;
    rentRecord.remainingAmount = rentRecord.rentAmount - rentRecord.paidAmount;

    if (rentRecord.paidAmount >= rentRecord.rentAmount) {
      rentRecord.status = "paid";
    } else if (rentRecord.paidAmount > 0) {
      rentRecord.status = "partially-paid";
    }

    await rentRecord.save();

    // Log action
    if (req.logAction) {
      req.logAction("payment-recorded", "payment", payment._id, null, {
        rentRecord,
        amount,
      });
    }

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while recording payment",
    });
  }
};

export const getTenantPayments = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ tenant: tenantId })
      .skip(skip)
      .limit(limit)
      .sort({ paymentDate: -1 });

    const total = await Payment.countDocuments({ tenant: tenantId });

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    console.error("Get tenant payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tenant payments",
    });
  }
};
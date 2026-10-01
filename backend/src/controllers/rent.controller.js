import RentRecord from "../models/RentRecord.model.js";
import Payment from "../models/Payment.model.js";
import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";
import ErrorResponse from "../utils/error.util.js";

export const getRentRecords = async (req, res) => {
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

    if (req.query.agreement) {
      filter.agreement = req.query.agreement;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.month) {
      filter.billingMonth = {
        $gte: new Date(req.query.month + "-01"),
        $lte: new Date(
          new Date(req.query.month + "-01").getMonth() + 1,
          0
        ),
      };
    }

    const rentRecords = await RentRecord.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await RentRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: rentRecords.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: rentRecords,
    });
  } catch (error) {
    console.error("Get rent records error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching rent records",
    });
  }
};

export const getRentRecord = async (req, res) => {
  try {
    const rentRecord = await RentRecord.findById(req.params.id);

    if (!rentRecord) {
      return res.status(404).json({
        success: false,
        message: "Rent record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rentRecord,
    });
  } catch (error) {
    console.error("Get rent record error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Rent record not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching rent record",
    });
  }
};

export const createRentRecord = async (req, res) => {
  try {
    const {
      tenant,
      property,
      agreement,
      billingMonth,
      dueDate,
      rentAmount,
      paymentMethod,
    } = req.body;

    if (!tenant || !property || !rentAmount) {
      return res.status(400).json({
        success: false,
        message: "Tenant, property, and rent amount are required",
      });
    }

    const rentRecord = await RentRecord.create({
      tenant,
      property,
      agreement,
      billingMonth: billingMonth ? new Date(billingMonth) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      rentAmount,
      paidAmount: 0,
      remainingAmount: rentAmount,
      status: "unpaid",
      paymentMethod,
    });

    // Log action
    if (req.logAction) {
      req.logAction("rent-record-created", "rent-record", rentRecord._id);
    }

    res.status(201).json({
      success: true,
      message: "Rent record created successfully",
      data: rentRecord,
    });
  } catch (error) {
    console.error("Create rent record error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating rent record",
    });
  }
};

export const updateRentRecord = async (req, res) => {
  try {
    const { paidAmount, paymentDate, paymentMethod, notes } = req.body;

    const rentRecord = await RentRecord.findByIdAndUpdate(
      req.params.id,
      {
        paidAmount,
        paymentDate: paidAmount ? new Date() : rentRecord.paymentDate,
        paymentMethod,
        notes,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!rentRecord) {
      return res.status(404).json({
        success: false,
        message: "Rent record not found",
      });
    }

    // Calculate remaining and status
    rentRecord.remainingAmount = rentRecord.rentAmount - rentRecord.paidAmount;

    if (rentRecord.paidAmount >= rentRecord.rentAmount) {
      rentRecord.status = "paid";
    } else if (rentRecord.paidAmount > 0) {
      rentRecord.status = "partially-paid";
    } else {
      rentRecord.status = "unpaid";
    }

    await rentRecord.save();

    // Log action
    if (req.logAction) {
      req.logAction("rent-record-updated", "rent-record", rentRecord._id);
    }

    res.status(200).json({
      success: true,
      message: "Rent record updated successfully",
      data: rentRecord,
    });
  } catch (error) {
    console.error("Update rent record error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Rent record not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating rent record",
    });
  }
};

export const getTenantRentHistory = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const rentRecords = await RentRecord.find({ tenant: tenantId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await RentRecord.countDocuments({ tenant: tenantId });

    res.status(200).json({
      success: true,
      count: rentRecords.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: rentRecords,
    });
  } catch (error) {
    console.error("Get tenant rent history error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching rent history",
    });
  }
};
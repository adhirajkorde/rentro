import RentalAgreement from "../models/RentalAgreement.model.js";
import AgreementSignature from "../models/AgreementSignature.model.js";
import ErrorResponse from "../utils/error.util.js";

export const getAgreements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.owner) {
      filter.owner = req.query.owner;
    }

    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }

    if (req.query.property) {
      filter.property = req.query.property;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.expiring) {
      // Agreements expiring within 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filter.endDate = { $lte: thirtyDaysFromNow };
    }

    const agreements = await RentalAgreement.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await RentalAgreement.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: agreements.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: agreements,
    });
  } catch (error) {
    console.error("Get agreements error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching agreements",
    });
  }
};

export const getAgreement = async (req, res) => {
  try {
    const agreement = await RentalAgreement.findById(req.params.id)
      .populate("owner", "fullName email")
      .populate("tenant", "fullName email phone")
      .populate("property", "name address");

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    res.status(200).json({
      success: true,
      data: agreement,
    });
  } catch (error) {
    console.error("Get agreement error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching agreement",
    });
  }
};

export const createAgreement = async (req, res) => {
  try {
    const {
      owner,
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
    } = req.body;

    if (!owner || !tenant || !property || !startDate || !endDate || !monthlyRent) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if tenant already has an active agreement for this property
    const existingAgreement = await RentalAgreement.findOne({
      tenant,
      property,
      status: "active",
    });

    if (existingAgreement) {
      return res.status(409).json({
        success: false,
        message: "An active agreement already exists for this tenant and property",
      });
    }

    const agreement = await RentalAgreement.create({
      owner,
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

    // Auto-create rent records for the duration of the agreement
    // (This is a simplified version - full implementation would generate records monthly)
    await generateInitialRentRecords(agreement._id);

    // Log action
    if (req.logAction) {
      req.logAction("agreement-created", "agreement", agreement._id, null, {
        tenant,
        property,
      });
    }

    res.status(201).json({
      success: true,
      message: "Rental agreement created successfully",
      data: agreement,
    });
  } catch (error) {
    console.error("Create agreement error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating agreement",
    });
  }
};

export const updateAgreement = async (req, res) => {
  try {
    const agreement = await RentalAgreement.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    // Log action
    if (req.logAction) {
      req.logAction("agreement-updated", "agreement", agreement._id);
    }

    res.status(200).json({
      success: true,
      message: "Agreement updated successfully",
      data: agreement,
    });
  } catch (error) {
    console.error("Update agreement error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating agreement",
    });
  }
};

export const deleteAgreement = async (req, res) => {
  try {
    const agreement = await RentalAgreement.findByIdAndUpdate(
      req.params.id,
      { status: "terminated", isActive: false },
      { new: true }
    );

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    // Log action
    if (req.logAction) {
      req.logAction("agreement-terminated", "agreement", agreement._id);
    }

    res.status(200).json({
      success: true,
      message: "Agreement terminated successfully",
    });
  } catch (error) {
    console.error("Delete agreement error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while terminating agreement",
    });
  }
};

export const toggleAgreementStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const agreement = await RentalAgreement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Agreement status updated successfully",
      data: agreement,
    });
  } catch (error) {
    console.error("Toggle agreement status error:", error);
    if (error.kind === "ObjectId" || error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Agreement not found",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating agreement status",
    });
  }
};

// Helper function to generate initial rent records
async function generateInitialRentRecords(agreementId) {
  const agreement = await RentalAgreement.findById(agreementId).populate(
    "tenant property"
  );

  if (!agreement) return;

  const { startDate, endDate, monthlyRent } = agreement;
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start);

  while (currentDate <= end) {
    const monthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const rentRecord = await RentRecord.create({
      tenant: agreement.tenant._id,
      property: agreement.property._id,
      agreement: agreement._id,
      billingMonth: new Date(currentDate),
      dueDate: monthEnd,
      rentAmount: monthlyRent,
      paidAmount: 0,
      remainingAmount: monthlyRent,
      status: "unpaid",
    });

    currentDate = new Date(currentDate.getMonth() + 1, 1);
  }
}
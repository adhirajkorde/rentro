import SecurityDeposit from "../models/SecurityDeposit.model.js";
import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";
import RentalAgreement from "../models/RentalAgreement.model.js";
import Damage from "../models/Damage.model.js";
import Inspection from "../models/Inspection.model.js";

export const getSecurityDeposits = async (req, res, next) => {
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
    if (req.query.status && req.query.status !== "all") filter.status = req.query.status;

    const [deposits, total] = await Promise.all([
      SecurityDeposit.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      SecurityDeposit.countDocuments(filter),
    ]);

    const populated = await Promise.all(
      deposits.map(async (dep) => {
        const dObj = dep.toObject ? dep.toObject() : { ...dep };
        const [propertyDetails, tenantDetails, agreementDetails] = await Promise.all([
          dep.property ? Property.findById(dep.property) : null,
          dep.tenant ? Tenant.findById(dep.tenant) : null,
          dep.agreement ? RentalAgreement.findById(dep.agreement) : null,
        ]);
        return {
          ...dObj,
          propertyDetails,
          tenantDetails,
          agreementDetails,
        };
      })
    );

    const totalHeld = populated
      .filter((d) => d.status === "held" || d.status === "received")
      .reduce((sum, d) => sum + (Number(d.depositAmount) || 0) - (Number(d.deductionAmount) || 0), 0);

    res.status(200).json({
      success: true,
      count: populated.length,
      total,
      totalHeld,
      page,
      pages: Math.ceil(total / limit),
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const getSecurityDeposit = async (req, res, next) => {
  try {
    const deposit = await SecurityDeposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({ success: false, message: "Security deposit not found" });
    }

    if (req.user.role !== "super-admin" && deposit.owner?.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Security deposit not found" });
    }

    const [propertyDetails, tenantDetails, agreementDetails, damages] = await Promise.all([
      Property.findById(deposit.property),
      Tenant.findById(deposit.tenant),
      deposit.agreement ? RentalAgreement.findById(deposit.agreement) : null,
      deposit.property ? Damage.find({ property: deposit.property }) : [],
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...deposit.toObject(),
        propertyDetails,
        tenantDetails,
        agreementDetails,
        damages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createSecurityDeposit = async (req, res, next) => {
  try {
    const { tenant, property, agreement, depositAmount, receivedDate, status, notes } = req.body;

    if (!tenant || !property || !depositAmount) {
      return res.status(400).json({ success: false, message: "Tenant, property, and deposit amount are required" });
    }

    const targetProperty = await Property.findById(property);
    if (!targetProperty || (req.user.role !== "super-admin" && targetProperty.owner?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized for this property" });
    }

    const deposit = await SecurityDeposit.create({
      owner: req.user._id,
      tenant,
      property,
      agreement: agreement || null,
      depositAmount: Number(depositAmount),
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      status: status || "held",
      notes: notes ? String(notes).trim() : "",
    });

    res.status(201).json({
      success: true,
      message: "Security deposit recorded successfully",
      data: deposit,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSecurityDeposit = async (req, res, next) => {
  try {
    const existing = await SecurityDeposit.findById(req.params.id);
    if (!existing || (req.user.role !== "super-admin" && existing.owner?.toString() !== req.user._id.toString())) {
      return res.status(404).json({ success: false, message: "Security deposit not found" });
    }

    const updated = await SecurityDeposit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Security deposit updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End-to-End Final Settlement Workflow:
 * Move-out inspection damages -> Deductions applied -> Deposit refunded -> Tenant moved out -> Property VACANT
 */
export const processFinalSettlement = async (req, res, next) => {
  try {
    const {
      depositId,
      deductionAmount,
      deductionReason,
      refundAmount,
      refundDate,
      notes,
      inspectionId,
      terminateAgreement = true,
      vacateProperty = true,
    } = req.body;

    const deposit = await SecurityDeposit.findById(depositId || req.params.id);

    if (!deposit) {
      return res.status(404).json({ success: false, message: "Security deposit record not found" });
    }

    if (req.user.role !== "super-admin" && deposit.owner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to settle this deposit" });
    }

    const depositAmt = Number(deposit.depositAmount) || 0;
    const deductAmt = Number(deductionAmount) || 0;
    const refAmt = refundAmount !== undefined ? Number(refundAmount) : Math.max(0, depositAmt - deductAmt);
    const finalStatus = refAmt > 0 && deductAmt > 0 ? "partially_refunded" : (refAmt === 0 && deductAmt > 0 ? "refunded" : "refunded");

    // Update Security Deposit
    deposit.deductionAmount = deductAmt;
    deposit.deductionReason = deductionReason ? String(deductionReason).trim() : "Final move-out settlement";
    deposit.refundAmount = refAmt;
    deposit.refundDate = refundDate ? new Date(refundDate) : new Date();
    deposit.status = finalStatus;
    if (notes) deposit.notes = notes;
    await deposit.save();

    // 1. Terminate Agreement if linked
    if (terminateAgreement && deposit.agreement) {
      await RentalAgreement.findByIdAndUpdate(deposit.agreement, {
        status: "terminated",
        isActive: false,
      });
    }

    // 2. Mark Tenant as moved out / inactive
    if (deposit.tenant) {
      await Tenant.findByIdAndUpdate(deposit.tenant, {
        status: "inactive",
        isActive: false,
        moveOutDate: new Date(),
        currentProperty: null,
      });
    }

    // 3. Mark Property as Available / VACANT
    if (vacateProperty && deposit.property) {
      await Property.findByIdAndUpdate(deposit.property, {
        tenant: null,
        status: "available",
      });
    }

    // 4. If inspectionId provided, complete inspection
    if (inspectionId) {
      await Inspection.findByIdAndUpdate(inspectionId, {
        status: "completed",
        type: "move-out",
      });
    }

    const [propertyDetails, tenantDetails] = await Promise.all([
      Property.findById(deposit.property),
      Tenant.findById(deposit.tenant),
    ]);

    res.status(200).json({
      success: true,
      message: "Final settlement completed successfully. Property is now VACANT and available.",
      data: {
        deposit,
        settlementSummary: {
          originalDeposit: depositAmt,
          damageDeductions: deductAmt,
          refundPaidToTenant: refAmt,
          settlementDate: deposit.refundDate,
          propertyStatus: propertyDetails?.status || "available",
          tenantStatus: tenantDetails?.status || "inactive",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

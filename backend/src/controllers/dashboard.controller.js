import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";
import RentalAgreement from "../models/RentalAgreement.model.js";
import RentRecord from "../models/RentRecord.model.js";
import Payment from "../models/Payment.model.js";
import SecurityDeposit from "../models/SecurityDeposit.model.js";
import Maintenance from "../models/Maintenance.model.js";
import UtilityCharge from "../models/UtilityCharge.model.js";
import Inspection from "../models/Inspection.model.js";
import KycDocument from "../models/KycDocument.model.js";
import Notification from "../models/Notification.model.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === "super-admin";
    const ownerFilter = isSuperAdmin ? {} : { owner: req.user._id };

    // Fetch all properties of this owner
    const properties = await Property.find(ownerFilter);
    const propertyIds = properties.map((p) => p._id);

    const totalProperties = properties.length;
    const occupiedProperties = properties.filter((p) => p.status === "occupied").length;
    const vacantProperties = properties.filter((p) => p.status === "available").length;
    const maintenanceProperties = properties.filter((p) => p.status === "under-maintenance" || p.status === "maintenance").length;
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

    // Fetch tenants
    const tenants = await Tenant.find(ownerFilter);
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === "active").length;

    // Fetch active agreements
    const agreements = await RentalAgreement.find(ownerFilter);
    const activeAgreements = agreements.filter((a) => a.status === "active");

    // Upcoming expiring agreements (next 45 days)
    const now = new Date();
    const fortyFiveDaysLater = new Date();
    fortyFiveDaysLater.setDate(now.getDate() + 45);

    const expiringAgreementsList = agreements.filter((a) => {
      if (a.status !== "active") return false;
      const end = new Date(a.endDate);
      return end >= now && end <= fortyFiveDaysLater;
    });

    // Rent records scoped to owner properties
    const rentRecords = propertyIds.length > 0
      ? await RentRecord.find({ property: { $in: propertyIds } })
      : [];

    // Current Month calculation
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const currentMonthRentRecords = rentRecords.filter((r) => {
      const b = new Date(r.billingMonth);
      return b >= currentMonthStart && b <= currentMonthEnd;
    });

    const monthlyExpectedRent = activeAgreements.reduce((sum, a) => sum + (Number(a.monthlyRent) || 0), 0) ||
      properties.filter((p) => p.status === "occupied").reduce((sum, p) => sum + (Number(p.monthlyRent) || 0), 0);

    const monthlyCollectedRent = currentMonthRentRecords.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0);
    const pendingRent = currentMonthRentRecords
      .filter((r) => r.status === "unpaid" || r.status === "partially-paid")
      .reduce((sum, r) => sum + (Number(r.remainingAmount) || 0), 0);

    const overdueRent = rentRecords
      .filter((r) => {
        const isPastDue = r.dueDate && new Date(r.dueDate) < now && r.status !== "paid" && r.status !== "waived";
        return r.status === "overdue" || isPastDue;
      })
      .reduce((sum, r) => sum + (Number(r.remainingAmount) || 0), 0);

    // Security deposits held
    const securityDeposits = await SecurityDeposit.find(ownerFilter);
    const securityDepositsHeld = securityDeposits
      .filter((d) => d.status === "held" || d.status === "received" || d.status === "pending")
      .reduce((sum, d) => sum + (Number(d.depositAmount) || 0) - (Number(d.deductionAmount) || 0), 0);

    // Maintenance expenses for current month
    const maintenanceExpenses = await Maintenance.find(ownerFilter);
    const currentMonthExpenses = maintenanceExpenses
      .filter((m) => {
        const d = new Date(m.expenseDate || m.createdAt);
        return d >= currentMonthStart && d <= currentMonthEnd;
      })
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

    // Utility charges for current month
    const utilityCharges = await UtilityCharge.find(ownerFilter);
    const currentMonthUtilities = utilityCharges
      .filter((u) => {
        const d = new Date(u.createdAt);
        return d >= currentMonthStart && d <= currentMonthEnd;
      })
      .reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

    // Recent payments (last 6)
    const payments = propertyIds.length > 0
      ? await Payment.find({ property: { $in: propertyIds } }).sort({ paymentDate: -1 }).limit(6)
      : [];

    const recentPayments = await Promise.all(
      payments.map(async (p) => {
        const [tenantObj, propObj] = await Promise.all([
          p.tenant ? Tenant.findById(p.tenant) : null,
          p.property ? Property.findById(p.property) : null,
        ]);
        return {
          ...p.toObject(),
          tenantName: tenantObj?.fullName || "Tenant",
          propertyName: propObj?.name || "Property",
        };
      })
    );

    // Recent inspections (last 6)
    const inspections = propertyIds.length > 0
      ? await Inspection.find({ property: { $in: propertyIds } }).sort({ inspectionDate: -1 }).limit(6)
      : [];

    const recentInspections = await Promise.all(
      inspections.map(async (insp) => {
        const [tenantObj, propObj] = await Promise.all([
          insp.tenant ? Tenant.findById(insp.tenant) : null,
          insp.property ? Property.findById(insp.property) : null,
        ]);
        return {
          ...insp.toObject(),
          tenantName: tenantObj?.fullName || "Tenant",
          propertyName: propObj?.name || "Property",
        };
      })
    );

    // Recent documents (last 6)
    const documents = await KycDocument.find(ownerFilter).sort({ createdAt: -1 }).limit(6);
    const recentDocuments = await Promise.all(
      documents.map(async (doc) => {
        const tenantObj = doc.tenant ? await Tenant.findById(doc.tenant) : null;
        return {
          ...doc.toObject(),
          tenantName: tenantObj?.fullName || "Tenant",
        };
      })
    );

    // Dynamic Reminders generated from real data
    const urgentReminders = [];

    // 1. Overdue rents
    const overdueRecords = rentRecords.filter((r) => {
      return (r.status === "overdue" || (r.dueDate && new Date(r.dueDate) < now)) && r.remainingAmount > 0;
    });
    if (overdueRecords.length > 0) {
      urgentReminders.push({
        id: "rem-overdue",
        type: "danger",
        title: `${overdueRecords.length} Overdue Rent Payments`,
        description: `Total outstanding overdue rent is INR ${overdueRent.toLocaleString("en-IN")}.`,
        link: "/rent",
      });
    }

    // 2. Expiring agreements
    if (expiringAgreementsList.length > 0) {
      urgentReminders.push({
        id: "rem-expiring",
        type: "warning",
        title: `${expiringAgreementsList.length} Rental Agreements Expiring Soon`,
        description: "Agreements are nearing their term end within 45 days.",
        link: "/agreements",
      });
    }

    // 3. Vacant properties
    if (vacantProperties > 0) {
      urgentReminders.push({
        id: "rem-vacant",
        type: "info",
        title: `${vacantProperties} Vacant Units Ready to Rent`,
        description: "Add new tenants or list them to maximize rental yield.",
        link: "/properties",
      });
    }

    // 4. Pending inspections
    const pendingInspectionsCount = inspections.filter((i) => i.status === "pending").length;
    if (pendingInspectionsCount > 0) {
      urgentReminders.push({
        id: "rem-inspection",
        type: "warning",
        title: `${pendingInspectionsCount} Pending Property Inspections`,
        description: "Move-in or move-out condition reports awaiting completion.",
        link: "/inspections",
      });
    }

    // Unread notifications count
    const unreadNotificationsCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        portfolio: {
          totalProperties,
          occupiedProperties,
          vacantProperties,
          maintenanceProperties,
          occupancyRate,
          totalTenants,
          activeTenants,
        },
        financials: {
          monthlyExpectedRent,
          monthlyCollectedRent,
          pendingRent,
          overdueRent,
          securityDepositsHeld,
          monthlyMaintenanceExpenses: currentMonthExpenses,
          monthlyUtilityCharges: currentMonthUtilities,
        },
        agreementsSummary: {
          totalAgreements: agreements.length,
          activeAgreements: activeAgreements.length,
          expiringSoonCount: expiringAgreementsList.length,
        },
        recentPayments,
        recentInspections,
        recentDocuments,
        urgentReminders,
        unreadNotificationsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

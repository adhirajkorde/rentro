import Property from "../models/Property.model.js";
import Tenant from "../models/Tenant.model.js";
import RentalAgreement from "../models/RentalAgreement.model.js";
import RentRecord from "../models/RentRecord.model.js";
import Payment from "../models/Payment.model.js";
import SecurityDeposit from "../models/SecurityDeposit.model.js";
import Maintenance from "../models/Maintenance.model.js";
import UtilityCharge from "../models/UtilityCharge.model.js";

export const getReportsSummary = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === "super-admin";
    const ownerFilter = isSuperAdmin ? {} : { owner: req.user._id };

    const [properties, tenants, agreements, deposits, maintenance, utilities] = await Promise.all([
      Property.find(ownerFilter),
      Tenant.find(ownerFilter),
      RentalAgreement.find(ownerFilter),
      SecurityDeposit.find(ownerFilter),
      Maintenance.find(ownerFilter),
      UtilityCharge.find(ownerFilter),
    ]);

    const propertyIds = properties.map((p) => p._id);
    const rentRecords = propertyIds.length > 0 ? await RentRecord.find({ property: { $in: propertyIds } }) : [];
    const payments = propertyIds.length > 0 ? await Payment.find({ property: { $in: propertyIds } }) : [];

    // 1. Property-wise Income vs Expense
    const propertyPerformance = await Promise.all(
      properties.map(async (p) => {
        const propPayments = payments.filter((pay) => pay.property?.toString() === p._id.toString());
        const propExpenses = maintenance.filter((m) => m.property?.toString() === p._id.toString());
        const propUtilities = utilities.filter((u) => u.property?.toString() === p._id.toString());

        const totalIncome = propPayments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
        const totalExpenses = propExpenses.reduce((s, exp) => s + (Number(exp.amount) || 0), 0) +
          propUtilities.reduce((s, ut) => s + (Number(ut.amount) || 0), 0);

        return {
          propertyId: p._id,
          name: p.name,
          type: p.type,
          city: p.city,
          status: p.status,
          monthlyRent: p.monthlyRent,
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses,
        };
      })
    );

    // 2. Monthly Collection Breakdown (Last 6 Months)
    const monthlyBreakdown = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });

      const mRecords = rentRecords.filter((r) => {
        const bm = new Date(r.billingMonth);
        return bm >= d && bm <= mEnd;
      });

      const mExpected = mRecords.reduce((s, r) => s + (Number(r.rentAmount) || 0), 0);
      const mCollected = mRecords.reduce((s, r) => s + (Number(r.paidAmount) || 0), 0);
      const mPending = mRecords.reduce((s, r) => s + (Number(r.remainingAmount) || 0), 0);

      monthlyBreakdown.push({
        month: label,
        expected: mExpected,
        collected: mCollected,
        pending: mPending,
      });
    }

    // 3. Outstanding / Overdue Summary
    const outstandingList = await Promise.all(
      rentRecords
        .filter((r) => r.remainingAmount > 0)
        .map(async (r) => {
          const [t, p] = await Promise.all([
            r.tenant ? Tenant.findById(r.tenant) : null,
            r.property ? Property.findById(r.property) : null,
          ]);
          return {
            recordId: r._id,
            tenantName: t?.fullName || "Tenant",
            tenantPhone: t?.phone || "N/A",
            propertyName: p?.name || "Property",
            billingMonth: r.billingMonth,
            dueDate: r.dueDate,
            rentAmount: r.rentAmount,
            paidAmount: r.paidAmount,
            remainingAmount: r.remainingAmount,
            status: r.status,
          };
        })
    );

    // 4. Security Deposit Status Summary
    const depositSummary = {
      totalHeld: deposits
        .filter((d) => d.status === "held" || d.status === "received")
        .reduce((s, d) => s + (Number(d.depositAmount) || 0) - (Number(d.deductionAmount) || 0), 0),
      totalRefunded: deposits
        .reduce((s, d) => s + (Number(d.refundAmount) || 0), 0),
      totalDeductions: deposits
        .reduce((s, d) => s + (Number(d.deductionAmount) || 0), 0),
      count: deposits.length,
    };

    // 5. Occupancy stats
    const occupancyStats = {
      total: properties.length,
      occupied: properties.filter((p) => p.status === "occupied").length,
      vacant: properties.filter((p) => p.status === "available").length,
      maintenance: properties.filter((p) => p.status === "under-maintenance" || p.status === "maintenance").length,
      rate: properties.length > 0 ? Math.round((properties.filter((p) => p.status === "occupied").length / properties.length) * 100) : 0,
    };

    res.status(200).json({
      success: true,
      data: {
        propertyPerformance,
        monthlyBreakdown,
        outstandingList,
        depositSummary,
        occupancyStats,
        totals: {
          totalIncome: payments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
          totalExpenses: maintenance.reduce((s, m) => s + (Number(m.amount) || 0), 0) + utilities.reduce((s, u) => s + (Number(u.amount) || 0), 0),
          totalProperties: properties.length,
          totalTenants: tenants.length,
          totalAgreements: agreements.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportReportsCsv = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === "super-admin";
    const ownerFilter = isSuperAdmin ? {} : { owner: req.user._id };
    const { type } = req.query; // 'income', 'outstanding', 'properties', 'maintenance'

    const properties = await Property.find(ownerFilter);
    const propertyIds = properties.map((p) => p._id);

    let csvContent = "";
    let filename = "Rentora_Report.csv";

    if (type === "outstanding") {
      filename = "Outstanding_Rent_Report.csv";
      const records = await RentRecord.find({ property: { $in: propertyIds } });
      const unpaid = records.filter((r) => r.remainingAmount > 0);

      csvContent = "Record ID,Property ID,Tenant ID,Billing Month,Due Date,Total Rent,Paid Amount,Remaining Amount,Status\n";
      for (const r of unpaid) {
        csvContent += `"${r._id}","${r.property}","${r.tenant}","${new Date(r.billingMonth).toISOString().slice(0, 7)}","${new Date(r.dueDate).toISOString().slice(0, 10)}",${r.rentAmount},${r.paidAmount},${r.remainingAmount},"${r.status}"\n`;
      }
    } else if (type === "maintenance") {
      filename = "Maintenance_Expenses_Report.csv";
      const expenses = await Maintenance.find(ownerFilter);
      csvContent = "Expense ID,Property ID,Category,Title,Amount,Date,Vendor,Status,Payment Method\n";
      for (const e of expenses) {
        csvContent += `"${e._id}","${e.property}","${e.category}","${(e.title || "").replace(/"/g, '""')}",${e.amount},"${new Date(e.expenseDate).toISOString().slice(0, 10)}","${(e.vendorName || "").replace(/"/g, '""')}","${e.status}","${e.paymentMethod || ""}"\n`;
      }
    } else {
      // Default: Property summary CSV
      filename = "Property_Summary_Report.csv";
      csvContent = "Property ID,Name,Type,City,Address,Monthly Rent,Security Deposit,Status\n";
      for (const p of properties) {
        csvContent += `"${p._id}","${p.name.replace(/"/g, '""')}","${p.type}","${p.city || ""}","${p.address.replace(/"/g, '""')}",${p.monthlyRent},${p.securityDeposit || 0},"${p.status}"\n`;
      }
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

import React, { useState, useEffect } from "react";
import { reportApi } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function Reports() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getSummary();
      setData(res.data.data);
    } catch (err) {
      showToast(err.message || "Failed to load financial reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = async (type) => {
    try {
      showToast(`Generating ${type} report CSV...`, "info");
      await reportApi.downloadCsv(type);
      showToast("CSV export downloaded successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to export CSV", "error");
    }
  };

  if (loading) {
    return <div className="card text-center p-8">Loading analytics & financial reports...</div>;
  }

  const { overall, propertyBreakdown, outstandingRentList } = data || {};

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: "700" }}>Financial & Portfolio Reports</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Comprehensive revenue breakdown, net operating income (NOI), and audit statements
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => handleExportCsv("rent-collections")}
          >
            📊 Export Rent CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleExportCsv("expenses")}
          >
            📊 Export Expenses CSV
          </button>
        </div>
      </div>

      {/* P&L OVERVIEW */}
      <div className="grid grid-4 gap-6 mb-8">
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            TOTAL RENT COLLECTED
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--success-500)", marginTop: "0.5rem" }}>
            ₹{overall?.totalRentCollected?.toLocaleString() || 0}
          </div>
        </div>

        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            TOTAL EXPENSES
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--danger-500)", marginTop: "0.5rem" }}>
            ₹{overall?.totalMaintenanceExpenses?.toLocaleString() || 0}
          </div>
        </div>

        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            NET OPERATING INCOME
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: (overall?.netOperatingIncome || 0) >= 0 ? "var(--primary-600)" : "var(--danger-500)",
              marginTop: "0.5rem",
            }}
          >
            ₹{overall?.netOperatingIncome?.toLocaleString() || 0}
          </div>
        </div>

        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            TOTAL PENDING DUES
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--warning-500)", marginTop: "0.5rem" }}>
            ₹{overall?.totalPendingRent?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* PROPERTY BREAKDOWN */}
      <div className="card mb-8">
        <h3 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1rem" }}>
          Property-Wise Income & Expense Performance
        </h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Status</th>
                <th>Rent Collected</th>
                <th>Expenses</th>
                <th>Net Yield</th>
                <th>Occupancy Rate</th>
              </tr>
            </thead>
            <tbody>
              {propertyBreakdown && propertyBreakdown.length > 0 ? (
                propertyBreakdown.map((p) => {
                  const net = p.rentCollected - p.expenses;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {p.address}, {p.city}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === "OCCUPIED" ? "badge-success" : "badge-secondary"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--success-500)" }}>
                        ₹{p.rentCollected?.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--danger-500)" }}>
                        ₹{p.expenses?.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 700, color: net >= 0 ? "var(--primary-600)" : "var(--danger-500)" }}>
                        ₹{net?.toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {p.status === "OCCUPIED" ? "100%" : "0%"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">No property breakdown data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OUTSTANDING RENT ARREARS */}
      <div className="card">
        <h3 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1rem" }}>
          Outstanding Tenant Rent Arrears
        </h3>
        {outstandingRentList && outstandingRentList.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Due Date</th>
                  <th>Expected Rent</th>
                  <th>Paid</th>
                  <th>Unpaid Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {outstandingRentList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{item.month}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.tenantName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {item.tenantPhone}
                      </div>
                    </td>
                    <td>{item.propertyName}</td>
                    <td>{item.dueDate}</td>
                    <td>₹{item.amount?.toLocaleString()}</td>
                    <td style={{ color: "var(--success-500)" }}>₹{item.paidAmount?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: "var(--danger-500)" }}>
                      ₹{item.pendingAmount?.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${item.status === "OVERDUE" ? "badge-danger" : "badge-warning"}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>
            ✓ Great! All active tenants have paid up to date with zero pending arrears.
          </p>
        )}
      </div>
    </div>
  );
}

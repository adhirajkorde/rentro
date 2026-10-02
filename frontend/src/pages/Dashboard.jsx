import React, { useState, useEffect } from "react";
import {
  Building2,
  UsersRound,
  CreditCard,
  Home,
  ShieldCheck,
  Wrench,
  Zap,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  CalendarDays,
  Clock3,
  Download,
  CheckCircle2,
} from "lucide-react";
import { getDashboardStats, downloadPaymentReceipt } from "../services/api";
import { useToast } from "../context/ToastContext";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const Dashboard = ({ setActivePage, onOpenAddProperty }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      addToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDownloadReceipt = async (paymentId, txn) => {
    try {
      addToast("Generating payment receipt PDF...", "info");
      const blob = await downloadPaymentReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${txn || paymentId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast("Receipt downloaded successfully", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to download receipt PDF", "error");
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6b7d73" }}>
        <div style={{ display: "inline-block", width: "32px", height: "32px", border: "3px solid #cbd8ce", borderTopColor: "#1a4d40", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: "12px", fontSize: "13px" }}>Loading owner portfolio statistics...</p>
      </div>
    );
  }

  const portfolio = data?.portfolio || {};
  const financials = data?.financials || {};
  const recentPayments = data?.recentPayments || [];
  const recentInspections = data?.recentInspections || [];
  const recentDocuments = data?.recentDocuments || [];
  const urgentReminders = data?.urgentReminders || [];

  return (
    <div>
      {/* Header Heading */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <CalendarDays size={14} /> {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          <h1>Portfolio Overview</h1>
          <p>Real-time occupancy, rental cashflow, and tenancy health metrics.</p>
        </div>
        <div className="header-actions">
          <button className="primary-button" onClick={onOpenAddProperty} type="button">
            <Plus size={17} strokeWidth={2.4} /> Add property
          </button>
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <section className="metrics-grid" aria-label="Portfolio summary">
        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-icon"><Building2 size={18} /></span>
            <span className="metric-period">PORTFOLIO</span>
          </div>
          <p>Total Properties</p>
          <strong>{String(portfolio.totalProperties || 0).padStart(2, "0")}</strong>
          <small>{portfolio.occupiedProperties || 0} occupied · {portfolio.vacantProperties || 0} vacant</small>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-icon metric-icon-blue"><CreditCard size={18} /></span>
            <span className="metric-period">THIS MONTH EXPECTED</span>
          </div>
          <p>Monthly Expected Rent</p>
          <strong className="metric-currency">{formatINR(financials.monthlyExpectedRent)}</strong>
          <small>From active tenant leases</small>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-icon metric-icon-coral"><UsersRound size={18} /></span>
            <span className="metric-period">COLLECTED THIS MONTH</span>
          </div>
          <p>Monthly Rent Collected</p>
          <strong className="metric-currency" style={{ color: "#166534" }}>{formatINR(financials.monthlyCollectedRent)}</strong>
          <small>Pending: {formatINR(financials.pendingRent)}</small>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-icon metric-icon-yellow"><ShieldCheck size={18} /></span>
            <span className="metric-period">IN ESCROW</span>
          </div>
          <p>Security Deposits Held</p>
          <strong className="metric-currency">{formatINR(financials.securityDepositsHeld)}</strong>
          <small>Held for {portfolio.occupiedProperties || 0} active tenants</small>
        </article>
      </section>

      {/* Urgent Reminders Section */}
      {urgentReminders.length > 0 && (
        <section style={{ marginBottom: "20px" }}>
          <div style={{ display: "grid", gap: "10px" }}>
            {urgentReminders.map((rem, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: rem.type === "danger" ? "#fef2f2" : rem.type === "warning" ? "#fffbeb" : "#f0fdf4",
                  border: `1px solid ${rem.type === "danger" ? "#fecaca" : rem.type === "warning" ? "#fde68a" : "#bbf7d0"}`,
                  color: rem.type === "danger" ? "#991b1b" : rem.type === "warning" ? "#92400e" : "#166534",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <AlertTriangle size={18} />
                  <div>
                    <strong style={{ fontSize: "12.5px" }}>{rem.title}</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", opacity: 0.85 }}>{rem.description}</p>
                  </div>
                </div>
                {rem.link && (
                  <button
                    type="button"
                    className="text-button"
                    style={{ color: "inherit", fontWeight: "700" }}
                    onClick={() => {
                      const p = rem.link.replace("/", "");
                      const target = p.charAt(0).toUpperCase() + p.slice(1);
                      setActivePage(target === "Rent" ? "Rent" : target);
                    }}
                  >
                    View Details <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Occupancy and Financials Middle Row */}
      <section className="lower-grid" style={{ marginBottom: "20px" }}>
        {/* Occupancy Donut */}
        <article className="occupancy-panel">
          <div className="section-heading compact-heading">
            <div>
              <div className="section-kicker">PORTFOLIO HEALTH</div>
              <h2>Occupancy Snapshot</h2>
            </div>
            <button
              className="subtle-icon-button"
              type="button"
              title="View properties"
              onClick={() => setActivePage("Properties")}
            >
              <ArrowUpRight size={17} />
            </button>
          </div>

          <div className="occupancy-content">
            <div
              className="donut-chart"
              style={{ "--occupancy": `${portfolio.occupancyRate || 0}%` }}
            >
              <div>
                <strong>{portfolio.occupancyRate || 0}%</strong>
                <span>occupied</span>
              </div>
            </div>

            <div className="occupancy-legend">
              <div>
                <i className="legend-occupied" />
                <span>Occupied Units</span>
                <strong>{portfolio.occupiedProperties || 0}</strong>
              </div>
              <div>
                <i className="legend-available" />
                <span>Vacant Ready</span>
                <strong>{portfolio.vacantProperties || 0}</strong>
              </div>
              <div>
                <i className="legend-reserved" />
                <span>Under Maintenance</span>
                <strong>{portfolio.maintenanceProperties || 0}</strong>
              </div>
            </div>
          </div>
        </article>

        {/* Expenses & Utilities Summary */}
        <article className="activity-panel">
          <div className="section-heading compact-heading">
            <div>
              <div className="section-kicker">OUTFLOW SUMMARY</div>
              <h2>Expenses & Utilities</h2>
            </div>
            <button
              className="subtle-icon-button"
              type="button"
              title="View expenses"
              onClick={() => setActivePage("Maintenance")}
            >
              <ArrowUpRight size={17} />
            </button>
          </div>

          <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fafcfa", borderRadius: "6px", border: "1px solid #edf2ed" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="metric-icon"><Wrench size={16} /></span>
                <div>
                  <strong style={{ fontSize: "12px", color: "#1e382e" }}>Maintenance Expenses</strong>
                  <small style={{ display: "block", color: "#7a8a81", fontSize: "10px" }}>Current billing period</small>
                </div>
              </div>
              <strong style={{ fontSize: "13px", color: "#991b1b" }}>{formatINR(financials.monthlyMaintenanceExpenses)}</strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fafcfa", borderRadius: "6px", border: "1px solid #edf2ed" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="metric-icon metric-icon-yellow"><Zap size={16} /></span>
                <div>
                  <strong style={{ fontSize: "12px", color: "#1e382e" }}>Utility Readings Logged</strong>
                  <small style={{ display: "block", color: "#7a8a81", fontSize: "10px" }}>Electricity & water charges</small>
                </div>
              </div>
              <strong style={{ fontSize: "13px", color: "#1e382e" }}>{formatINR(financials.monthlyUtilityCharges)}</strong>
            </div>
          </div>
        </article>
      </section>

      {/* Recent Activity: Recent Rent Payments Table */}
      <section className="property-section">
        <div className="section-heading">
          <div>
            <div className="section-kicker">FINANCIAL TRANSACTIONS</div>
            <h2>Recent Rent Payments</h2>
          </div>
          <button className="view-all-button" type="button" onClick={() => setActivePage("Rent")}>
            View all payments <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="property-table-wrap">
          <table className="property-table">
            <thead>
              <tr>
                <th>TENANT</th>
                <th>PROPERTY</th>
                <th>PAYMENT DATE</th>
                <th>AMOUNT PAID</th>
                <th>METHOD</th>
                <th>RECEIPT</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-results">No rent payments recorded yet.</td>
                </tr>
              ) : (
                recentPayments.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="property-name-cell">
                        <span className="property-thumb"><UsersRound size={17} /></span>
                        <div>
                          <strong>{p.tenantName}</strong>
                          <small>{p.transactionId || "Direct Payment"}</small>
                        </div>
                      </div>
                    </td>
                    <td>{p.propertyName}</td>
                    <td>{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                    <td className="rent-cell">{formatINR(p.amount)}</td>
                    <td>
                      <span className="status-pill status-paid">
                        <i /> {p.paymentMethod || "UPI"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        style={{ minHeight: "28px", padding: "0 9px", fontSize: "10px", gap: "4px" }}
                        type="button"
                        onClick={() => handleDownloadReceipt(p._id, p.transactionId)}
                      >
                        <Download size={12} /> Receipt PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;


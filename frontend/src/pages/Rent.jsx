import React, { useState, useEffect } from "react";
import { rentApi, paymentApi, propertyApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

export default function Rent() {
  const { showToast } = useToast();
  const [rentRecords, setRentRecords] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProperty, setFilterProperty] = useState("all");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRent, setSelectedRent] = useState(null);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "UPI",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rentRes, propRes] = await Promise.all([
        rentApi.getAll(),
        propertyApi.getAll(),
      ]);
      setRentRecords(rentRes.data.data || []);
      setProperties(propRes.data.data || []);
    } catch (err) {
      showToast(err.message || "Failed to load rent schedule", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPaymentModal = (record) => {
    setSelectedRent(record);
    const balance = record.amount - record.paidAmount;
    setPaymentData({
      amount: balance > 0 ? balance : record.amount,
      paymentMethod: "UPI",
      referenceNumber: "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: `Rent payment for ${record.month}`,
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedRent) return;

    try {
      await paymentApi.create({
        rentRecordId: selectedRent.id,
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        paymentDate: paymentData.paymentDate,
        notes: paymentData.notes,
      });

      showToast("Payment recorded successfully!", "success");
      setShowPaymentModal(false);
      setSelectedRent(null);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to record payment", "error");
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      showToast("Generating official payment receipt PDF...", "info");
      await paymentApi.downloadReceipt(paymentId);
      showToast("Receipt downloaded successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to download receipt", "error");
    }
  };

  const filteredRecords = rentRecords.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterProperty !== "all" && r.propertyId !== filterProperty) return false;
    return true;
  });

  const totalDue = filteredRecords.reduce((acc, r) => acc + (r.amount - r.paidAmount), 0);
  const totalCollected = filteredRecords.reduce((acc, r) => acc + r.paidAmount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: "700" }}>Rent & Payments Management</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Track monthly collections, record partial/full payments, and issue legal PDF receipts
          </p>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-3 gap-6 mb-6">
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            TOTAL COLLECTED
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--success-500)", marginTop: "0.5rem" }}>
            ₹{totalCollected.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            OUTSTANDING BALANCE
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--danger-500)", marginTop: "0.5rem" }}>
            ₹{totalDue.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            ACTIVE SCHEDULES
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "0.5rem" }}>
            {filteredRecords.length} records
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card mb-6">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {["all", "PAID", "PARTIAL", "UNPAID", "OVERDUE"].map((st) => (
              <button
                key={st}
                className={`btn btn-sm ${filterStatus === st ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Property:</span>
            <select
              className="form-control"
              style={{ width: "220px", padding: "0.35rem 0.6rem" }}
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card text-center p-8">Loading rent records...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="card text-center p-8">
          <p style={{ color: "var(--text-muted)" }}>No rent records match the selected criteria.</p>
        </div>
      ) : (
        <div className="card table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Property</th>
                <th>Tenant</th>
                <th>Due Date</th>
                <th>Rent Amount</th>
                <th>Paid Amount</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => {
                const balance = r.amount - r.paidAmount;
                return (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.month}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.property?.name || "N/A"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {r.property?.city}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.tenant?.name || "N/A"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {r.tenant?.phone}
                      </div>
                    </td>
                    <td>{r.dueDate}</td>
                    <td style={{ fontWeight: 600 }}>₹{r.amount?.toLocaleString()}</td>
                    <td style={{ color: "var(--success-500)", fontWeight: 600 }}>
                      ₹{r.paidAmount?.toLocaleString()}
                    </td>
                    <td style={{ color: balance > 0 ? "var(--danger-500)" : "var(--text-muted)", fontWeight: 600 }}>
                      ₹{balance?.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === "PAID"
                            ? "badge-success"
                            : r.status === "PARTIAL"
                            ? "badge-warning"
                            : "badge-danger"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {r.status !== "PAID" && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openPaymentModal(r)}
                          >
                            💳 Record Pay
                          </button>
                        )}
                        {r.payments && r.payments.length > 0 && (
                          <button
                            className="btn btn-sm btn-secondary"
                            title="Download Latest Receipt"
                            onClick={() => handleDownloadReceipt(r.payments[r.payments.length - 1].id)}
                          >
                            🧾 Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Record Payment for ${selectedRent?.tenant?.name} (${selectedRent?.month})`}
      >
        <form onSubmit={handleRecordPayment}>
          <div className="card mb-4" style={{ background: "var(--bg-secondary)" }}>
            <div className="flex justify-between mb-2">
              <span style={{ color: "var(--text-muted)" }}>Total Rent Due:</span>
              <span style={{ fontWeight: 600 }}>₹{selectedRent?.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: "var(--text-muted)" }}>Already Paid:</span>
              <span style={{ fontWeight: 600, color: "var(--success-500)" }}>
                ₹{selectedRent?.paidAmount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2" style={{ borderColor: "var(--border-color)" }}>
              <span style={{ fontWeight: 600 }}>Remaining Balance:</span>
              <span style={{ fontWeight: 700, color: "var(--danger-500)" }}>
                ₹{(selectedRent ? selectedRent.amount - selectedRent.paidAmount : 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount (₹) *</label>
            <input
              type="number"
              className="form-control"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              max={selectedRent ? selectedRent.amount - selectedRent.paidAmount : undefined}
              required
            />
            <small style={{ color: "var(--text-muted)" }}>
              Supports partial payments. Remaining balance will update automatically.
            </small>
          </div>

          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-control"
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                required
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                className="form-control"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction / Reference Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. UPI Ref #402910482019"
              value={paymentData.referenceNumber}
              onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              rows="2"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Payment & Generate Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

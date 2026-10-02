import React, { useState, useEffect } from "react";
import { depositApi, propertyApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

export default function SecurityDeposits() {
  const { showToast } = useToast();
  const [deposits, setDeposits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  const [settlementData, setSettlementData] = useState({
    deductionAmount: 0,
    deductionReason: "",
    refundAmount: 0,
    refundDate: new Date().toISOString().split("T")[0],
    moveOutDate: new Date().toISOString().split("T")[0],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [depRes, propRes] = await Promise.all([
        depositApi.getAll(),
        propertyApi.getAll(),
      ]);
      setDeposits(depRes.data.data || []);
      setProperties(propRes.data.data || []);
    } catch (err) {
      showToast(err.message || "Failed to load security deposits", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openSettlementModal = (dep) => {
    setSelectedDeposit(dep);
    setSettlementData({
      deductionAmount: 0,
      deductionReason: "Final inspection cleanup & minor wall repairs",
      refundAmount: dep.amount,
      refundDate: new Date().toISOString().split("T")[0],
      moveOutDate: new Date().toISOString().split("T")[0],
    });
    setShowSettlementModal(true);
  };

  const handleDeductionChange = (deduction) => {
    const ded = Number(deduction) || 0;
    const total = selectedDeposit ? selectedDeposit.amount : 0;
    const ref = Math.max(0, total - ded);
    setSettlementData((prev) => ({
      ...prev,
      deductionAmount: ded,
      refundAmount: ref,
    }));
  };

  const handleExecuteSettlement = async (e) => {
    e.preventDefault();
    if (!selectedDeposit) return;

    try {
      await depositApi.settle(selectedDeposit.id, {
        deductionAmount: Number(settlementData.deductionAmount),
        deductionReason: settlementData.deductionReason,
        refundAmount: Number(settlementData.refundAmount),
        refundDate: settlementData.refundDate,
        moveOutDate: settlementData.moveOutDate,
      });

      showToast("Final Move-Out Settlement executed! Tenant moved out and property marked VACANT.", "success");
      setShowSettlementModal(false);
      setSelectedDeposit(null);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to execute settlement", "error");
    }
  };

  const filteredDeposits = deposits.filter((d) => {
    if (filterStatus === "all") return true;
    return d.status === filterStatus;
  });

  const totalHeld = deposits
    .filter((d) => d.status === "HELD" || d.status === "RECEIVED")
    .reduce((acc, d) => acc + d.amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: "700" }}>Security Deposit & Move-out Settlement</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Manage held tenant deposits and execute end-to-end move-out final settlements
          </p>
        </div>
      </div>

      <div className="grid grid-3 gap-6 mb-6">
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            TOTAL DEPOSITS HELD
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--primary-600)", marginTop: "0.5rem" }}>
            ₹{totalHeld.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            ACTIVE DEPOSITS
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "0.5rem" }}>
            {deposits.filter((d) => d.status === "HELD" || d.status === "RECEIVED").length}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            REFUNDED / SETTLED
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--success-500)", marginTop: "0.5rem" }}>
            {deposits.filter((d) => d.status === "REFUNDED" || d.status === "PARTIALLY_REFUNDED").length}
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex gap-2">
          {["all", "HELD", "RECEIVED", "REFUNDED", "PARTIALLY_REFUNDED"].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${filterStatus === st ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card text-center p-8">Loading security deposits...</div>
      ) : filteredDeposits.length === 0 ? (
        <div className="card text-center p-8">
          <p style={{ color: "var(--text-muted)" }}>No security deposits found.</p>
        </div>
      ) : (
        <div className="card table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Tenant</th>
                <th>Deposit Amount</th>
                <th>Date Received</th>
                <th>Deductions</th>
                <th>Refunded Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeposits.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.property?.name || "N/A"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {d.property?.city}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.tenant?.name || "N/A"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {d.tenant?.phone}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--primary-600)" }}>
                    ₹{d.amount?.toLocaleString()}
                  </td>
                  <td>{d.dateReceived || "N/A"}</td>
                  <td>
                    {d.deductionAmount > 0 ? (
                      <div>
                        <span style={{ color: "var(--danger-500)", fontWeight: 600 }}>
                          -₹{d.deductionAmount.toLocaleString()}
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {d.deductionReason}
                        </div>
                      </div>
                    ) : (
                      "₹0"
                    )}
                  </td>
                  <td>
                    {d.refundAmount > 0 ? (
                      <span style={{ color: "var(--success-500)", fontWeight: 600 }}>
                        ₹{d.refundAmount.toLocaleString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        d.status === "REFUNDED"
                          ? "badge-success"
                          : d.status === "PARTIALLY_REFUNDED"
                          ? "badge-warning"
                          : "badge-primary"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td>
                    {d.status !== "REFUNDED" && d.status !== "PARTIALLY_REFUNDED" ? (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => openSettlementModal(d)}
                      >
                        ⚡ Final Move-Out Settlement
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        Settled on {d.refundDate}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FINAL MOVE-OUT SETTLEMENT MODAL */}
      <Modal
        isOpen={showSettlementModal}
        onClose={() => setShowSettlementModal(false)}
        title="Execute Move-Out Final Settlement"
        maxWidth="650px"
      >
        <form onSubmit={handleExecuteSettlement}>
          <div className="card mb-4" style={{ background: "var(--bg-secondary)" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              Settlement for {selectedDeposit?.tenant?.name} ({selectedDeposit?.property?.name})
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: "var(--text-muted)" }}>Held Deposit Amount:</span>
              <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>
                ₹{selectedDeposit?.amount?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Move-Out Date *</label>
              <input
                type="date"
                className="form-control"
                value={settlementData.moveOutDate}
                onChange={(e) => setSettlementData({ ...settlementData, moveOutDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Settlement / Refund Date *</label>
              <input
                type="date"
                className="form-control"
                value={settlementData.refundDate}
                onChange={(e) => setSettlementData({ ...settlementData, refundDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Damage Deductions (₹)</label>
              <input
                type="number"
                min="0"
                max={selectedDeposit ? selectedDeposit.amount : 0}
                className="form-control"
                value={settlementData.deductionAmount}
                onChange={(e) => handleDeductionChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Net Refund to Tenant (₹)</label>
              <input
                type="number"
                className="form-control"
                value={settlementData.refundAmount}
                readOnly
                style={{ background: "var(--bg-secondary)", fontWeight: 700, color: "var(--success-500)" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deduction Reason / Notes</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="e.g. Broken bathroom tile repair ₹2000, deep cleaning ₹1500"
              value={settlementData.deductionReason}
              onChange={(e) => setSettlementData({ ...settlementData, deductionReason: e.target.value })}
            />
          </div>

          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(239, 68, 68, 0.08)",
              borderLeft: "4px solid var(--danger-500)",
              borderRadius: "4px",
              fontSize: "0.8125rem",
              marginBottom: "1.5rem",
            }}
          >
            <strong>Note:</strong> Executing this settlement will terminate the active agreement, set tenant status to
            INACTIVE, mark the property status to <strong>VACANT</strong>, and record financial settlement.
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setShowSettlementModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              Confirm & Settle Deposit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

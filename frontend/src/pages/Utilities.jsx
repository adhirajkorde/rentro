import React, { useState, useEffect } from "react";
import { utilityApi, propertyApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import FileUpload from "../components/FileUpload";

export default function Utilities() {
  const { showToast } = useToast();
  const [utilities, setUtilities] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    utilityType: "ELECTRICITY",
    meterNumber: "",
    previousReading: 0,
    currentReading: 0,
    ratePerUnit: 8.5,
    readingDate: new Date().toISOString().split("T")[0],
    billAmount: 0,
    status: "UNPAID",
    meterPhotoUrl: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [utRes, propRes] = await Promise.all([
        utilityApi.getAll(),
        propertyApi.getAll(),
      ]);
      setUtilities(utRes.data.data || []);
      setProperties(propRes.data.data || []);
    } catch (err) {
      showToast(err.message || "Failed to load utility logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateUnitsAndBill = (prev, curr, rate) => {
    const p = Number(prev) || 0;
    const c = Number(curr) || 0;
    const r = Number(rate) || 0;
    const units = Math.max(0, c - p);
    const amount = units * r;
    return { units, amount };
  };

  const handleReadingChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const { amount } = calculateUnitsAndBill(
      updated.previousReading,
      updated.currentReading,
      updated.ratePerUnit
    );
    setFormData({
      ...updated,
      billAmount: amount,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await utilityApi.create({
        ...formData,
        previousReading: Number(formData.previousReading),
        currentReading: Number(formData.currentReading),
        ratePerUnit: Number(formData.ratePerUnit),
        billAmount: Number(formData.billAmount),
      });
      showToast("Utility meter reading recorded successfully!", "success");
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to record utility reading", "error");
    }
  };

  const filteredUtilities = utilities.filter((u) => {
    if (filterType === "all") return true;
    return u.utilityType === filterType;
  });

  const totalUtilityAmount = filteredUtilities.reduce((acc, u) => acc + u.billAmount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: "700" }}>Electricity & Water Tracking</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Log meter readings, auto-calculate consumption bills, and maintain meter photo proofs
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({
              propertyId: properties[0]?.id || "",
              utilityType: "ELECTRICITY",
              meterNumber: "",
              previousReading: 0,
              currentReading: 0,
              ratePerUnit: 8.5,
              readingDate: new Date().toISOString().split("T")[0],
              billAmount: 0,
              status: "UNPAID",
              meterPhotoUrl: "",
              notes: "",
            });
            setShowAddModal(true);
          }}
        >
          <span>➕</span> Record Meter Reading
        </button>
      </div>

      <div className="grid grid-3 gap-6 mb-6">
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            TOTAL BILLED
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--primary-600)", marginTop: "0.5rem" }}>
            ₹{totalUtilityAmount.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            ELECTRICITY LOGS
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "0.5rem" }}>
            {utilities.filter((u) => u.utilityType === "ELECTRICITY").length} readings
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            WATER LOGS
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "0.5rem" }}>
            {utilities.filter((u) => u.utilityType === "WATER").length} readings
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex gap-2">
          {["all", "ELECTRICITY", "WATER", "GAS", "OTHER"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${filterType === t ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card text-center p-8">Loading utility logs...</div>
      ) : filteredUtilities.length === 0 ? (
        <div className="card text-center p-8">
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>No utility readings recorded yet.</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Record First Reading
          </button>
        </div>
      ) : (
        <div className="card table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Meter No.</th>
                <th>Date</th>
                <th>Prev / Curr Reading</th>
                <th>Units Consumed</th>
                <th>Rate / Unit</th>
                <th>Total Bill</th>
                <th>Status</th>
                <th>Meter Photo</th>
              </tr>
            </thead>
            <tbody>
              {filteredUtilities.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.property?.name || "N/A"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {u.property?.city}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-secondary">
                      {u.utilityType === "ELECTRICITY" ? "⚡ Electricity" : "💧 Water"}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {u.meterNumber || "N/A"}
                  </td>
                  <td>{u.readingDate}</td>
                  <td>
                    <div style={{ fontSize: "0.8125rem" }}>
                      Prev: <strong>{u.previousReading}</strong> → Curr: <strong>{u.currentReading}</strong>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {u.unitsConsumed} {u.utilityType === "ELECTRICITY" ? "kWh" : "kL"}
                  </td>
                  <td>₹{u.ratePerUnit}</td>
                  <td style={{ fontWeight: 700, color: "var(--primary-600)" }}>
                    ₹{u.billAmount?.toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.status === "PAID" ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>
                    {u.meterPhotoUrl ? (
                      <a
                        href={u.meterPhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-secondary"
                        style={{ padding: "0.2rem 0.5rem" }}
                      >
                        📸 Proof
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No photo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RECORD READING MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Utility Meter Reading"
        maxWidth="650px"
      >
        <form onSubmit={handleCreate}>
          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Property *</label>
              <select
                className="form-control"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                required
              >
                <option value="">-- Choose Property --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Utility Type *</label>
              <select
                className="form-control"
                value={formData.utilityType}
                onChange={(e) =>
                  handleReadingChange(
                    "utilityType",
                    e.target.value
                  )
                }
                required
              >
                <option value="ELECTRICITY">⚡ Electricity</option>
                <option value="WATER">💧 Water</option>
                <option value="GAS">🔥 Gas</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Meter Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. MTR-EL-90812"
                value={formData.meterNumber}
                onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reading Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.readingDate}
                onChange={(e) => setFormData({ ...formData, readingDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Previous Reading</label>
              <input
                type="number"
                className="form-control"
                value={formData.previousReading}
                onChange={(e) => handleReadingChange("previousReading", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Current Reading *</label>
              <input
                type="number"
                className="form-control"
                value={formData.currentReading}
                onChange={(e) => handleReadingChange("currentReading", e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rate Per Unit (₹) *</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={formData.ratePerUnit}
                onChange={(e) => handleReadingChange("ratePerUnit", e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Calculated Bill (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.billAmount}
                readOnly
                style={{ background: "var(--bg-secondary)", fontWeight: 700, color: "var(--primary-600)" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Attach Meter Dial Photo</label>
            <FileUpload
              accept=".jpg,.jpeg,.png,.webp"
              maxSizeMb={10}
              folder="meter"
              onUploadSuccess={(url) => setFormData({ ...formData, meterPhotoUrl: url })}
              label="Upload photo of physical meter dial"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Meter Reading
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

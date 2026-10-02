import React, { useState, useEffect } from "react";
import { agreementApi, propertyApi, tenantApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import FileUpload from "../components/FileUpload";

export default function Agreements({ onViewDetail }) {
  const { showToast } = useToast();
  const [agreements, setAgreements] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [signedDocUrl, setSignedDocUrl] = useState("");

  const [formData, setFormData] = useState({
    propertyId: "",
    tenantId: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    securityDeposit: "",
    dueDay: "5",
    noticePeriodDays: "30",
    terms: "1. Rent is due on the specified day of each month.\n2. Tenant is responsible for electricity and water utility bills.\n3. 1 month advance written notice required prior to vacating.",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [agRes, propRes, tenRes] = await Promise.all([
        agreementApi.getAll(),
        propertyApi.getAll(),
        tenantApi.getAll(),
      ]);
      setAgreements(agRes.data.data || []);
      setProperties(propRes.data.data || []);
      setTenants(tenRes.data.data || []);
    } catch (err) {
      showToast(err.message || "Failed to load agreements", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePropertyChange = (e) => {
    const propId = e.target.value;
    const prop = properties.find((p) => p.id === propId);
    setFormData((prev) => ({
      ...prev,
      propertyId: propId,
      rentAmount: prop ? prop.rentAmount : prev.rentAmount,
      securityDeposit: prop ? prop.securityDeposit : prev.securityDeposit,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await agreementApi.create({
        ...formData,
        rentAmount: Number(formData.rentAmount),
        securityDeposit: Number(formData.securityDeposit),
        dueDay: Number(formData.dueDay),
        noticePeriodDays: Number(formData.noticePeriodDays),
      });
      showToast("Rental agreement created and rent schedule generated!", "success");
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to create agreement", "error");
    }
  };

  const handleDownloadPdf = async (agreement) => {
    try {
      showToast("Generating legal agreement PDF...", "info");
      await agreementApi.downloadPdf(agreement.id);
      showToast("Agreement PDF downloaded successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to download PDF", "error");
    }
  };

  const handleUploadSigned = async (e) => {
    e.preventDefault();
    if (!signedDocUrl) {
      showToast("Please upload the signed document scan first", "error");
      return;
    }
    try {
      await agreementApi.uploadSigned(selectedAgreement.id, {
        signedDocumentUrl: signedDocUrl,
      });
      showToast("Signed agreement uploaded and marked ACTIVE!", "success");
      setShowSignModal(false);
      setSelectedAgreement(null);
      setSignedDocUrl("");
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to upload signed agreement", "error");
    }
  };

  const filteredAgreements = agreements.filter((ag) => {
    if (filterStatus === "all") return true;
    return ag.status === filterStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: "700" }}>Rental Agreements</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Generate legal agreements, download printable PDFs, and archive signed contracts
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({
              propertyId: "",
              tenantId: "",
              startDate: new Date().toISOString().split("T")[0],
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              rentAmount: "",
              securityDeposit: "",
              dueDay: "5",
              noticePeriodDays: "30",
              terms: "1. Rent is payable in advance by the 5th of every month.\n2. Tenant will pay all electricity and water utility bills.\n3. 1 month advance notice required for termination.",
            });
            setShowCreateModal(true);
          }}
        >
          <span>➕</span> New Rental Agreement
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          {["all", "ACTIVE", "DRAFT", "EXPIRED", "TERMINATED"].map((st) => (
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
        <div className="card text-center p-8">Loading agreements...</div>
      ) : filteredAgreements.length === 0 ? (
        <div className="card text-center p-8">
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>No rental agreements found.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            Create Your First Agreement
          </button>
        </div>
      ) : (
        <div className="card table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Agreement ID</th>
                <th>Property</th>
                <th>Tenant</th>
                <th>Tenure</th>
                <th>Monthly Rent</th>
                <th>Deposit</th>
                <th>Status</th>
                <th>Signed Doc</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgreements.map((ag) => (
                <tr key={ag.id}>
                  <td>
                    <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{ag.agreementNumber}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "600" }}>{ag.property?.name || "N/A"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {ag.property?.city}, {ag.property?.pincode}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: "600" }}>{ag.tenant?.name || "N/A"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {ag.tenant?.phone}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.8125rem" }}>
                      {ag.startDate} to {ag.endDate}
                    </div>
                  </td>
                  <td style={{ fontWeight: "600", color: "var(--primary-600)" }}>
                    ₹{ag.rentAmount?.toLocaleString()}
                  </td>
                  <td>₹{ag.securityDeposit?.toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        ag.status === "ACTIVE"
                          ? "badge-success"
                          : ag.status === "DRAFT"
                          ? "badge-warning"
                          : "badge-danger"
                      }`}
                    >
                      {ag.status}
                    </span>
                  </td>
                  <td>
                    {ag.signedDocumentUrl ? (
                      <a
                        href={ag.signedDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-secondary"
                        style={{ padding: "0.2rem 0.5rem" }}
                      >
                        📄 View Scan
                      </a>
                    ) : (
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                        onClick={() => {
                          setSelectedAgreement(ag);
                          setShowSignModal(true);
                        }}
                      >
                        📤 Upload Signed
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-secondary"
                        title="Download Legal PDF Agreement"
                        onClick={() => handleDownloadPdf(ag)}
                      >
                        📥 PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE AGREEMENT MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Rental Agreement"
        maxWidth="750px"
      >
        <form onSubmit={handleCreate}>
          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Select Property *</label>
              <select
                className="form-control"
                value={formData.propertyId}
                onChange={handlePropertyChange}
                required
              >
                <option value="">-- Choose Property --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.address}, {p.city}) - ₹{p.rentAmount}/mo
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Tenant *</label>
              <select
                className="form-control"
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                required
              >
                <option value="">-- Choose Tenant --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Agreement Start Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Agreement End Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Rent Amount (₹) *</label>
              <input
                type="number"
                className="form-control"
                value={formData.rentAmount}
                onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Security Deposit (₹) *</label>
              <input
                type="number"
                className="form-control"
                value={formData.securityDeposit}
                onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rent Due Day of Month</label>
              <input
                type="number"
                min="1"
                max="28"
                className="form-control"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notice Period (Days)</label>
              <input
                type="number"
                className="form-control"
                value={formData.noticePeriodDays}
                onChange={(e) => setFormData({ ...formData, noticePeriodDays: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Terms & Conditions</label>
            <textarea
              className="form-control"
              rows="4"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create & Generate Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* UPLOAD SIGNED SCAN MODAL */}
      <Modal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        title={`Upload Signed Agreement Scan (${selectedAgreement?.agreementNumber})`}
      >
        <form onSubmit={handleUploadSigned}>
          <div className="form-group">
            <label className="form-label">Upload Scanned Agreement (PDF or Image)</label>
            <FileUpload
              accept=".pdf,.png,.jpg,.jpeg"
              maxSizeMb={20}
              folder="agreements"
              onUploadSuccess={(url) => setSignedDocUrl(url)}
              label="Upload signed agreement scan"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="btn btn-secondary" onClick={() => setShowSignModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Signed Contract
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { documentApi, propertyApi, tenantApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import FileUpload from "../components/FileUpload";

export default function Documents() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: "",
    propertyId: "",
    documentType: "AADHAAR",
    documentNumber: "",
    documentUrl: "",
    expiryDate: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [docRes, propRes, tenRes] = await Promise.all([
        documentApi.getAll(),
        propertyApi.getAll(),
        tenantApi.getAll(),
      ]);
      setDocuments(docRes.data.data || []);
      setProperties(propRes.data.data || []);
      setTenants(tenRes.data.data || []);
    } catch (err) {
      showToast(err.message || "Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.documentUrl) {
      showToast("Please upload the document file first", "error");
      return;
    }

    try {
      await documentApi.create(formData);
      showToast("Document saved successfully!", "success");
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to save document", "error");
    }
  };

  const handleToggleVerify = async (doc) => {
    try {
      const nextStatus = doc.status === "VERIFIED" ? "PENDING" : "VERIFIED";
      await documentApi.verify(doc.id, {
        status: nextStatus,
        verificationNotes: `Verified by owner on ${new Date().toLocaleDateString()}`,
      });
      showToast(`Document marked as ${nextStatus}!`, "success");
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to update verification", "error");
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await documentApi.delete(docId);
      showToast("Document deleted successfully", "success");
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to delete document", "error");
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (filterType === "all") return true;
    return d.documentType === filterType;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: "700" }}>KYC & Legal Document Vault</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Securely store and verify Aadhaar, PAN, Passport, Police Verification, and contracts
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({
              tenantId: tenants[0]?.id || "",
              propertyId: properties[0]?.id || "",
              documentType: "AADHAAR",
              documentNumber: "",
              documentUrl: "",
              expiryDate: "",
              notes: "",
            });
            setShowAddModal(true);
          }}
        >
          <span>➕</span> Upload New Document
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex gap-2 flex-wrap">
          {["all", "AADHAAR", "PAN", "PASSPORT", "DRIVING_LICENSE", "POLICE_VERIFICATION", "AGREEMENT", "OTHER"].map(
            (t) => (
              <button
                key={t}
                className={`btn btn-sm ${filterType === t ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilterType(t)}
              >
                {t}
              </button>
            )
          )}
        </div>
      </div>

      {loading ? (
        <div className="card text-center p-8">Loading document vault...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="card text-center p-8">
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>No documents found matching criteria.</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="card table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Tenant / Property</th>
                <th>ID / Ref Number</th>
                <th>Upload Date</th>
                <th>Expiry Date</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{doc.documentType}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{doc.tenant?.name || "—"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {doc.property?.name || "N/A"}
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {doc.documentNumber ? `•••• ${doc.documentNumber.slice(-4)}` : "—"}
                  </td>
                  <td>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "—"}</td>
                  <td>{doc.expiryDate || "No expiry"}</td>
                  <td>
                    <button
                      className={`badge ${
                        doc.status === "VERIFIED" ? "badge-success" : "badge-warning"
                      }`}
                      style={{ cursor: "pointer", border: "none" }}
                      onClick={() => handleToggleVerify(doc)}
                      title="Click to toggle verification status"
                    >
                      {doc.status === "VERIFIED" ? "✓ Verified" : "⏳ Pending"}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-secondary"
                        style={{ padding: "0.25rem 0.5rem" }}
                      >
                        📄 View File
                      </a>
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{ color: "var(--danger-500)", padding: "0.25rem 0.5rem" }}
                        onClick={() => handleDelete(doc.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Upload KYC or Legal Document"
        maxWidth="650px"
      >
        <form onSubmit={handleCreate}>
          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Document Type *</label>
              <select
                className="form-control"
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                required
              >
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVING_LICENSE">Driving License</option>
                <option value="POLICE_VERIFICATION">Police Verification Form</option>
                <option value="AGREEMENT">Signed Agreement Copy</option>
                <option value="OTHER">Other Proof</option>
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
              <label className="form-label">Related Property</label>
              <select
                className="form-control"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              >
                <option value="">-- Optional Property --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Document / ID Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 5482 9102 4819"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date (if applicable)</label>
              <input
                type="date"
                className="form-control"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Front and back side scan"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Attach Document File (PDF / Image) *</label>
            <FileUpload
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              maxSizeMb={15}
              folder="kyc"
              onUploadSuccess={(url) => setFormData({ ...formData, documentUrl: url })}
              label="Upload document file"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Document to Vault
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

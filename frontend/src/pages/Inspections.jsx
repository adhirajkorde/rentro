import React, { useState, useEffect } from "react";
import { inspectionApi, propertyApi, tenantApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import FileUpload from "../components/FileUpload";

export default function Inspections() {
  const { showToast } = useToast();
  const [inspections, setInspections] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'compare'

  // Comparison State
  const [selectedCompareProp, setSelectedCompareProp] = useState("");
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Create Inspection Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    tenantId: "",
    type: "MOVE_IN",
    inspectionDate: new Date().toISOString().split("T")[0],
    inspectorName: "Owner",
    meterReadingElectricity: "",
    meterReadingWater: "",
    overallCondition: "GOOD",
    notes: "",
    mediaUrls: [],
  });

  const [currentUploadUrl, setCurrentUploadUrl] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [insRes, propRes, tenRes] = await Promise.all([
        inspectionApi.getAll(),
        propertyApi.getAll(),
      tenantApi.getAll(),
      ]);
      setInspections(insRes.data.data || []);
      setProperties(propRes.data.data || []);
      setTenants(tenRes.data.data || []);
      if (propRes.data.data?.length > 0) {
        setSelectedCompareProp(propRes.data.data[0].id);
      }
    } catch (err) {
      showToast(err.message || "Failed to load inspections", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadComparison = async (propId) => {
    if (!propId) return;
    try {
      setLoadingCompare(true);
      const res = await inspectionApi.compare(propId);
      setComparisonData(res.data.data);
    } catch (err) {
      showToast(err.message || "Failed to load comparison data", "error");
    } finally {
      setLoadingCompare(false);
    }
  };

  useEffect(() => {
    if (activeTab === "compare" && selectedCompareProp) {
      loadComparison(selectedCompareProp);
    }
  }, [activeTab, selectedCompareProp]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await inspectionApi.create({
        ...formData,
        meterReadingElectricity: Number(formData.meterReadingElectricity) || null,
        meterReadingWater: Number(formData.meterReadingWater) || null,
      });
      showToast(`${formData.type === "MOVE_IN" ? "Move-In" : "Move-Out"} inspection logged!`, "success");
      setShowAddModal(false);
      loadData();
      if (formData.propertyId === selectedCompareProp) {
        loadComparison(formData.propertyId);
      }
    } catch (err) {
      showToast(err.message || "Failed to create inspection", "error");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: "700" }}>Property Inspections & Comparison</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Perform Move-In / Move-Out inspections, checklist audits, and compare before/after photos
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({
              propertyId: properties[0]?.id || "",
              tenantId: tenants[0]?.id || "",
              type: "MOVE_IN",
              inspectionDate: new Date().toISOString().split("T")[0],
              inspectorName: "Owner",
              meterReadingElectricity: "",
              meterReadingWater: "",
              overallCondition: "GOOD",
              notes: "",
              mediaUrls: [],
            });
            setShowAddModal(true);
          }}
        >
          <span>➕</span> New Inspection Audit
        </button>
      </div>

      {/* TABS */}
      <div className="card mb-6" style={{ padding: "0.5rem 1rem" }}>
        <div className="flex gap-4">
          <button
            className={`btn btn-sm ${activeTab === "list" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("list")}
          >
            📋 Inspection Records ({inspections.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === "compare" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("compare")}
          >
            📸 Move-In vs Move-Out Photo Comparison
          </button>
        </div>
      </div>

      {activeTab === "list" && (
        <>
          {loading ? (
            <div className="card text-center p-8">Loading inspection history...</div>
          ) : inspections.length === 0 ? (
            <div className="card text-center p-8">
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>No inspections recorded yet.</p>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                Record Move-In Inspection
              </button>
            </div>
          ) : (
            <div className="card table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Property</th>
                    <th>Tenant</th>
                    <th>Audit Date</th>
                    <th>Condition</th>
                    <th>Electricity / Water Mtr</th>
                    <th>Photos</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((ins) => (
                    <tr key={ins.id}>
                      <td>
                        <span
                          className={`badge ${
                            ins.type === "MOVE_IN"
                              ? "badge-success"
                              : ins.type === "MOVE_OUT"
                              ? "badge-warning"
                              : "badge-secondary"
                          }`}
                        >
                          {ins.type === "MOVE_IN" ? "🟢 Move-In" : ins.type === "MOVE_OUT" ? "🟠 Move-Out" : "🔵 Routine"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ins.property?.name || "N/A"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {ins.property?.city}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ins.tenant?.name || "N/A"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {ins.tenant?.phone}
                        </div>
                      </td>
                      <td>{ins.inspectionDate}</td>
                      <td>
                        <span className="badge badge-secondary">{ins.overallCondition}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.75rem" }}>
                          ⚡ {ins.meterReadingElectricity || "—"} kWh | 💧 {ins.meterReadingWater || "—"} kL
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{ins.media?.length || 0} photos</span>
                      </td>
                      <td style={{ maxWidth: "250px", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        {ins.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "compare" && (
        <div>
          <div className="card mb-6">
            <div className="flex items-center gap-4">
              <label style={{ fontWeight: 600, fontSize: "0.875rem" }}>Select Property to Compare:</label>
              <select
                className="form-control"
                style={{ maxWidth: "300px" }}
                value={selectedCompareProp}
                onChange={(e) => setSelectedCompareProp(e.target.value)}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.address})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingCompare ? (
            <div className="card text-center p-8">Loading comparison data...</div>
          ) : comparisonData ? (
            <div className="grid grid-2 gap-6">
              {/* MOVE IN COLUMN */}
              <div className="card">
                <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--success-500)" }}>
                    🟢 Move-In Condition
                  </h3>
                  {comparisonData.moveIn && (
                    <span className="badge badge-success">{comparisonData.moveIn.inspectionDate}</span>
                  )}
                </div>

                {comparisonData.moveIn ? (
                  <div>
                    <div className="grid grid-2 gap-3 mb-4" style={{ fontSize: "0.8125rem" }}>
                      <div>
                        <strong>Condition:</strong> {comparisonData.moveIn.overallCondition}
                      </div>
                      <div>
                        <strong>Inspector:</strong> {comparisonData.moveIn.inspectorName}
                      </div>
                      <div>
                        <strong>⚡ Electricity:</strong> {comparisonData.moveIn.meterReadingElectricity || "—"}
                      </div>
                      <div>
                        <strong>💧 Water:</strong> {comparisonData.moveIn.meterReadingWater || "—"}
                      </div>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <strong>Audit Notes:</strong>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        {comparisonData.moveIn.notes || "No notes logged."}
                      </p>
                    </div>

                    <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Move-In Photos:</div>
                    {comparisonData.moveIn.media && comparisonData.moveIn.media.length > 0 ? (
                      <div className="grid grid-2 gap-3">
                        {comparisonData.moveIn.media.map((m) => (
                          <div key={m.id} style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                            <img
                              src={m.mediaUrl}
                              alt="Move in"
                              style={{ width: "100%", height: "160px", objectFit: "cover" }}
                            />
                            {m.caption && (
                              <div style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", background: "var(--bg-secondary)" }}>
                                {m.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>No move-in photos attached.</p>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", padding: "2rem 0", textAlign: "center" }}>
                    No Move-In inspection record found for this property.
                  </p>
                )}
              </div>

              {/* MOVE OUT COLUMN */}
              <div className="card">
                <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--warning-500)" }}>
                    🟠 Move-Out Condition
                  </h3>
                  {comparisonData.moveOut && (
                    <span className="badge badge-warning">{comparisonData.moveOut.inspectionDate}</span>
                  )}
                </div>

                {comparisonData.moveOut ? (
                  <div>
                    <div className="grid grid-2 gap-3 mb-4" style={{ fontSize: "0.8125rem" }}>
                      <div>
                        <strong>Condition:</strong> {comparisonData.moveOut.overallCondition}
                      </div>
                      <div>
                        <strong>Inspector:</strong> {comparisonData.moveOut.inspectorName}
                      </div>
                      <div>
                        <strong>⚡ Electricity:</strong> {comparisonData.moveOut.meterReadingElectricity || "—"}
                      </div>
                      <div>
                        <strong>💧 Water:</strong> {comparisonData.moveOut.meterReadingWater || "—"}
                      </div>
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <strong>Audit Notes:</strong>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        {comparisonData.moveOut.notes || "No notes logged."}
                      </p>
                    </div>

                    <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Move-Out Photos:</div>
                    {comparisonData.moveOut.media && comparisonData.moveOut.media.length > 0 ? (
                      <div className="grid grid-2 gap-3">
                        {comparisonData.moveOut.media.map((m) => (
                          <div key={m.id} style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                            <img
                              src={m.mediaUrl}
                              alt="Move out"
                              style={{ width: "100%", height: "160px", objectFit: "cover" }}
                            />
                            {m.caption && (
                              <div style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", background: "var(--bg-secondary)" }}>
                                {m.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>No move-out photos attached.</p>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", padding: "2rem 0", textAlign: "center" }}>
                    No Move-Out inspection record found yet for this property.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center p-8">Select a property to view before & after inspection comparison.</div>
          )}
        </div>
      )}

      {/* RECORD INSPECTION MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Property Inspection Audit"
        maxWidth="700px"
      >
        <form onSubmit={handleCreate}>
          <div className="grid grid-2 gap-4">
            <div className="form-group">
              <label className="form-label">Inspection Type *</label>
              <select
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="MOVE_IN">🟢 Move-In Inspection</option>
                <option value="MOVE_OUT">🟠 Move-Out Inspection</option>
                <option value="ROUTINE">🔵 Routine Periodic Check</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Inspection Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Property *</label>
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
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Overall Condition *</label>
              <select
                className="form-control"
                value={formData.overallCondition}
                onChange={(e) => setFormData({ ...formData, overallCondition: e.target.value })}
              >
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="POOR">POOR</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Inspector Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.inspectorName}
                onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Electricity Meter Reading (kWh)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 1420"
                value={formData.meterReadingElectricity}
                onChange={(e) => setFormData({ ...formData, meterReadingElectricity: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Water Meter Reading (kL)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 230"
                value={formData.meterReadingWater}
                onChange={(e) => setFormData({ ...formData, meterReadingWater: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Inspection Notes / Condition Details</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Detailed findings across rooms, walls, fixtures, appliances..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Inspection Photos (Add Proofs)</label>
            <FileUpload
              accept=".jpg,.jpeg,.png,.webp"
              maxSizeMb={10}
              folder="inspections"
              onUploadSuccess={(url) => {
                setFormData((prev) => ({
                  ...prev,
                  mediaUrls: [...(prev.mediaUrls || []), url],
                }));
                showToast("Photo added to inspection audit!", "success");
              }}
              label="Upload inspection photo"
            />
            {formData.mediaUrls?.length > 0 && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--success-500)", fontWeight: 600 }}>
                ✓ {formData.mediaUrls.length} photos staged for this inspection
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Inspection Audit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

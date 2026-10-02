import React, { useState, useEffect } from "react";
import { maintenanceApi, propertyApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import FileUpload from "../components/FileUpload";

export default function Maintenance() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    title: "",
    category: "Plumbing",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    contractorName: "",
    contractorPhone: "",
    status: "COMPLETED",
    description: "",
    billDocumentUrl: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [maintRes, propRes] = await Promise.all([
        maintenanceApi.getAll(),
        propertyApi.getAll(),
      ]);
      setExpenses(maintRes.data.data || []);
      setProperties(propRes.data.data || []);
    } catch (err) {
      showToast(err.message || "Failed to load maintenance records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await maintenanceApi.create({
        ...formData,
        amount: Number(formData.amount),
      });
      showToast("Maintenance expense recorded successfully!", "success");
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to record expense", "error");
    }
  };

  const filteredExpenses = expenses.filter((ex) => {
    if (filterCategory === "all") return true;
    return ex.category === filterCategory;
  });

  const totalExpense = filteredExpenses.reduce((acc, ex) => acc + ex.amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: "700" }}>Maintenance & Expenses</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Track plumbing, electrical, painting, and general property upkeep expenses with bills
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({
              propertyId: properties[0]?.id || "",
              title: "",
              category: "Plumbing",
              amount: "",
              expenseDate: new Date().toISOString().split("T")[0],
              contractorName: "",
              contractorPhone: "",
              status: "COMPLETED",
              description: "",
              billDocumentUrl: "",
            });
            setShowAddModal(true);
          }}
        >
          <span>➕</span> Record Expense
        </button>
      </div>

      <div className="grid grid-3 gap-6 mb-6">
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            TOTAL EXPENSES
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--danger-500)", marginTop: "0.5rem" }}>
            ₹{totalExpense.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            TOTAL JOBS
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "0.5rem" }}>
            {filteredExpenses.length} records
          </div>
        </div>
        <div className="card">
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: "600" }}>
            TOP EXPENSE CATEGORY
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: "700", marginTop: "0.5rem" }}>
            {expenses.length > 0 ? expenses[0].category : "N/A"}
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex gap-2 flex-wrap">
          {["all", "Plumbing", "Electrical", "Painting", "Cleaning", "Repair", "Appliance Repair", "Other"].map(
            (cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${filterCategory === cat ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {loading ? (
        <div className="card text-center p-8">Loading expenses...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="card text-center p-8">
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>No maintenance records found.</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Record First Expense
          </button>
        </div>
      ) : (
        <div className="card table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title / Job</th>
                <th>Property</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Contractor</th>
                <th>Status</th>
                <th>Receipt / Bill</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((ex) => (
                <tr key={ex.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ex.title}</div>
                    {ex.description && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {ex.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ex.property?.name || "N/A"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {ex.property?.city}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-secondary">{ex.category}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--danger-500)" }}>
                    ₹{ex.amount?.toLocaleString()}
                  </td>
                  <td>{ex.expenseDate}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{ex.contractorName || "—"}</div>
                    {ex.contractorPhone && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {ex.contractorPhone}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        ex.status === "COMPLETED"
                          ? "badge-success"
                          : ex.status === "IN_PROGRESS"
                          ? "badge-warning"
                          : "badge-secondary"
                      }`}
                    >
                      {ex.status}
                    </span>
                  </td>
                  <td>
                    {ex.billDocumentUrl ? (
                      <a
                        href={ex.billDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-secondary"
                        style={{ padding: "0.2rem 0.5rem" }}
                      >
                        📄 View Bill
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No bill</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Property Maintenance Expense"
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
                    {p.name} ({p.address})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Painting">Painting</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Repair">General Repair</option>
                <option value="Appliance Repair">Appliance Repair</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Expense Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Master Bedroom Tap replacement"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 1500"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expense Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="COMPLETED">COMPLETED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="REPORTED">REPORTED</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contractor / Technician Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Plumber"
                value={formData.contractorName}
                onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contractor Mobile</label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={formData.contractorPhone}
                onChange={(e) => setFormData({ ...formData, contractorPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Job Notes / Description</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attach Invoice / Bill Scan</label>
            <FileUpload
              accept=".pdf,.jpg,.jpeg,.png"
              maxSizeMb={10}
              folder="bills"
              onUploadSuccess={(url) => setFormData({ ...formData, billDocumentUrl: url })}
              label="Upload receipt or bill scan"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Expense Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

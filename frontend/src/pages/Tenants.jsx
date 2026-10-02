import React, { useState, useEffect } from "react";
import {
  UsersRound,
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  FileText,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  getProperties,
} from "../services/api";
import { Modal } from "../components/Modal";
import { useToast } from "../context/ToastContext";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [viewingTenant, setViewingTenant] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    occupation: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    familyOccupantDetails: "",
    moveInDate: new Date().toISOString().slice(0, 10),
    currentProperty: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, pRes] = await Promise.all([getTenants(), getProperties()]);
      if (tRes.success && Array.isArray(tRes.data)) setTenants(tRes.data);
      if (pRes.success && Array.isArray(pRes.data)) setProperties(pRes.data);
    } catch (err) {
      console.error(err);
      addToast("Failed to load tenants", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      occupation: "",
      address: "",
      emergencyName: "",
      emergencyPhone: "",
      familyOccupantDetails: "",
      moveInDate: new Date().toISOString().slice(0, 10),
      currentProperty: properties.find((p) => p.status === "available")?._id || "",
      notes: "",
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTenant(t);
    setFormData({
      fullName: t.fullName || "",
      email: t.email || "",
      phone: t.phone || "",
      occupation: t.occupation || "",
      address: t.address || "",
      emergencyName: t.emergencyContact?.name || "",
      emergencyPhone: t.emergencyContact?.phone || "",
      familyOccupantDetails: t.familyOccupantDetails || "",
      moveInDate: t.moveInDate ? new Date(t.moveInDate).toISOString().slice(0, 10) : "",
      currentProperty: t.currentProperty || "",
      notes: t.notes || "",
    });
  };

  const handleOpenView = async (t) => {
    try {
      const res = await getTenant(t._id);
      if (res.success && res.data) {
        setViewingTenant(res.data);
      } else {
        setViewingTenant(t);
      }
    } catch {
      setViewingTenant(t);
    }
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      addToast("Full name and email are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        occupation: formData.occupation,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
        },
        familyOccupantDetails: formData.familyOccupantDetails,
        moveInDate: formData.moveInDate,
        currentProperty: formData.currentProperty || null,
        notes: formData.notes,
      };

      if (editingTenant) {
        await updateTenant(editingTenant._id, payload);
        addToast("Tenant updated successfully", "success");
        setEditingTenant(null);
      } else {
        await createTenant(payload);
        addToast("Tenant created and assigned successfully", "success");
        setShowAddModal(false);
      }
      loadData();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to save tenant", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Archive tenant "${name}"? Historical payment records will be preserved.`)) {
      try {
        await deleteTenant(id);
        addToast("Tenant archived and property released", "success");
        loadData();
      } catch (err) {
        addToast(err.message || "Failed to archive tenant", "error");
      }
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesQuery =
      `${t.fullName} ${t.email} ${t.phone} ${t.occupation}`
        .toLowerCase()
        .includes(query.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || t.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesQuery && matchesStatus;
  });

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <UsersRound size={14} /> OCCUPANT DIRECTORY
          </div>
          <h1>Tenant Management</h1>
          <p>Manage tenant profiles, KYC documents, unit assignments, and lease history.</p>
        </div>
        <div className="header-actions">
          <button className="primary-button" onClick={handleOpenAdd} type="button">
            <Plus size={17} strokeWidth={2.4} /> Add tenant
          </button>
        </div>
      </div>

      <section className="property-section">
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              placeholder="Search by tenant name, mobile, email, or occupation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <label className="filter-field">
            <span>Status:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Tenants</option>
              <option value="active">Active Tenants</option>
              <option value="inactive">Past / Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <div className="property-table-wrap">
          <table className="property-table">
            <thead>
              <tr>
                <th>TENANT NAME</th>
                <th>CONTACT INFO</th>
                <th>ASSIGNED PROPERTY</th>
                <th>MOVE-IN DATE</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-results">
                    {loading ? "Loading tenants..." : "No tenants found."}
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div className="property-name-cell">
                        <span className="property-thumb">
                          <UsersRound size={18} />
                        </span>
                        <div>
                          <strong>{t.fullName}</strong>
                          <small>{t.occupation || "Tenant"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px" }}>
                          <Phone size={12} color="#6a7d73" /> {t.phone || "No phone"}
                        </span>
                        <small style={{ color: "#8a9990", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Mail size={11} color="#8a9990" /> {t.email}
                        </small>
                      </div>
                    </td>
                    <td>
                      {t.propertyDetails ? (
                        <div>
                          <strong style={{ fontSize: "11.5px", color: "#1b382e" }}>
                            {t.propertyDetails.name}
                          </strong>
                          <small style={{ display: "block", color: "#8b9c92" }}>
                            {t.propertyDetails.city} · {formatINR(t.propertyDetails.monthlyRent)}/mo
                          </small>
                        </div>
                      ) : (
                        <span style={{ color: "#9ca7a0", fontSize: "11px" }}>— No Unit Assigned —</span>
                      )}
                    </td>
                    <td>
                      {t.moveInDate ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={13} color="#6e8277" />
                          {new Date(t.moveInDate).toLocaleDateString("en-IN")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`status-pill status-${t.status?.toLowerCase()}`}>
                        <i /> {t.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-btn-group" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="action-btn"
                          title="View tenant history"
                          onClick={() => handleOpenView(t)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          title="Edit tenant"
                          onClick={() => handleOpenEdit(t)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          title="Archive tenant"
                          onClick={() => handleDelete(t._id, t.fullName)}
                          style={{ color: "#b91c1c" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Tenant Modal */}
      <Modal
        isOpen={showAddModal || Boolean(editingTenant)}
        onClose={() => {
          setShowAddModal(false);
          setEditingTenant(null);
        }}
        title={editingTenant ? `Edit ${editingTenant.fullName}` : "Add New Tenant"}
        subtitle="Record occupant contact details, family specs, and link to property"
      >
        <form onSubmit={handleSaveTenant} className="app-form">
          <div className="form-row">
            <label>
              Full Name *
              <input
                required
                placeholder="e.g. Vikram Sharma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </label>
            <label>
              Email Address *
              <input
                type="email"
                required
                placeholder="vikram@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Mobile Phone
              <input
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </label>
            <label>
              Occupation / Company
              <input
                placeholder="Software Engineer at Infosys"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Assign Property / Unit
              <select
                value={formData.currentProperty}
                onChange={(e) => setFormData({ ...formData, currentProperty: e.target.value })}
              >
                <option value="">— Select Property —</option>
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.status?.toUpperCase()})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Move-in Date
              <input
                type="date"
                value={formData.moveInDate}
                onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
              />
            </label>
          </div>

          <label>
            Permanent Address
            <input
              placeholder="12 Civil Lines, Jaipur, Rajasthan"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </label>

          <div className="form-row">
            <label>
              Emergency Contact Name
              <input
                placeholder="Pooja Sharma (Spouse)"
                value={formData.emergencyName}
                onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
              />
            </label>
            <label>
              Emergency Contact Phone
              <input
                placeholder="+91 98765 43219"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              />
            </label>
          </div>

          <label>
            Family / Occupant Details
            <input
              placeholder="e.g. Living with spouse and 1 infant child"
              value={formData.familyOccupantDetails}
              onChange={(e) => setFormData({ ...formData, familyOccupantDetails: e.target.value })}
            />
          </label>

          <label>
            Owner Notes
            <textarea
              placeholder="Add personal notes or background verification remarks"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setShowAddModal(false);
                setEditingTenant(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="primary-button">
              {submitting ? "Saving..." : editingTenant ? "Update Tenant" : "Add Tenant"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Tenant Details Modal with History */}
      {viewingTenant && (
        <Modal
          isOpen={Boolean(viewingTenant)}
          onClose={() => setViewingTenant(null)}
          title={viewingTenant.fullName}
          subtitle={`${viewingTenant.occupation || "Tenant"} · Joined ${new Date(viewingTenant.moveInDate || viewingTenant.createdAt).toLocaleDateString("en-IN")}`}
          size="large"
        >
          <div style={{ display: "grid", gap: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ padding: "14px", background: "#fafcfa", borderRadius: "8px", border: "1px solid #edf2ed" }}>
                <strong style={{ fontSize: "12px", color: "#1b3d31", display: "block", marginBottom: "8px" }}>
                  Contact & Identification
                </strong>
                <div style={{ display: "grid", gap: "6px", fontSize: "11.5px", color: "#45594e" }}>
                  <div>Email: <strong>{viewingTenant.email}</strong></div>
                  <div>Phone: <strong>{viewingTenant.phone || "N/A"}</strong></div>
                  <div>Emergency Contact: {viewingTenant.emergencyContact?.name || "N/A"} ({viewingTenant.emergencyContact?.phone || "N/A"})</div>
                  <div>Address: {viewingTenant.address || "N/A"}</div>
                  <div>Occupants: {viewingTenant.familyOccupantDetails || "Single"}</div>
                </div>
              </div>

              <div style={{ padding: "14px", background: "#fafcfa", borderRadius: "8px", border: "1px solid #edf2ed" }}>
                <strong style={{ fontSize: "12px", color: "#1b3d31", display: "block", marginBottom: "8px" }}>
                  Assigned Property
                </strong>
                {viewingTenant.propertyDetails ? (
                  <div style={{ display: "grid", gap: "6px", fontSize: "11.5px", color: "#45594e" }}>
                    <div>Property: <strong>{viewingTenant.propertyDetails.name}</strong></div>
                    <div>Location: {viewingTenant.propertyDetails.address}, {viewingTenant.propertyDetails.city}</div>
                    <div>Rent: {formatINR(viewingTenant.propertyDetails.monthlyRent)}/mo</div>
                    <div>Deposit: {formatINR(viewingTenant.propertyDetails.securityDeposit)}</div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "11.5px", color: "#8a9990" }}>
                    No active property currently assigned to this tenant.
                  </p>
                )}
              </div>
            </div>

            {/* Payment History */}
            {viewingTenant.payments && viewingTenant.payments.length > 0 && (
              <div style={{ padding: "14px", background: "#fafcfa", borderRadius: "8px", border: "1px solid #edf2ed" }}>
                <strong style={{ fontSize: "12px", color: "#1b3d31", display: "block", marginBottom: "8px" }}>
                  Payment History ({viewingTenant.payments.length} payments)
                </strong>
                <div style={{ display: "grid", gap: "6px" }}>
                  {viewingTenant.payments.map((p) => (
                    <div
                      key={p._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        background: "#fff",
                        borderRadius: "5px",
                        border: "1px solid #eef2ee",
                        fontSize: "11.5px",
                      }}
                    >
                      <span>{new Date(p.paymentDate).toLocaleDateString("en-IN")} · {p.paymentMethod?.toUpperCase()}</span>
                      <strong style={{ color: "#166534" }}>{formatINR(p.amount)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KYC Documents */}
            {viewingTenant.documents && viewingTenant.documents.length > 0 && (
              <div style={{ padding: "14px", background: "#fafcfa", borderRadius: "8px", border: "1px solid #edf2ed" }}>
                <strong style={{ fontSize: "12px", color: "#1b3d31", display: "block", marginBottom: "8px" }}>
                  KYC Documents Verified ({viewingTenant.documents.length})
                </strong>
                <div style={{ display: "grid", gap: "6px" }}>
                  {viewingTenant.documents.map((doc) => (
                    <div
                      key={doc._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "#fff",
                        borderRadius: "6px",
                        border: "1px solid #eef2ee",
                        fontSize: "11.5px",
                      }}
                    >
                      <div>
                        <strong>{doc.title || doc.documentType?.toUpperCase()}</strong>
                        <small style={{ color: "#7a8a81", marginLeft: "8px" }}>
                          {doc.documentNumberMasked || "Verified"}
                        </small>
                      </div>
                      <span className="status-pill status-verified"><i /> Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Tenants;


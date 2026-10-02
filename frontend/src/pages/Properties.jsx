import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Home,
  FileText,
  UsersRound,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../services/api";
import { Modal } from "../components/Modal";
import { FileUpload } from "../components/FileUpload";
import { useToast } from "../context/ToastContext";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [viewingProperty, setViewingProperty] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "apartment",
    monthlyRent: "",
    securityDeposit: "",
    maintenanceCharge: "",
    address: "",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    bedrooms: 2,
    bathrooms: 2,
    area: 1000,
    furnishingStatus: "fully-furnished",
    electricityDetails: "",
    waterDetails: "",
    description: "",
    notes: "",
    status: "available",
  });

  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchProps = async () => {
    try {
      setLoading(true);
      const res = await getProperties();
      if (res.success && Array.isArray(res.data)) {
        setProperties(res.data);
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to load properties", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProps();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      type: "apartment",
      monthlyRent: "",
      securityDeposit: "",
      maintenanceCharge: "",
      address: "",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      bedrooms: 2,
      bathrooms: 2,
      area: 1000,
      furnishingStatus: "fully-furnished",
      electricityDetails: "",
      waterDetails: "",
      description: "",
      notes: "",
      status: "available",
    });
    setUploadedPhotos([]);
    setShowAddModal(true);
  };

  const handleOpenEdit = (prop) => {
    setEditingProperty(prop);
    setFormData({
      name: prop.name || "",
      type: prop.type || "apartment",
      monthlyRent: prop.monthlyRent || "",
      securityDeposit: prop.securityDeposit || "",
      maintenanceCharge: prop.maintenanceCharge || "",
      address: prop.address || "",
      city: prop.city || "Mumbai",
      state: prop.state || "Maharashtra",
      pincode: prop.pincode || "",
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      area: prop.area || 0,
      furnishingStatus: prop.furnishingStatus || "unfurnished",
      electricityDetails: prop.electricityDetails || "",
      waterDetails: prop.waterDetails || "",
      description: prop.description || "",
      notes: prop.notes || "",
      status: prop.status || "available",
    });
  };

  const handleOpenView = async (prop) => {
    try {
      const res = await getProperty(prop._id);
      if (res.success && res.data) {
        setViewingProperty(res.data);
      } else {
        setViewingProperty(prop);
      }
    } catch {
      setViewingProperty(prop);
    }
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.monthlyRent || !formData.address) {
      addToast("Please fill in property name, rent, and address", "error");
      return;
    }

    setSubmitting(true);
    try {
      const formPayload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        formPayload.append(k, v);
      });

      if (editingProperty) {
        await updateProperty(editingProperty._id, formPayload);
        addToast("Property updated successfully", "success");
        setEditingProperty(null);
      } else {
        await createProperty(formPayload);
        addToast("Property created successfully", "success");
        setShowAddModal(false);
      }
      fetchProps();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to save property", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to archive "${name}"?`)) {
      try {
        await deleteProperty(id);
        addToast("Property archived successfully", "success");
        fetchProps();
      } catch (err) {
        addToast(err.message || "Failed to archive property", "error");
      }
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesQuery =
      `${p.name} ${p.city} ${p.address} ${p.type}`
        .toLowerCase()
        .includes(query.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesType =
      typeFilter === "all" || p.type?.toLowerCase() === typeFilter.toLowerCase();
    return matchesQuery && matchesStatus && matchesType;
  });

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Building2 size={14} /> PORTFOLIO INVENTORY
          </div>
          <h1>Property Management</h1>
          <p>Manage apartments, flats, villas, commercial shops, and office spaces.</p>
        </div>
        <div className="header-actions">
          <button className="primary-button" onClick={handleOpenAdd} type="button">
            <Plus size={17} strokeWidth={2.4} /> Add property
          </button>
        </div>
      </div>

      <section className="property-section">
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              placeholder="Search properties, cities, or addresses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <label className="filter-field">
              <span>Status:</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="available">Available (Vacant)</option>
                <option value="occupied">Occupied</option>
                <option value="under-maintenance">Under Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
            </label>

            <label className="filter-field">
              <span>Type:</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="flat">Flat</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial Shop</option>
                <option value="office">Office</option>
              </select>
            </label>
          </div>
        </div>

        <div className="property-table-wrap">
          <table className="property-table">
            <thead>
              <tr>
                <th>PROPERTY</th>
                <th>LOCATION</th>
                <th>MONTHLY RENT</th>
                <th>SECURITY DEPOSIT</th>
                <th>STATUS</th>
                <th>ACTIVE TENANT</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-results">
                    {loading ? "Loading properties..." : "No properties match your filter criteria."}
                  </td>
                </tr>
              ) : (
                filteredProperties.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="property-name-cell">
                        <span className="property-thumb">
                          {p.media && p.media.length > 0 ? (
                            <img
                              src={p.media[0].url.startsWith("http") ? p.media[0].url : `http://localhost:4000${p.media[0].url}`}
                              alt={p.name}
                            />
                          ) : (
                            <Building2 size={18} />
                          )}
                        </span>
                        <div>
                          <strong>{p.name}</strong>
                          <small>
                            {p.type?.toUpperCase()} · {p.bedrooms ? `${p.bedrooms} BHK` : `${p.area || 0} sq.ft`}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} color="#718579" />
                        <span>{p.city || "Mumbai"}</span>
                      </div>
                      <small style={{ color: "#95a39a", display: "block", marginTop: "2px" }}>
                        {p.address}
                      </small>
                    </td>
                    <td className="rent-cell">{formatINR(p.monthlyRent)}</td>
                    <td>{formatINR(p.securityDeposit)}</td>
                    <td>
                      <span className={`status-pill status-${p.status?.toLowerCase()}`}>
                        <i /> {p.status}
                      </span>
                    </td>
                    <td>
                      {p.tenantDetails ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <UsersRound size={13} color="#2e6953" />
                          <strong style={{ fontSize: "11px", color: "#1c382f" }}>{p.tenantDetails.fullName}</strong>
                        </div>
                      ) : (
                        <span style={{ color: "#9ca7a0", fontSize: "11px" }}>— Vacant —</span>
                      )}
                    </td>
                    <td>
                      <div className="action-btn-group" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="action-btn"
                          title="View property details"
                          onClick={() => handleOpenView(p)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          title="Edit property"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          title="Archive property"
                          onClick={() => handleDelete(p._id, p.name)}
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

      {/* Add / Edit Property Modal */}
      <Modal
        isOpen={showAddModal || Boolean(editingProperty)}
        onClose={() => {
          setShowAddModal(false);
          setEditingProperty(null);
        }}
        title={editingProperty ? `Edit ${editingProperty.name}` : "Add New Property"}
        subtitle="Specify unit specs, lease rates, utilities, and location"
        size="large"
      >
        <form onSubmit={handleSaveProperty} className="app-form">
          <div className="form-row">
            <label>
              Property Name *
              <input
                required
                placeholder="e.g. Sunrise Apartments (Flat 402)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </label>
            <label>
              Property Type *
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="apartment">Apartment / Flat</option>
                <option value="flat">Independent Floor</option>
                <option value="house">House / Bungalow</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial Retail / Shop</option>
                <option value="office">Commercial Office Space</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          <div className="form-row-3">
            <label>
              Monthly Rent (₹) *
              <input
                type="number"
                required
                min="1"
                placeholder="50000"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
              />
            </label>
            <label>
              Security Deposit (₹)
              <input
                type="number"
                min="0"
                placeholder="100000"
                value={formData.securityDeposit}
                onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
              />
            </label>
            <label>
              Maintenance / Society (₹)
              <input
                type="number"
                min="0"
                placeholder="2500"
                value={formData.maintenanceCharge}
                onChange={(e) => setFormData({ ...formData, maintenanceCharge: e.target.value })}
              />
            </label>
          </div>

          <label>
            Street Address *
            <input
              required
              placeholder="e.g. 123 Hill Road, Bandra West"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </label>

          <div className="form-row-3">
            <label>
              City
              <input
                placeholder="Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </label>
            <label>
              State
              <input
                placeholder="Maharashtra"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </label>
            <label>
              Pincode
              <input
                placeholder="400050"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </label>
          </div>

          <div className="form-row-3">
            <label>
              Bedrooms (BHK)
              <input
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
              />
            </label>
            <label>
              Bathrooms
              <input
                type="number"
                min="0"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
              />
            </label>
            <label>
              Area (Sq. Ft)
              <input
                type="number"
                min="0"
                placeholder="1200"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Furnishing Status
              <select
                value={formData.furnishingStatus}
                onChange={(e) => setFormData({ ...formData, furnishingStatus: e.target.value })}
              >
                <option value="fully-furnished">Fully Furnished</option>
                <option value="semi-furnished">Semi Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </label>
            <label>
              Availability Status
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="available">Available (Vacant)</option>
                <option value="occupied">Occupied</option>
                <option value="under-maintenance">Under Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Electricity Meter Details
              <input
                placeholder="e.g. Meter #MSEB-40291 (Direct billing)"
                value={formData.electricityDetails}
                onChange={(e) => setFormData({ ...formData, electricityDetails: e.target.value })}
              />
            </label>
            <label>
              Water Connection Details
              <input
                placeholder="e.g. 24/7 Municipal & Borewell supply"
                value={formData.waterDetails}
                onChange={(e) => setFormData({ ...formData, waterDetails: e.target.value })}
              />
            </label>
          </div>

          <label>
            Property Description & Features
            <textarea
              placeholder="Describe balcony, parking, amenities, facing direction, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setShowAddModal(false);
                setEditingProperty(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="primary-button">
              {submitting ? "Saving..." : editingProperty ? "Update Property" : "Save Property"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Property Details Modal */}
      {viewingProperty && (
        <Modal
          isOpen={Boolean(viewingProperty)}
          onClose={() => setViewingProperty(null)}
          title={viewingProperty.name}
          subtitle={`${viewingProperty.type?.toUpperCase()} · ${viewingProperty.city || "City"}`}
          size="large"
        >
          <div style={{ display: "grid", gap: "18px" }}>
            {/* Gallery */}
            {viewingProperty.media && viewingProperty.media.length > 0 && (
              <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" }}>
                {viewingProperty.media.map((m, i) => (
                  <img
                    key={i}
                    src={m.url.startsWith("http") ? m.url : `http://localhost:4000${m.url}`}
                    alt="Property"
                    style={{ width: "200px", height: "130px", objectFit: "cover", borderRadius: "6px", border: "1px solid #dce4dc" }}
                  />
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ padding: "14px", background: "#fafcfa", borderRadius: "8px", border: "1px solid #edf2ed" }}>
                <strong style={{ fontSize: "12px", color: "#1b3d31", display: "block", marginBottom: "8px" }}>
                  Financial Details
                </strong>
                <div style={{ display: "grid", gap: "6px", fontSize: "11.5px", color: "#45594e" }}>
                  <div>Monthly Rent: <strong>{formatINR(viewingProperty.monthlyRent)}</strong></div>
                  <div>Security Deposit: <strong>{formatINR(viewingProperty.securityDeposit)}</strong></div>
                  <div>Maintenance Charge: <strong>{formatINR(viewingProperty.maintenanceCharge)}</strong></div>
                  <div>Current Status: <span className={`status-pill status-${viewingProperty.status?.toLowerCase()}`}>{viewingProperty.status}</span></div>
                </div>
              </div>

              <div style={{ padding: "14px", background: "#fafcfa", borderRadius: "8px", border: "1px solid #edf2ed" }}>
                <strong style={{ fontSize: "12px", color: "#1b3d31", display: "block", marginBottom: "8px" }}>
                  Active Tenant Information
                </strong>
                {viewingProperty.tenantDetails ? (
                  <div style={{ display: "grid", gap: "6px", fontSize: "11.5px", color: "#45594e" }}>
                    <div>Tenant Name: <strong>{viewingProperty.tenantDetails.fullName}</strong></div>
                    <div>Phone: {viewingProperty.tenantDetails.phone || "N/A"}</div>
                    <div>Email: {viewingProperty.tenantDetails.email}</div>
                    <div>Move-in Date: {new Date(viewingProperty.tenantDetails.moveInDate).toLocaleDateString("en-IN")}</div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "11.5px", color: "#8a9990" }}>
                    No active tenant currently assigned. This unit is available for new leases.
                  </p>
                )}
              </div>
            </div>

            <div style={{ padding: "14px", background: "#fafcfa", borderRadius: "8px", border: "1px solid #edf2ed" }}>
              <strong style={{ fontSize: "12px", color: "#1b3d31", display: "block", marginBottom: "8px" }}>
                Property Specifications & Utilities
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11.5px", color: "#45594e" }}>
                <div>Address: {viewingProperty.address}, {viewingProperty.city}, {viewingProperty.state} {viewingProperty.pincode}</div>
                <div>Specs: {viewingProperty.bedrooms} Bedrooms · {viewingProperty.bathrooms} Bathrooms · {viewingProperty.area} Sq.Ft</div>
                <div>Furnishing: {viewingProperty.furnishingStatus}</div>
                <div>Electricity: {viewingProperty.electricityDetails || "Standard meter"}</div>
                <div>Water: {viewingProperty.waterDetails || "Standard municipal"}</div>
              </div>
            </div>

            {viewingProperty.description && (
              <div>
                <strong style={{ fontSize: "12px", color: "#1b3d31", display: "block", marginBottom: "4px" }}>
                  Description
                </strong>
                <p style={{ margin: 0, fontSize: "11.5px", color: "#54685e", lineHeight: 1.5 }}>
                  {viewingProperty.description}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Properties;


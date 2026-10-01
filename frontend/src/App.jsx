import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  Clock3,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  MapPin,
  Plus,
  Search,
  Settings,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import "./Rentora.css";

const seedProperties = [
  {
    id: "PR-001",
    name: "Sunrise Apartments",
    type: "Apartment",
    location: "Mumbai, Maharashtra",
    address: "123 Main Street",
    rent: 50000,
    status: "Occupied",
  },
  {
    id: "PR-002",
    name: "Ocean View Villa",
    type: "Villa",
    location: "Goa, Goa",
    address: "456 Beach Road",
    rent: 200000,
    status: "Available",
  },
  {
    id: "PR-003",
    name: "Greenfield Commercial",
    type: "Commercial",
    location: "Bangalore, Karnataka",
    address: "789 Business Avenue",
    rent: 80000,
    status: "Reserved",
  },
];

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Properties", icon: Building2 },
  { label: "Tenants", icon: UsersRound },
  { label: "Agreements", icon: FileText },
  { label: "Rent & payments", icon: Wallet },
  { label: "Inspections", icon: ClipboardList },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function App() {
  const [properties, setProperties] = useState(seedProperties);
  const [activePage, setActivePage] = useState("Overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [formError, setFormError] = useState("");

  const occupiedCount = properties.filter((property) => property.status === "Occupied").length;
  const availableCount = properties.filter((property) => property.status === "Available").length;
  const monthlyRent = properties.reduce((total, property) => total + property.rent, 0);
  const filteredProperties = properties.filter((property) => {
    const matchesQuery = `${property.name} ${property.location} ${property.address}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All statuses" || property.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const pageTitle = activePage === "Overview" ? "Portfolio overview" : activePage;

  function addProperty(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rent = Number(formData.get("rent"));

    if (!rent || rent < 0) {
      setFormError("Enter a monthly rent greater than zero.");
      return;
    }

    setProperties((current) => [
      {
        id: `PR-${String(current.length + 1).padStart(3, "0")}`,
        name: String(formData.get("name")).trim(),
        type: String(formData.get("type")),
        location: String(formData.get("city")).trim(),
        address: String(formData.get("address")).trim(),
        rent,
        status: "Available",
      },
      ...current,
    ]);
    setShowPropertyForm(false);
    setFormError("");
    event.currentTarget.reset();
  }

  return (
    <div className="rentora-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActivePage("Overview")}>
          <span className="brand-mark"><Home size={19} strokeWidth={2.4} /></span>
          <span>rentora<span className="brand-period">.</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              className={`nav-link${activePage === label ? " is-active" : ""}`}
              key={label}
              onClick={() => setActivePage(label)}
              type="button"
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Properties" && <span className="nav-count">{properties.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-link" type="button" onClick={() => setActivePage("Help & support")}>
            <CircleHelp size={18} strokeWidth={1.8} /><span>Help & support</span>
          </button>
          <button className="nav-link" type="button" onClick={() => setActivePage("Settings")}>
            <Settings size={18} strokeWidth={1.8} /><span>Settings</span>
          </button>
          <div className="account-chip">
            <span className="account-avatar">R</span>
            <span className="account-copy"><strong>Demo workspace</strong><small>Preview mode</small></span>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <span className="preview-tag"><span /> DEMO DATA</span>
            <button className="icon-button help-button" aria-label="Help" title="Help" type="button" onClick={() => setActivePage("Help & support")}>
              <CircleHelp size={19} />
            </button>
            <button className="icon-button notification-button" aria-label="Notifications" title="Notifications" type="button">
              <Bell size={19} /><i />
            </button>
            <span className="top-avatar">RK</span>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><CalendarDays size={14} /> THURSDAY, OCTOBER 1, 2026</div>
              <h1>{pageTitle}</h1>
              <p>{activePage === "Overview" ? "A clear view of your rental portfolio." : `Manage your ${activePage.toLowerCase()} in one place.`}</p>
            </div>
            <button className="primary-button" onClick={() => { setFormError(""); setShowPropertyForm(true); }} type="button">
              <Plus size={18} strokeWidth={2.2} /> Add property
            </button>
          </div>

          <div className="preview-notice">
            <span className="notice-indicator" />
            <span><strong>Preview workspace</strong> Sample properties are from the local seed script. Changes here stay in this browser session.</span>
            <button type="button" aria-label="Dismiss preview notice" onClick={(event) => event.currentTarget.parentElement.remove()}><X size={16} /></button>
          </div>

          {activePage === "Overview" && (
            <section className="metrics-grid" aria-label="Portfolio summary">
              <article className="metric-card metric-green">
                <div className="metric-top"><span className="metric-icon"><Building2 size={18} /></span><span className="metric-trend"><ArrowUpRight size={14} /> 12%</span></div>
                <p>Total properties</p><strong>{String(properties.length).padStart(2, "0")}</strong><small>Across your portfolio</small>
              </article>
              <article className="metric-card">
                <div className="metric-top"><span className="metric-icon metric-icon-coral"><UsersRound size={18} /></span><span className="metric-trend trend-muted"><ArrowDownRight size={14} /> 4%</span></div>
                <p>Occupied units</p><strong>{String(occupiedCount).padStart(2, "0")}</strong><small>Of {properties.length} listed properties</small>
              </article>
              <article className="metric-card">
                <div className="metric-top"><span className="metric-icon metric-icon-blue"><CreditCard size={18} /></span><span className="metric-period">PER MONTH</span></div>
                <p>Potential rent</p><strong className="metric-currency">{formatCurrency(monthlyRent)}</strong><small>At current listed rates</small>
              </article>
              <article className="metric-card">
                <div className="metric-top"><span className="metric-icon metric-icon-yellow"><Home size={18} /></span><span className="metric-period">READY TO LIST</span></div>
                <p>Available properties</p><strong>{String(availableCount).padStart(2, "0")}</strong><small>Open for new tenants</small>
              </article>
            </section>
          )}

          {navigation.some((item) => item.label === activePage) && activePage !== "Overview" && activePage !== "Properties" ? (
            <section className="module-empty">
              <span className="module-icon"><ClipboardList size={23} /></span>
              <h2>{activePage}</h2>
              <p>This preview currently includes the property portfolio. Connect a workspace to manage {activePage.toLowerCase()}.</p>
              <button type="button" className="text-button" onClick={() => setActivePage("Properties")}>View properties <ArrowUpRight size={15} /></button>
            </section>
          ) : activePage === "Help & support" || activePage === "Settings" ? (
            <section className="module-empty">
              <span className="module-icon"><Settings size={23} /></span>
              <h2>{activePage}</h2>
              <p>Workspace preferences will be available when a live account is connected.</p>
              <button type="button" className="text-button" onClick={() => setActivePage("Overview")}>Back to overview <ArrowUpRight size={15} /></button>
            </section>
          ) : (
            <section className="property-section">
              <div className="section-heading">
                <div>
                  <div className="section-kicker">YOUR PORTFOLIO</div>
                  <h2>{activePage === "Properties" ? "All properties" : "Recent properties"}</h2>
                </div>
                <button className="view-all-button" type="button" onClick={() => setActivePage("Properties")}>
                  {activePage === "Properties" ? "Showing all" : "View all properties"} <ArrowUpRight size={15} />
                </button>
              </div>

              <div className="table-toolbar">
                <label className="search-field">
                  <Search size={17} />
                  <input aria-label="Search properties" placeholder="Search properties or locations" value={query} onChange={(event) => setQuery(event.target.value)} />
                  <kbd>⌘ K</kbd>
                </label>
                <label className="filter-field"><span><Settings size={15} /> Filter</span>
                  <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option>All statuses</option><option>Occupied</option><option>Available</option><option>Reserved</option>
                  </select>
                </label>
              </div>

              <div className="property-table-wrap">
                <table className="property-table">
                  <thead><tr><th>PROPERTY</th><th>LOCATION</th><th>MONTHLY RENT</th><th>STATUS</th><th aria-label="Actions" /></tr></thead>
                  <tbody>
                    {filteredProperties.map((property) => (
                      <tr key={property.id}>
                        <td><div className="property-name-cell"><span className="property-thumb"><Building2 size={19} /></span><span><strong>{property.name}</strong><small>{property.type} · {property.id}</small></span></div></td>
                        <td><span className="location-cell"><MapPin size={14} /> {property.location}</span><small className="address-line">{property.address}</small></td>
                        <td className="rent-cell">{formatCurrency(property.rent)}<small>/ month</small></td>
                        <td><span className={`status-pill status-${property.status.toLowerCase()}`}><i />{property.status}</span></td>
                        <td><button className="row-menu" type="button" aria-label={`More actions for ${property.name}`}><span>•••</span></button></td>
                      </tr>
                    ))}
                    {filteredProperties.length === 0 && <tr><td colSpan="5" className="no-results">No properties match those filters.</td></tr>}
                  </tbody>
                </table>
              </div>
              <footer className="table-footer"><span>Showing <strong>{filteredProperties.length}</strong> of {properties.length} preview properties</span><span>Updated just now</span></footer>
            </section>
          )}

          {activePage === "Overview" && (
            <section className="lower-grid">
              <article className="occupancy-panel">
                <div className="section-heading compact-heading"><div><div className="section-kicker">PORTFOLIO HEALTH</div><h2>Occupancy snapshot</h2></div><button className="subtle-icon-button" title="Occupancy details" aria-label="Occupancy details" type="button"><ArrowUpRight size={17} /></button></div>
                <div className="occupancy-content"><div className="donut-chart" style={{ "--occupancy": `${properties.length ? (occupiedCount / properties.length) * 100 : 0}%` }}><div><strong>{properties.length ? Math.round((occupiedCount / properties.length) * 100) : 0}%</strong><span>occupied</span></div></div><div className="occupancy-legend"><div><i className="legend-occupied" /><span>Occupied</span><strong>{occupiedCount}</strong></div><div><i className="legend-available" /><span>Available</span><strong>{availableCount}</strong></div><div><i className="legend-reserved" /><span>Reserved</span><strong>{properties.filter((property) => property.status === "Reserved").length}</strong></div></div></div>
              </article>
              <article className="activity-panel">
                <div className="section-heading compact-heading"><div><div className="section-kicker">NEXT STEP</div><h2>Keep your portfolio current</h2></div><span className="activity-icon"><Clock3 size={18} /></span></div>
                <p className="activity-copy">Add a property to see it in your portfolio and update the monthly rent summary.</p>
                <button className="text-button" type="button" onClick={() => { setFormError(""); setShowPropertyForm(true); }}>Add a property <ArrowUpRight size={15} /></button>
              </article>
            </section>
          )}

          <footer className="page-footer"><span>RENTORA PROPERTY MANAGEMENT</span><span>Preview environment <i /></span></footer>
        </div>
      </main>

      {showPropertyForm && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPropertyForm(false); }}>
          <section className="property-modal" role="dialog" aria-modal="true" aria-labelledby="property-modal-title">
            <div className="modal-heading"><div><span className="section-kicker">NEW LISTING</span><h2 id="property-modal-title">Add a property</h2></div><button className="icon-button" onClick={() => setShowPropertyForm(false)} aria-label="Close" type="button"><X size={19} /></button></div>
            <p className="modal-note">Preview only. This property stays in the current browser session.</p>
            <form onSubmit={addProperty} className="property-form">
              <label>Property name<input name="name" required maxLength="100" placeholder="e.g. Palm Grove Residence" /></label>
              <div className="form-row"><label>Property type<select name="type"><option>Apartment</option><option>Flat</option><option>House</option><option>Villa</option><option>Commercial</option><option>Office</option></select></label><label>Monthly rent<input name="rent" type="number" min="1" required placeholder="50000" /></label></div>
              <label>Address<input name="address" required placeholder="Street address" /></label>
              <label>City and state<input name="city" required placeholder="Mumbai, Maharashtra" /></label>
              {formError && <p className="form-error">{formError}</p>}
              <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowPropertyForm(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={17} /> Add to preview</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;

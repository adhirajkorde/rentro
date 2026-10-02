import React from "react";
import {
  LayoutDashboard,
  Building2,
  UsersRound,
  FileText,
  Wallet,
  ShieldCheck,
  Wrench,
  Zap,
  ClipboardCheck,
  FolderOpen,
  BarChart3,
  User,
  LogOut,
  Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const navigationItems = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "tenants", label: "Tenants", icon: UsersRound },
  { id: "agreements", label: "Rental Agreements", icon: FileText },
  { id: "rent", label: "Rent & Payments", icon: Wallet },
  { id: "deposits", label: "Security Deposits", icon: ShieldCheck },
  { id: "maintenance", label: "Maintenance & Expenses", icon: Wrench },
  { id: "utilities", label: "Electricity & Water", icon: Zap },
  { id: "inspections", label: "Inspections & Damages", icon: ClipboardCheck },
  { id: "documents", label: "KYC & Documents", icon: FolderOpen },
  { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
];

export const Sidebar = ({ activePage, onNavigate, propertiesCount = 0 }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return "OW";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleNav = (id) => {
    if (onNavigate) onNavigate(id);
  };

  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="#dashboard"
        onClick={(e) => {
          e.preventDefault();
          handleNav("dashboard");
        }}
      >
        <span className="brand-mark">
          <Home size={19} strokeWidth={2.4} />
        </span>
        <span>
          rentora<span className="brand-period">.</span>
        </span>
      </a>

      <div className="workspace-label">OWNER DASHBOARD</div>

      <nav className="primary-nav" aria-label="Main navigation">
        {navigationItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-link${activePage.toLowerCase() === id.toLowerCase() ? " is-active" : ""}`}
            onClick={() => handleNav(id)}
            type="button"
          >
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
            {id === "properties" && propertiesCount > 0 && (
              <span className="nav-count">{propertiesCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-link${activePage.toLowerCase() === "profile" ? " is-active" : ""}`}
          type="button"
          onClick={() => handleNav("profile")}
        >
          <User size={17} strokeWidth={1.8} />
          <span>Owner Profile</span>
        </button>
        <button className="nav-link" type="button" onClick={logout} style={{ color: "#f87171" }}>
          <LogOut size={17} strokeWidth={1.8} />
          <span>Sign out</span>
        </button>

        <div className="account-chip">
          <span className="account-avatar">{getInitials(user?.name || user?.fullName)}</span>
          <div className="account-copy">
            <strong>{user?.name || user?.fullName || "Property Owner"}</strong>
            <small>{user?.email || "owner@rentora.com"}</small>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

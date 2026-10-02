import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

// Pages
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import Agreements from "./pages/Agreements";
import Rent from "./pages/Rent";
import SecurityDeposits from "./pages/SecurityDeposits";
import Maintenance from "./pages/Maintenance";
import Utilities from "./pages/Utilities";
import Inspections from "./pages/Inspections";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";

import "./Rentora.css";

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "2rem" }}>🏢</div>
        <div style={{ fontWeight: 600 }}>Loading Rentora Owner System...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onNavigate={setActivePage} />;
      case "properties":
        return <Properties />;
      case "tenants":
        return <Tenants />;
      case "agreements":
        return <Agreements />;
      case "rent":
        return <Rent />;
      case "deposits":
        return <SecurityDeposits />;
      case "inspections":
        return <Inspections />;
      case "documents":
        return <Documents />;
      case "maintenance":
        return <Maintenance />;
      case "utilities":
        return <Utilities />;
      case "reports":
        return <Reports />;
      case "profile":
        return <Profile />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="rentora-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-area">
        <Navbar activePage={activePage} onNavigate={setActivePage} />
        <div className="page-content">{renderPage()}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

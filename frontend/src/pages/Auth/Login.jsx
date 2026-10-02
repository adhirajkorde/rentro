import React, { useState } from "react";
import { Home, Lock, Mail, User, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const Login = () => {
  const { login, register } = useAuth();
  const { addToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          addToast("Full name is required", "error");
          setLoading(false);
          return;
        }
        await register(fullName, email, password);
        addToast("Welcome! Owner account created successfully.", "success");
      } else {
        await login(email, password);
        addToast("Logged in successfully.", "success");
      }
    } catch (err) {
      console.error("Auth error:", err);
      addToast(err.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("owner@rentora.com");
    setPassword("password123");
    setLoading(true);
    try {
      await login("owner@rentora.com", "password123");
      addToast("Logged in as Demo Property Owner.", "success");
    } catch (err) {
      addToast(err.message || "Demo login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "#f5f8f5",
      }}
      className="login-container-responsive"
    >
      {/* Left Hero Panel */}
      <div
        style={{
          background: "#13332c",
          color: "#e7f0eb",
          padding: "50px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div className="brand" style={{ padding: 0, border: "none" }}>
            <span className="brand-mark">
              <Home size={22} strokeWidth={2.4} />
            </span>
            <span>
              rentora<span className="brand-period">.</span>
            </span>
          </div>

          <div style={{ marginTop: "70px", maxWidth: "440px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "20px",
                background: "#1e4d41",
                color: "#c9eb8e",
                fontSize: "11px",
                fontWeight: "700",
                marginBottom: "20px",
              }}
            >
              <Shield size={14} />
              EXCLUSIVELY FOR PROPERTY OWNERS
            </div>
            <h1
              style={{
                font: "800 32px Manrope, sans-serif",
                color: "#ffffff",
                lineHeight: 1.25,
                marginBottom: "16px",
              }}
            >
              Complete Rental Lifecycle Management
            </h1>
            <p style={{ color: "#9bbdb3", fontSize: "14px", lineHeight: 1.6 }}>
              From tenant onboarding and KYC verification to monthly rent schedules, automated receipts,
              photo condition inspections, and final security deposit settlements.
            </p>

            <div style={{ marginTop: "36px", display: "grid", gap: "14px" }}>
              {[
                "100% Owner-centric workflow (No tenant logins required)",
                "Automated PDF Rental Agreements & Payment Receipts",
                "Move-In vs Move-Out Photo Comparison & Damage Deductions",
                "Real-time Occupancy & Rental Financial Analytics",
              ].map((feat, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <CheckCircle2 size={18} color="#bfe5b8" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: "11px", color: "#6a8d83", borderTop: "1px solid #1e453c", paddingTop: "18px" }}>
          (c) 2026 Rentora Systems. High security property owner portal.
        </div>
      </div>

      {/* Right Login Form */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            background: "#ffffff",
            padding: "36px 32px",
            borderRadius: "12px",
            border: "1px solid #e3eae2",
            boxShadow: "0 10px 30px rgba(18, 45, 36, 0.05)",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ font: "700 22px Manrope, sans-serif", color: "#16332a", margin: "0 0 6px" }}>
              {isRegister ? "Create Owner Account" : "Sign in to Workspace"}
            </h2>
            <p style={{ color: "#788a80", fontSize: "12.5px", margin: 0 }}>
              {isRegister
                ? "Register to start managing your rental properties."
                : "Enter your owner credentials to continue."}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            {isRegister && (
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#45594e", marginBottom: "6px" }}>
                  Full Name
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <User size={16} style={{ position: "absolute", left: "12px", color: "#8b9c92" }} />
                  <input
                    type="text"
                    required
                    placeholder="Adhiraj Korde"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      paddingLeft: "36px",
                      paddingRight: "12px",
                      border: "1px solid #dbe4dc",
                      borderRadius: "6px",
                      outline: "none",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#45594e", marginBottom: "6px" }}>
                Email Address
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Mail size={16} style={{ position: "absolute", left: "12px", color: "#8b9c92" }} />
                <input
                  type="email"
                  required
                  placeholder="owner@rentora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    paddingLeft: "36px",
                    paddingRight: "12px",
                    border: "1px solid #dbe4dc",
                    borderRadius: "6px",
                    outline: "none",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#45594e", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock size={16} style={{ position: "absolute", left: "12px", color: "#8b9c92" }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    paddingLeft: "36px",
                    paddingRight: "12px",
                    border: "1px solid #dbe4dc",
                    borderRadius: "6px",
                    outline: "none",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button"
              style={{ width: "100%", height: "42px", fontSize: "13px", marginTop: "4px" }}
            >
              {loading ? "Please wait..." : isRegister ? "Register as Owner" : "Sign in to Dashboard"}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Demo Button */}
          <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: "1px solid #edf2ed" }}>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="secondary-button"
              style={{ width: "100%", height: "38px", fontSize: "12px" }}
            >
              ⚡ Quick 1-Click Demo Owner Sign-in
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: "18px" }}>
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              style={{
                background: "transparent",
                border: "none",
                color: "#2e6953",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {isRegister ? "Already have an account? Sign in" : "New owner? Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


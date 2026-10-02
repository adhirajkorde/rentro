import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../services/api";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    companyName: user?.companyName || "",
    address: user?.address || "",
    bankAccountName: user?.bankAccountName || "",
    bankAccountNumber: user?.bankAccountNumber || "",
    bankIfscCode: user?.bankIfscCode || "",
    upiId: user?.upiId || "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await authApi.updateProfile(profileData);
      updateUser(res.data.data);
      showToast("Profile details updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast("New passwords do not match!", "error");
      return;
    }

    try {
      setSavingPassword(true);
      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      showToast("Password changed successfully!", "success");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(err.message || "Failed to change password", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 style={{ fontSize: "1.375rem", fontWeight: "700" }}>Account & Owner Settings</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Manage your personal details, banking/UPI settings for receipts, and security
        </p>
      </div>

      <div className="grid grid-2 gap-8">
        {/* OWNER PROFILE */}
        <div className="card">
          <h3 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1.25rem" }}>
            Owner Profile Information
          </h3>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-control"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Company / Real Estate Firm Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Apex Living Properties"
                value={profileData.companyName}
                onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Office / Billing Address</label>
              <textarea
                className="form-control"
                rows="2"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              />
            </div>

            <h4 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              Banking & Receipt Details
            </h4>

            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">Bank Account Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Adhiraj Korde"
                  value={profileData.bankAccountName}
                  onChange={(e) => setProfileData({ ...profileData, bankAccountName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bank Account Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 501002381928"
                  value={profileData.bankAccountNumber}
                  onChange={(e) => setProfileData({ ...profileData, bankAccountNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. HDFC0001234"
                  value={profileData.bankIfscCode}
                  onChange={(e) => setProfileData({ ...profileData, bankIfscCode: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">UPI ID for Rent Collection</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. adhiraj@okaxis"
                  value={profileData.upiId}
                  onChange={(e) => setProfileData({ ...profileData, upiId: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={savingProfile}>
              {savingProfile ? "Saving Profile..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* SECURITY & PASSWORD */}
        <div className="card" style={{ height: "fit-content" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "1.25rem" }}>
            Change Owner Password
          </h3>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input
                type="password"
                className="form-control"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                className="form-control"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-control"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-secondary mt-4" disabled={savingPassword}>
              {savingPassword ? "Updating Password..." : "Update Security Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../services/api";

export const Navbar = ({ activePage, onNavigate }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotes = async () => {
    try {
      const res = await notificationApi.getAll();
      if (res.data && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      // Ignore background poll errors silently
    }
  };

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getInitials = (name) => {
    if (!name) return "OW";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) handleMarkRead(n.id);
    if (n.actionUrl && onNavigate) {
      const pageKey = n.actionUrl.replace("/", "").toLowerCase();
      onNavigate(pageKey || "dashboard");
      setShowNotifications(false);
    }
  };

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Owner Portal</span>
        <span className="breadcrumb-divider">/</span>
        <strong style={{ textTransform: "capitalize" }}>{activePage}</strong>
      </div>

      <div className="topbar-actions" ref={dropdownRef}>
        <span className="owner-badge">
          <span />
          OWNER SYSTEM
        </span>

        {/* Notifications Button */}
        <button
          className="icon-button notification-button"
          aria-label="Notifications"
          title="Notifications"
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="notification-badge-dot" />}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="notifications-dropdown">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "8px",
                borderBottom: "1px solid var(--border-color)",
                marginBottom: "8px",
              }}
            >
              <strong style={{ fontSize: "13px" }}>Reminders & Notifications</strong>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--primary-600)",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", margin: "16px 0" }}>
                No active notifications
              </p>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.isRead ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>{n.title}</span>
                    <small style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                    </small>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{n.message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile Avatar Click */}
        <div
          onClick={() => onNavigate && onNavigate("profile")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          title="View Owner Profile"
        >
          <span className="top-avatar">{getInitials(user?.name || user?.fullName)}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

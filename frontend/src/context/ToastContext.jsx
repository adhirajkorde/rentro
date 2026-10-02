import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, showToast: addToast, removeToast }}>
      {children}
      <div
        className="toast-container"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "380px",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-${toast.type}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              background:
                toast.type === "error"
                  ? "#fee2e2"
                  : toast.type === "warning"
                  ? "#fef3c7"
                  : toast.type === "info"
                  ? "#e0f2fe"
                  : "#ecfdf5",
              border: `1px solid ${
                toast.type === "error"
                  ? "#fca5a5"
                  : toast.type === "warning"
                  ? "#fcd34d"
                  : toast.type === "info"
                  ? "#7dd3fc"
                  : "#6ee7b7"
              }`,
              color:
                toast.type === "error"
                  ? "#991b1b"
                  : toast.type === "warning"
                  ? "#92400e"
                  : toast.type === "info"
                  ? "#075985"
                  : "#065f46",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            {toast.type === "success" && <CheckCircle2 size={18} color="#059669" />}
            {toast.type === "error" && <XCircle size={18} color="#dc2626" />}
            {toast.type === "warning" && <AlertTriangle size={18} color="#d97706" />}
            {toast.type === "info" && <Info size={18} color="#0284c7" />}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                color: "inherit",
                opacity: 0.7,
              }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { addToast: console.log, showToast: console.log, removeToast: () => {} };
  }
  return context;
};

export default ToastProvider;

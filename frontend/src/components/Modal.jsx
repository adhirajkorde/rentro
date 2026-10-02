import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "medium",
  maxWidth,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`app-modal ${size === "large" ? "app-modal-large" : ""}`}
        role="dialog"
        aria-modal="true"
        style={maxWidth ? { maxWidth } : {}}
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <small style={{ color: "#7a8a81", fontSize: "11px" }}>{subtitle}</small>}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

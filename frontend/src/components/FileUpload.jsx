import React, { useState, useRef } from "react";
import { UploadCloud, File, Film, X } from "lucide-react";
import { uploadFile } from "../services/api";
import { useToast } from "../context/ToastContext";

export const FileUpload = ({
  onFileUploaded,
  onUploadSuccess,
  accept = "image/*,video/*,application/pdf,.pdf,.jpg,.jpeg,.png,.webp,.mp4",
  label = "Upload file (Image, PDF, Video)",
  initialUrl = "",
  helperText = "Supported formats: PNG, JPG, WebP, PDF, MP4 (Max 25MB)",
  maxSizeMb = 25,
}) => {
  const [fileUrl, setFileUrl] = useState(initialUrl);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const { addToast } = useToast();

  const handleUpload = async (file) => {
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      addToast(`File exceeds ${maxSizeMb}MB limit`, "error");
      return;
    }

    try {
      setUploading(true);
      const res = await uploadFile(file);
      if (res.data?.url) {
        setFileUrl(res.data.url);
        setFileName(file.name);
        if (onUploadSuccess) onUploadSuccess(res.data.url, file.name);
        if (onFileUploaded) onFileUploaded(res.data.url, file.name, res.data);
        addToast("File uploaded successfully", "success");
      }
    } catch (err) {
      console.error("Upload error:", err);
      addToast(err.message || "Failed to upload file", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFileUrl("");
    setFileName("");
    if (onUploadSuccess) onUploadSuccess("", "");
    if (onFileUploaded) onFileUploaded("", "", null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isImage = fileUrl.match(/\.(jpeg|jpg|png|webp|gif)$/i) || fileUrl.includes("photo") || fileUrl.includes("image");
  const isVideo = fileUrl.match(/\.(mp4|mov|webm)$/i) || fileUrl.includes("video");

  return (
    <div style={{ display: "grid", gap: "6px" }}>
      {label && <label style={{ fontSize: "11px", fontWeight: "600", color: "#4b5c53" }}>{label}</label>}

      {fileUrl ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            border: "1px solid #d1e2d4",
            background: "#f4faf5",
            borderRadius: "7px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            {isImage ? (
              <img
                src={fileUrl.startsWith("http") ? fileUrl : `http://localhost:4000${fileUrl}`}
                alt="Uploaded preview"
                style={{ width: "38px", height: "38px", borderRadius: "5px", objectFit: "cover", border: "1px solid #cce0d0" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : isVideo ? (
              <Film size={24} color="#3b82f6" />
            ) : (
              <File size={24} color="#059669" />
            )}
            <div style={{ display: "grid", gap: "2px", minWidth: 0 }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#234a3b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {fileName || "File Uploaded"}
              </span>
              <a
                href={fileUrl.startsWith("http") ? fileUrl : `http://localhost:4000${fileUrl}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "10.5px", color: "#2e6953", textDecoration: "underline" }}
              >
                Preview / Open
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              display: "grid",
              placeItems: "center",
              width: "26px",
              height: "26px",
              borderRadius: "4px",
              border: "1px solid #fca5a5",
              background: "#fee2e2",
              color: "#991b1b",
              cursor: "pointer",
            }}
            title="Remove file"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className="file-dropzone"
          style={{
            borderColor: dragOver ? "#2e6953" : "#cbd8cd",
            background: dragOver ? "#eef6f0" : "#f9fbf9",
            opacity: uploading ? 0.6 : 1,
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUpload(e.target.files[0]);
              }
            }}
          />
          <UploadCloud size={24} className="file-dropzone-icon" />
          <p>{uploading ? "Uploading file..." : "Click or drag & drop to upload"}</p>
          <small>{helperText}</small>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

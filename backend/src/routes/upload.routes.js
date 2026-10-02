import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../utils/multer.config.js";

const router = express.Router();

router.post("/", protect, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: {
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
});

router.post("/multiple", protect, upload.array("files", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "No files uploaded" });
  }

  const filesData = req.files.map((file) => ({
    url: `/uploads/${file.filename}`,
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  }));

  res.status(200).json({
    success: true,
    message: "Files uploaded successfully",
    data: filesData,
  });
});

export default router;

import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure root uploads directory exists
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, `${uniqueSuffix}_${sanitized}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, videos
  const allowedExts = /\.(jpeg|jpg|png|webp|gif|pdf|mp4|mov|avi|webm)$/i;
  const isExtValid = allowedExts.test(file.originalname);
  const isMimeValid =
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype === "application/pdf";

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error("Only images (PNG, JPG, WebP, GIF), PDFs, and videos (MP4, WebM) are allowed"), false);
  }
};

// Limit file size to 25MB
const limits = {
  fileSize: 25 * 1024 * 1024,
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

export default upload;
import multer from "multer";
import path from "path";
import fs from "fs";
import { ResponseError } from "../errors/response-error.js";

const uploadDir = "uploads/profile";

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // uploads directory
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Create directory if not exists
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter to allow only JPG & PNG
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ResponseError(400, "Format image tidak sesuai"));
  }
};

// Multer instance
export const createUploadMiddleware = (fieldName) => {
  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
  }).single(fieldName); // Use the passed field name

  // Middleware to catch Multer errors
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ResponseError(400, "Ukuran file terlalu besar"));
        }
      } else if (err) {
        return next(new ResponseError(400, err.message));
      }
      next();
    });
  };
};

import multer from "multer";
import { config } from "../configs/env.js";
import { BadRequestError } from "../errors/index.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.receipt.maxUploadBytes,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new BadRequestError({
          message: "Invalid file type. Only JPEG, PNG, WebP images, and PDF files are accepted.",
        }),
      );
    }
    cb(null, true);
  },
}).single("receipt");

/**
 * Express middleware that wraps multer's `single("receipt")` and converts
 * multer errors into the app's standard error shape.
 */
export function handleReceiptUpload(req, res, next) {
  receiptUpload(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new BadRequestError({
          message: `File too large. Maximum allowed size is ${config.receipt.maxUploadBytes / 1024 / 1024} MB.`,
        }),
      );
    }

    next(err);
  });
}

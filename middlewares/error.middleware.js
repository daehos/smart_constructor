import { BaseError } from "../errors/index.js";

export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err instanceof BaseError) {
    const statusCode =
      Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode <= 599
        ? err.statusCode
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

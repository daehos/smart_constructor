import { UnauthorizedError } from "../errors/index.js";
import { verifyToken } from "../utils/jwt.util.js";

/**
 * Requires a valid JWT in `Authorization: Bearer <token>`.
 * On success, sets `req.user` to the decoded payload (e.g. `{ id, iat, exp }`).
 */
export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new UnauthorizedError({
        message: "Authorization header missing or invalid",
      }),
    );
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return next(
      new UnauthorizedError({
        message: "Token missing",
      }),
    );
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return next(
        new UnauthorizedError({
          message: "Token expired",
        }),
      );
    }
    if (err?.name === "JsonWebTokenError") {
      return next(
        new UnauthorizedError({
          message: "Invalid token",
          details: err.message,
        }),
      );
    }
    return next(err);
  }
}

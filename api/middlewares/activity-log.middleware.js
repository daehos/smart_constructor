/**
 * Attaches `req.activityCtx = { ip, userAgent }` for downstream services.
 * Must be mounted before authenticateJWT and route handlers.
 */
export function attachActivityCtx(req, _res, next) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded
    ? String(forwarded).split(",")[0].trim()
    : req.socket?.remoteAddress ?? null;

  req.activityCtx = {
    ip,
    userAgent: req.headers["user-agent"] ?? null,
  };
  next();
}

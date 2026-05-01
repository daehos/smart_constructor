export function errorHandler(err, _req, res, _next) {
  switch (err.name) {
    case "ValidationError": // Mongoose validation error
      res.status(400).json({ message: err.errors?.[0].message || err.message });
      break;
    case "BadRequest":
      res.status(400).json({ message: err.message });
      break;
    case "Unauthorized":
      res.status(401).json({ message: err.message });
      break;
    case "JsonWebTokenError":
      res.status(401).json({ message: "Invalid token" });
      break;
    case "Forbidden":
      res.status(403).json({ message: err.message });
      break;
    case "NotFound":
      res.status(404).json({ message: err.message });
      break;
    default:
      console.error(err, "<<<ISELOG");
      res.status(500).json({ message: "Internal server error" });
      break;
  }
}

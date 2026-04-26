const express = require("express");

const app = express();

app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const host = process.env.HOST ?? "0.0.0.0";

app.listen(port, host, () => {
  // Keep log simple and helpful for local dev
  console.log(`Server listening on http://${host}:${port}`);
});


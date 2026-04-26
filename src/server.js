require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});

app.get("/db/ping", async (req, res) => {
  try {
    const result = await pool.query("select 1 as ok");
    res.status(200).json({ ok: true, db: result.rows?.[0]?.ok ?? 1 });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "DB_CONNECTION_FAILED",
      message: err?.message ?? String(err),
    });
  }
});

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const host = process.env.HOST ?? "0.0.0.0";

app.listen(port, host, () => {
  // Keep log simple and helpful for local dev
  console.log(`Server listening on http://${host}:${port}`);
});


const express = require("express");
const path = require("path");

function createApp() {
  const app = express();

  // Security + basic headers later

  // Parse form + JSON
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Static files
  app.use("/public", express.static(path.join(__dirname, "public")));

  // Health check
  app.get("/health", (req, res) => res.status(200).send("ok"));

  const { pool } = require("./db/pool");

  app.get("/db-health", async (req, res) => {
    try {
      const result = await pool.query("SELECT 1 AS ok");
      res.status(200).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Temporary home route
  app.get("/", (req, res) => {
    res.status(200).send("Taskflow is running ✅");
  });

  return app;
}

module.exports = { createApp };

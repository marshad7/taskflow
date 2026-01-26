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

  // Temporary home route
  app.get("/", (req, res) => {
    res.status(200).send("Taskflow is running ✅");
  });

  return app;
}

module.exports = { createApp };

// src/app.js

const express = require("express");
const path = require("path");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const csurf = require("csurf");

const { config } = require("./config/env");
const { pool } = require("./db/pool");

function createApp() {
  const app = express();

  // Views
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "pug");

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  // Parse form + JSON
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Sessions
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.nodeEnv === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  // Static files
  app.use("/public", express.static(path.join(__dirname, "public")));

  // Rate limit (skip tests)
  if (config.nodeEnv !== "test") {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
      })
    );
  }

  // CSRF protection (skip tests)
  if (config.nodeEnv !== "test") {
    app.use(
      csurf({
        cookie: false, // store secret in session
      })
    );
  }

  // UI entry (must be AFTER csurf)
  app.get("/app", (req, res) => {
    const csrfToken = typeof req.csrfToken === "function" ? req.csrfToken() : "";
    res.render("app", { csrfToken });
  });

  // Endpoint to refresh CSRF token without reloading page
  app.get("/csrf", (req, res) => {
    const csrfToken = typeof req.csrfToken === "function" ? req.csrfToken() : "";
    res.status(200).json({ csrfToken });
  });

  // API routes
  const { authRouter } = require("./routes/auth.routes");
  const { tasksRouter } = require("./routes/tasks.routes");

  app.use("/auth", authRouter);
  app.use("/tasks", tasksRouter);

  // Health
  app.get("/health", (req, res) => res.send("ok"));

  // CSRF error handler (JSON, not HTML)
  app.use((err, req, res, next) => {
    if (err && err.code === "EBADCSRFTOKEN") {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
    return next(err);
  });

  return app;
}

module.exports = { createApp };
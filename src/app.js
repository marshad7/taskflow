// src/app.js

const express = require("express");
const path = require("path");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const { doubleCsrf } = require("csrf-csrf");

const { config } = require("./config/env");
const { pool } = require("./db/pool");

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.sessionSecret,
  getSessionIdentifier: (req) => req.session?.id ?? "",
  cookieName: "csrf-token",
  cookieOptions: {
    sameSite: "lax",
    httpOnly: false,
    secure: config.nodeEnv === "production",
  },
});

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

  // Parse cookies, form + JSON
  app.use(cookieParser());
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
    app.use(doubleCsrfProtection);
  }

  // UI entry — touch session so it gets a stable ID before CSRF token is generated
  app.get("/app", (req, res) => {
    if (!req.session.initialized) {
      req.session.initialized = true;
    }
    req.session.save(() => {
      const csrfToken = config.nodeEnv !== "test" ? generateCsrfToken(req, res) : "";
      res.render("app", { csrfToken });
    });
  });

  // Endpoint to refresh CSRF token without reloading page
  app.get("/csrf", (req, res) => {
    const csrfToken = config.nodeEnv !== "test" ? generateCsrfToken(req, res) : "";
    res.status(200).json({ csrfToken });
  });

  // API routes
  const { authRouter } = require("./routes/auth.routes");
  const { tasksRouter } = require("./routes/tasks.routes");
  const { aiRouter } = require("./routes/ai.routes");

  app.use("/auth", authRouter);
  app.use("/tasks", tasksRouter);
  app.use("/ai", aiRouter);

  // Health
  app.get("/health", (req, res) => res.send("ok"));

  // CSRF error handler (JSON, not HTML)
  app.use((err, req, res, next) => {
    if (err && (err.code === "EBADCSRFTOKEN" || err.message === "invalid csrf token")) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
    return next(err);
  });

  return app;
}

module.exports = { createApp };
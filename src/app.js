const express = require("express");
const path = require("path");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);

const { config } = require("./config/env");
const { pool } = require("./db/pool");

function createApp() {
  const app = express();

  // Parse form + JSON
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Sessions (stored in Postgres)
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
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  // Static files
  app.use("/public", express.static(path.join(__dirname, "public")));

  // Health check
  app.get("/health", (req, res) => res.status(200).send("ok"));

  // DB health check
  app.get("/db-health", async (req, res) => {
    try {
      const result = await pool.query("SELECT 1 AS ok");
      res.status(200).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  const { authRouter } = require("./routes/auth.routes");
  app.use("/auth", authRouter);
  const { tasksRouter } = require("./routes/tasks.routes");
  app.use("/tasks", tasksRouter);



  // Home
  app.get("/", (req, res) => {
    res.status(200).send("Taskflow is running ✅");
  });

  return app;
}

module.exports = { createApp };

const bcrypt = require("bcrypt");
const { pool } = require("../db/pool");

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function register(req, res) {
  const email = sanitizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) return res.status(400).json({ error: "email and password are required" });
  if (password.length < 8) return res.status(400).json({ error: "password must be at least 8 characters" });

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length) return res.status(409).json({ error: "email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [email, passwordHash]
    );

    const user = result.rows[0];
    req.session.userId = user.id;

    return res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: "server error" });
  }
}

async function login(req, res) {
  const email = sanitizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  try {
    const result = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
    if (!result.rows.length) return res.status(401).json({ error: "invalid credentials" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    req.session.userId = user.id;
    return res.status(200).json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: "server error" });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    return res.status(200).json({ ok: true });
  });
}

async function me(req, res) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "not authenticated" });

  const result = await pool.query("SELECT id, email FROM users WHERE id = $1", [userId]);
  if (!result.rows.length) return res.status(401).json({ error: "not authenticated" });

  return res.status(200).json({ user: result.rows[0] });
}

module.exports = { register, login, logout, me };

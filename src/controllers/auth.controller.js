const bcrypt = require("bcryptjs");
const { pool } = require("../db/pool");

const MIN_PASSWORD_LEN = 8;

async function register(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  if (password.length < MIN_PASSWORD_LEN) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  try {
    // Check existing
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email
      `,
      [email, password_hash]
    );

    const user = result.rows[0];
    req.session.userId = user.id;

    return res.status(201).json({ user });
  } catch (err) {
    return res.status(500).json({ error: "server error" });
  }
}

async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      // Important: different status so UI can show “Register now”
      return res.status(404).json({ error: "Account not found" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    req.session.userId = user.id;
    return res.status(200).json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: "server error" });
  }
}

async function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    return res.status(200).json({ ok: true });
  });
}

async function me(req, res) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "unauthorized" });

  try {
    const result = await pool.query("SELECT id, email FROM users WHERE id = $1", [
      userId,
    ]);
    if (!result.rows.length) return res.status(401).json({ error: "unauthorized" });

    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: "server error" });
  }
}

module.exports = { register, login, logout, me };

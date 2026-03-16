const bcrypt = require("bcryptjs");
const { pool } = require("../db/pool");


async function register(req, res) {
  const { email: rawEmail, password } = req.validated.body;
  const email = rawEmail.toLowerCase();

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
    console.error("register error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

async function login(req, res) {
  const { email: rawEmail, password } = req.validated.body;
  const email = rawEmail.toLowerCase();

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    const passwordMatch = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    return res.status(200).json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("login error:", err);
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

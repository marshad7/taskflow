const { pool } = require("../db/pool");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

async function getDailyPlan(req, res) {
  const userId = req.session.userId;

  try {
    const result = await pool.query(
      `SELECT title, description, status, priority, due_date
       FROM tasks
       WHERE user_id = $1 AND status != 'done'
       ORDER BY
         CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         due_date ASC NULLS LAST
       LIMIT 20`,
      [userId]
    );

    const response = await fetch(`${AI_SERVICE_URL}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: result.rows }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "AI service unavailable" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("getDailyPlan error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

module.exports = { getDailyPlan };

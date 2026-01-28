const { pool } = require("../db/pool");

async function listTasks(req, res) {
  const userId = req.session.userId;

  const query = req.validated?.query || req.query;
  const { status, priority, q } = query;

  const limit = Number(query.limit ?? 10);
  const offset = Number(query.offset ?? 0);

  const filters = ["user_id = $1"];
  const values = [userId];
  let idx = 2;

  if (status) {
    filters.push(`status = $${idx++}`);
    values.push(status);
  }

  if (priority) {
    filters.push(`priority = $${idx++}`);
    values.push(priority);
  }

  if (q) {
    filters.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }

  const where = `WHERE ${filters.join(" AND ")}`;

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM tasks ${where}`,
      values
    );
    const total = countRes.rows[0].total;

    const pageValues = [...values, limit, offset];
    const dataRes = await pool.query(
      `
      SELECT id, title, description, status, priority, due_date, created_at, updated_at, completed_at
      FROM tasks
      ${where}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
      `,
      pageValues
    );

    return res.status(200).json({
      tasks: dataRes.rows,
      page: { limit, offset, total },
    });
  } catch (err) {
    return res.status(500).json({ error: "server error" });
  }
}

async function createTask(req, res) {
  const userId = req.session.userId;

  const body = req.validated?.body || req.body;

  const title = body.title;
  const description = body.description ?? "";
  const status = body.status ?? "todo";
  const priority = body.priority ?? "medium";
  const dueDate = body.due_date ?? null;

  try {
    const result = await pool.query(
      `
      INSERT INTO tasks (user_id, title, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, description, status, priority, due_date, created_at, updated_at, completed_at
      `,
      [userId, title, description, status, priority, dueDate]
    );

    return res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: "server error" });
  }
}

async function updateTask(req, res) {
  const userId = req.session.userId;

  const body = req.validated?.body || req.body;
  const params = req.validated?.params || req.params;

  const taskId = Number(params.id);
  if (!Number.isInteger(taskId)) return res.status(400).json({ error: "invalid id" });

  const fields = [];
  const values = [];
  let idx = 1;

  if (body.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(body.title);
  }

  if (body.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(body.description);
  }

  if (body.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(body.status);

    if (body.status === "done") {
      fields.push(`completed_at = COALESCE(completed_at, NOW())`);
    } else {
      fields.push(`completed_at = NULL`);
    }
  }

  if (body.priority !== undefined) {
    fields.push(`priority = $${idx++}`);
    values.push(body.priority);
  }

  if (body.due_date !== undefined) {
    fields.push(`due_date = $${idx++}`);
    values.push(body.due_date);
  }

  if (fields.length === 0) return res.status(400).json({ error: "no fields to update" });

  fields.push(`updated_at = NOW()`);

  values.push(taskId);
  values.push(userId);

  try {
    const result = await pool.query(
      `
      UPDATE tasks
      SET ${fields.join(", ")}
      WHERE id = $${idx++} AND user_id = $${idx++}
      RETURNING id, title, description, status, priority, due_date, created_at, updated_at, completed_at
      `,
      values
    );

    if (!result.rows.length) return res.status(404).json({ error: "task not found" });
    return res.status(200).json({ task: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: "server error" });
  }
}

async function deleteTask(req, res) {
  const userId = req.session.userId;

  const params = req.validated?.params || req.params;
  const taskId = Number(params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: "invalid id" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [taskId, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "task not found" });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: "server error" });
  }
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
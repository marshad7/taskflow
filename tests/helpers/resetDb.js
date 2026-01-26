const { pool } = require("../../src/db/pool");

async function resetDb() {
  await pool.query("TRUNCATE TABLE tasks, users RESTART IDENTITY CASCADE;");
}

module.exports = { resetDb };

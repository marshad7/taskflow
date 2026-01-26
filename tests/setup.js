const { resetDb } = require("./helpers/resetDb");
const { pool } = require("../src/db/pool");

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await pool.end();
});

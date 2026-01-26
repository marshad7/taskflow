const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/tasks.controller");

const router = express.Router();

router.use(requireAuth);

router.get("/", listTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = { tasksRouter: router };

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/tasks.controller");
const { validate } = require("../middleware/validate");
const {
  createTaskSchema,
  updateTaskSchema,
} = require("../validation/tasks.schemas");

const router = express.Router();

router.use(requireAuth);

router.get("/", listTasks);

router.post(
  "/",
  validate(createTaskSchema),
  createTask
);

router.put(
  "/:id",
  validate(updateTaskSchema),
  updateTask
);

router.delete("/:id", deleteTask);

module.exports = { tasksRouter: router };

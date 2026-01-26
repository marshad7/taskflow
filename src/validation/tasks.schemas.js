const { z } = require("zod");

const status = z.enum(["todo", "doing", "done"]);
const priority = z.enum(["low", "medium", "high"]);

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    status: status.optional(),
    priority: priority.optional(),
    due_date: z.string().date().optional(), // expects "YYYY-MM-DD"
  }),
  params: z.object({}),
  query: z.object({}),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).optional(),
    status: status.optional(),
    priority: priority.optional(),
    due_date: z.string().date().nullable().optional(), // allow null to clear
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
  query: z.object({}),
});

module.exports = { createTaskSchema, updateTaskSchema };

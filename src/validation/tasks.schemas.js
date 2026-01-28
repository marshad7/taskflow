const { z } = require("zod");

const statusEnum = z.enum(["todo", "doing", "done"]);
const priorityEnum = z.enum(["low", "medium", "high"]);

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "title is required"),
    description: z.string().trim().max(500).optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD")
      .optional()
      .nullable(),
  }),
});

const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "invalid id"),
  }),
  body: z
    .object({
      title: z.string().trim().min(1, "title cannot be empty").optional(),
      description: z.string().trim().max(500).optional(),
      status: statusEnum.optional(),
      priority: priorityEnum.optional(),
      due_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD")
        .optional()
        .nullable(),
    })
    .strict(),
});

module.exports = { createTaskSchema, updateTaskSchema };

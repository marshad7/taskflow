const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().email({ message: "Valid email required" }).max(254),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(128),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().min(1, { message: "Email required" }),
    password: z.string().min(1, { message: "Password required" }),
  }),
});

module.exports = { registerSchema, loginSchema };

const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/requireAuth");
const { getDailyPlan } = require("../controllers/ai.controller");

const aiRouter = Router();

const planRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => String(req.session.userId),
  handler: (req, res) => {
    res.status(429).json({ error: "Limit reached. You can plan your day 5 times per 24 hours." });
  },
  skip: (req) => req.app.get("env") === "test",
});

aiRouter.get("/plan", requireAuth, planRateLimit, getDailyPlan);

module.exports = { aiRouter };

const express = require("express");
const { register, login, logout, me } = require("../controllers/auth.controller");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validation/auth.schemas");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", me);

module.exports = { authRouter: router };

const express = require("express");
const { register, login, logout, me } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);

module.exports = { authRouter: router };

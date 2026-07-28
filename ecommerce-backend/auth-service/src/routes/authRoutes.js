const express = require("express");
const { register, confirm, login, logout } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/confirm", confirm);
router.post("/login", login);
router.post("/logout", logout);


module.exports = router;

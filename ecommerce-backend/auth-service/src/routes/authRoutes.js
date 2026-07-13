const express = require("express");
const { register, confirm, login } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/confirm", confirm);
router.post("/login", login);



module.exports = router;

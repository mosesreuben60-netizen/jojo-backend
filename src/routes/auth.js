const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const validEmail = email.trim().toLowerCase() === (process.env.ADMIN_EMAIL || "").toLowerCase();
  const passwordMatches = validEmail
    ? await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || "")
    : false;

  if (!validEmail || !passwordMatches) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

module.exports = router;

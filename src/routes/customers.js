const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const Booking = require("../models/Booking");
const { requireCustomerAuth } = require("../middleware/auth");

const router = express.Router();

function issueToken(customer) {
  return jwt.sign({ id: customer._id, email: customer.email, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// POST /api/customers/signup — public
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "An account with that email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await Customer.create({ name, email, phone, passwordHash });

    const token = issueToken(customer);
    res.status(201).json({ token, customer: customer.toPublicJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create account" });
  }
});

// POST /api/customers/login — public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (!customer) return res.status(401).json({ error: "Incorrect email or password" });

    const matches = await bcrypt.compare(password, customer.passwordHash);
    if (!matches) return res.status(401).json({ error: "Incorrect email or password" });

    const token = issueToken(customer);
    res.json({ token, customer: customer.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/customers/me — auth required
router.get("/me", requireCustomerAuth, async (req, res) => {
  const customer = await Customer.findById(req.customer.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer.toPublicJSON());
});

// GET /api/customers/me/bookings — auth required, this customer's delivery history
router.get("/me/bookings", requireCustomerAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.customer.id }).sort({ createdAt: -1 }).limit(100);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Could not load delivery history" });
  }
});

module.exports = router;

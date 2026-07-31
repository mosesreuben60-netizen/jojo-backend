const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver");
const { requireDriverAuth } = require("../middleware/auth");

const router = express.Router();

function issueToken(driver) {
  return jwt.sign({ id: driver._id, email: driver.email, role: "driver" }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// POST /api/drivers/signup — public
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, licenseNumber, bankName, bankAccountNumber, bikeTrackerNumber } = req.body;

    if (!name || !email || !password || !phone || !bankName || !bankAccountNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await Driver.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "An account with that email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const driver = await Driver.create({
      name, email, phone, bankName, bankAccountNumber,
      licenseNumber: licenseNumber || "",
      bikeTrackerNumber: bikeTrackerNumber || "",
      passwordHash
    });

    const token = issueToken(driver);
    res.status(201).json({ token, driver: driver.toPublicJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create account" });
  }
});

// POST /api/drivers/login — public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const driver = await Driver.findOne({ email: email.toLowerCase().trim() });
    if (!driver) return res.status(401).json({ error: "Incorrect email or password" });

    const matches = await bcrypt.compare(password, driver.passwordHash);
    if (!matches) return res.status(401).json({ error: "Incorrect email or password" });

    const token = issueToken(driver);
    res.json({ token, driver: driver.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/drivers/me — auth required
router.get("/me", requireDriverAuth, async (req, res) => {
  const driver = await Driver.findById(req.driver.id);
  if (!driver) return res.status(404).json({ error: "Driver not found" });
  res.json(driver.toPublicJSON());
});

// PATCH /api/drivers/me/online — auth required, toggle online/offline
router.patch("/me/online", requireDriverAuth, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.driver.id,
      { isOnline: !!isOnline },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver.toPublicJSON());
  } catch (err) {
    res.status(500).json({ error: "Could not update status" });
  }
});

// PATCH /api/drivers/me/location — auth required, called repeatedly from the driver's phone while online
router.patch("/me/location", requireDriverAuth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng must be numbers" });
    }
    const driver = await Driver.findByIdAndUpdate(
      req.driver.id,
      { lastLocation: { lat, lng, updatedAt: new Date() } },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Could not update location" });
  }
});

// GET /api/drivers/available-count — public, used by the booking page's status chip
router.get("/available-count", async (req, res) => {
  try {
    const count = await Driver.countDocuments({ isOnline: true });
    res.json({ availableCount: count, isAvailable: count > 0 });
  } catch (err) {
    res.status(500).json({ error: "Could not check availability" });
  }
});

module.exports = router;

const express = require("express");
const Booking = require("../models/Booking");
const requireAuth = require("../middleware/auth");
const { findTier } = require("../tiers");

const router = express.Router();

function generateTrackingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `RR-${code}`;
}

async function uniqueTrackingCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateTrackingCode();
    const exists = await Booking.exists({ trackingCode: code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique tracking code, try again");
}

// POST /api/bookings — public, creates a new booking (unpaid)
router.post("/", async (req, res) => {
  try {
    const { customerName, customerPhone, pickupAddress, dropoffAddress, packageNote, tierId } = req.body;

    if (!customerName || !customerPhone || !pickupAddress || !dropoffAddress || !tierId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tier = findTier(tierId);
    if (!tier) return res.status(400).json({ error: "Unknown delivery tier" });

    const trackingCode = await uniqueTrackingCode();

    const booking = await Booking.create({
      customerName,
      customerPhone,
      pickupAddress,
      dropoffAddress,
      packageNote: packageNote || "",
      tierId: tier.id,
      tierLabel: tier.label,
      price: tier.price,
      trackingCode,
      status: "pending",
      paymentStatus: "unpaid"
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create booking" });
  }
});

// GET /api/bookings/code/:code — public, for the tracking page
router.get("/code/:code", async (req, res) => {
  try {
    const booking = await Booking.findOne({ trackingCode: req.params.code.trim().toUpperCase() });
    if (!booking) return res.status(404).json({ error: "No booking found for that code" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Lookup failed" });
  }
});

// GET /api/bookings — admin only, full list for the dashboard
router.get("/", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(200);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Could not load bookings" });
  }
});

// PATCH /api/bookings/:id/status — admin only
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!Booking.STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Could not update status" });
  }
});

module.exports = router;const express = require("express");
const Booking = require("../models/Booking");
const requireAuth = require("../middleware/auth");
const { findTier } = require("../tiers");

const router = express.Router();

function generateTrackingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `RR-${code}`;
}

async function uniqueTrackingCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateTrackingCode();
    const exists = await Booking.exists({ trackingCode: code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique tracking code, try again");
}

// POST /api/bookings — public, creates a new booking (unpaid)
router.post("/", async (req, res) => {
  try {
    const { customerName, customerPhone, pickupAddress, dropoffAddress, packageNote, tierId } = req.body;

    if (!customerName || !customerPhone || !pickupAddress || !dropoffAddress || !tierId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tier = findTier(tierId);
    if (!tier) return res.status(400).json({ error: "Unknown delivery tier" });

    const trackingCode = await uniqueTrackingCode();

    const booking = await Booking.create({
      customerName,
      customerPhone,
      pickupAddress,
      dropoffAddress,
      packageNote: packageNote || "",
      tierId: tier.id,
      tierLabel: tier.label,
      price: tier.price,
      trackingCode,
      status: "pending",
      paymentStatus: "unpaid"
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create booking" });
  }
});

// GET /api/bookings/code/:code — public, for the tracking page
router.get("/code/:code", async (req, res) => {
  try {
    const booking = await Booking.findOne({ trackingCode: req.params.code.trim().toUpperCase() });
    if (!booking) return res.status(404).json({ error: "No booking found for that code" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Lookup failed" });
  }
});

// GET /api/bookings — admin only, full list for the dashboard
router.get("/", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(200);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Could not load bookings" });
  }
});

// PATCH /api/bookings/:id/status — admin only
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!Booking.STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Could not update status" });
  }
});

module.exports = router;

const express = require("express");
const Booking = require("../models/Booking");
const Driver = require("../models/Driver");
const Customer = require("../models/Customer");
const { requireDriverAuth, requireCustomerAuth } = require("../middleware/auth");
const { findTier } = require("../tiers");
const { notifyDriversOfNewBooking } = require("../services/email");

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

// POST /api/bookings — customer auth required. Creates a new booking (unpaid, unassigned).
router.post("/", requireCustomerAuth, async (req, res) => {
  try {
    const { pickupAddress, dropoffAddress, packageNote, tierId } = req.body;

    if (!pickupAddress || !dropoffAddress || !tierId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tier = findTier(tierId);
    if (!tier) return res.status(400).json({ error: "Unknown delivery tier" });

    const customer = await Customer.findById(req.customer.id);
    if (!customer) return res.status(404).json({ error: "Customer account not found" });

    const trackingCode = await uniqueTrackingCode();

    const booking = await Booking.create({
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
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

    // Fire-and-forget: let online drivers know a new job is waiting.
    Driver.find({ isOnline: true }).then(onlineDrivers => {
      if (onlineDrivers.length) notifyDriversOfNewBooking(booking, onlineDrivers).catch(console.error);
    }).catch(console.error);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Could not create booking" });
  }
});

// GET /api/bookings/code/:code — public, for the tracking page.
// Includes the assigned driver's live location if there is one.
router.get("/code/:code", async (req, res) => {
  try {
    const booking = await Booking.findOne({ trackingCode: req.params.code.trim().toUpperCase() });
    if (!booking) return res.status(404).json({ error: "No booking found for that code" });

    let driverLocation = null;
    if (booking.driverId) {
      const driver = await Driver.findById(booking.driverId);
      if (driver && driver.lastLocation && driver.lastLocation.lat != null) {
        driverLocation = driver.lastLocation;
      }
    }

    res.json({ ...booking.toObject(), driverLocation });
  } catch (err) {
    res.status(500).json({ error: "Lookup failed" });
  }
});

// GET /api/bookings — driver auth required. Unassigned pool PLUS this driver's own claimed jobs.
router.get("/", requireDriverAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ driverId: null }, { driverId: req.driver.id }]
    }).sort({ createdAt: -1 }).limit(200);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Could not load bookings" });
  }
});

// PATCH /api/bookings/:id/claim — driver auth required.
router.patch("/:id/claim", requireDriverAuth, async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, driverId: null },
      { driverId: req.driver.id, status: "confirmed" },
      { new: true }
    );
    if (!booking) return res.status(409).json({ error: "This booking was already claimed by someone else" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Could not claim booking" });
  }
});

// PATCH /api/bookings/:id/status — driver auth required, only the assigned driver can update
router.patch("/:id/status", requireDriverAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!Booking.STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, driverId: req.driver.id },
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: "Booking not found or not assigned to you" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Could not update status" });
  }
});

module.exports = router;

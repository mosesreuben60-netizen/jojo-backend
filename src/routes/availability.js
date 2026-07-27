const express = require("express");
const Availability = require("../models/Availability");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const doc = await Availability.getOrCreateAvailability();
    res.json({ isAvailable: doc.isAvailable, note: doc.note });
  } catch (err) {
    res.status(500).json({ error: "Could not load availability" });
  }
});

router.patch("/", requireAuth, async (req, res) => {
  try {
    const { isAvailable, note } = req.body;
    const doc = await Availability.getOrCreateAvailability();
    if (typeof isAvailable === "boolean") doc.isAvailable = isAvailable;
    if (typeof note === "string") doc.note = note;
    await doc.save();
    res.json({ isAvailable: doc.isAvailable, note: doc.note });
  } catch (err) {
    res.status(500).json({ error: "Could not update availability" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();

// Simple in-memory throttle so we never exceed Nominatim's 1 request/sec
// usage policy, regardless of how many customers are typing at once.
let lastRequestAt = 0;
async function throttledFetch(url, options) {
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastRequestAt));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestAt = Date.now();
  return fetch(url, options);
}

// GET /api/geocode?address=... — public. Proxies to OpenStreetMap's free
// Nominatim geocoder so the frontend never talks to a third party directly
// (keeps a proper User-Agent, respects rate limits, and lets us swap
// providers later without touching the frontend).
router.get("/", async (req, res) => {
  try {
    const address = (req.query.address || "").trim();
    if (!address) return res.status(400).json({ error: "address query param is required" });

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const response = await throttledFetch(url, {
      headers: { "User-Agent": "JoJoActiveLogistics/1.0 (delivery booking app)" }
    });

    if (!response.ok) return res.status(502).json({ error: "Geocoding service unavailable" });

    const results = await response.json();
    if (!results.length) return res.json({ found: false });

    res.json({
      found: true,
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
      displayName: results[0].display_name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

module.exports = router;

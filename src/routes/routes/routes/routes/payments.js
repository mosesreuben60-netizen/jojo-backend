const express = require("express");
const Booking = require("../models/Booking");

const router = express.Router();

// POST /api/payments/verify — public, called by the frontend right after
// Paystack's checkout closes. Verifies the transaction directly with
// Paystack's servers (using the secret key) before marking anything paid,
// so a closed tab or tampered client can't fake a "paid" status.
router.post("/verify", async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: "Missing payment reference" });

    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success") {
      await Booking.findOneAndUpdate({ trackingCode: reference }, { paymentStatus: "failed" });
      return res.status(402).json({ error: "Payment could not be verified", verified: false });
    }

    const booking = await Booking.findOneAndUpdate(
      { trackingCode: reference },
      { paymentStatus: "paid", paymentReference: reference, status: "confirmed" },
      { new: true }
    );

    if (!booking) return res.status(404).json({ error: "Booking not found for this reference" });

    res.json({ verified: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;

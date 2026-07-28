// Sends email via Resend (https://resend.com) — no SDK needed, just their HTTP API.
// Requires RESEND_API_KEY and RESEND_FROM_EMAIL in environment variables.
// If those aren't set, notifications are silently skipped (so local dev / early
// setup doesn't crash just because email isn't configured yet).

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.log(`[email skipped — RESEND not configured] Would have sent "${subject}" to ${to}`);
    return { skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from, to, subject, html })
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Resend send failed:", res.status, body);
      return { error: true };
    }
    return await res.json();
  } catch (err) {
    console.error("Resend send error:", err);
    return { error: true };
  }
}

// Notifies every currently-online driver that a new booking is waiting to be claimed.
async function notifyDriversOfNewBooking(booking, onlineDrivers) {
  const subject = `New delivery request — ${booking.trackingCode}`;
  const html = `
    <p>A new delivery request just came in:</p>
    <ul>
      <li><strong>Tracking code:</strong> ${booking.trackingCode}</li>
      <li><strong>Pickup:</strong> ${booking.pickupAddress}</li>
      <li><strong>Drop-off:</strong> ${booking.dropoffAddress}</li>
      <li><strong>Service:</strong> ${booking.tierLabel}</li>
    </ul>
    <p>Open the driver app to claim it.</p>
  `;

  await Promise.all(
    onlineDrivers.map(driver => sendEmail({ to: driver.email, subject, html }))
  );
}

// Notifies a specific driver their booking's payment came through / status changed, etc.
async function notifyDriverStatusEvent(driver, subject, message) {
  await sendEmail({
    to: driver.email,
    subject,
    html: `<p>${message}</p>`
  });
}

module.exports = { sendEmail, notifyDriversOfNewBooking, notifyDriverStatusEvent };

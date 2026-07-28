const jwt = require("jsonwebtoken");

function decodeToken(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Verifies a driver's JWT (payload.role === "driver") and attaches req.driver
function requireDriverAuth(req, res, next) {
  const payload = decodeToken(req);
  if (!payload || payload.role !== "driver") {
    return res.status(401).json({ error: "Missing or invalid driver authorization" });
  }
  req.driver = payload;
  next();
}

// Verifies a customer's JWT (payload.role === "customer") and attaches req.customer
function requireCustomerAuth(req, res, next) {
  const payload = decodeToken(req);
  if (!payload || payload.role !== "customer") {
    return res.status(401).json({ error: "Missing or invalid customer authorization" });
  }
  req.customer = payload;
  next();
}

module.exports = { requireDriverAuth, requireCustomerAuth };

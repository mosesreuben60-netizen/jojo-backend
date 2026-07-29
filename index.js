require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/db");

const bookingRoutes = require("./src/routes/bookings");
const driverRoutes = require("./src/routes/drivers");
const customerRoutes = require("./src/routes/customers");
const paymentRoutes = require("./src/routes/payments");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "JoJo Delivery API is running" }));
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/bookings", bookingRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`RushRida API listening on port ${PORT}`));
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

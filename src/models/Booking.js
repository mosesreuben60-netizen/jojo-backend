const mongoose = require("mongoose");

const STATUS_VALUES = ["pending", "confirmed", "picked_up", "in_transit", "delivered", "cancelled"];
const PAYMENT_STATUS_VALUES = ["unpaid", "paid", "failed"];

const bookingSchema = new mongoose.Schema(
  {
    trackingCode: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    pickupAddress: { type: String, required: true, trim: true },
    dropoffAddress: { type: String, required: true, trim: true },
    packageNote: { type: String, trim: true, default: "" },
    tierId: { type: String, required: true },
    tierLabel: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: STATUS_VALUES, default: "pending" },
    paymentStatus: { type: String, enum: PAYMENT_STATUS_VALUES, default: "unpaid" },
    paymentReference: { type: String, default: null },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
module.exports.STATUS_VALUES = STATUS_VALUES;

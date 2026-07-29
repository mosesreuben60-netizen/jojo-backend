const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    bankAccountNumber: { type: String, required: true, trim: true },
    bikeTrackerNumber: { type: String, trim: true, default: "" },
    isOnline: { type: Boolean, default: false },
    lastLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

driverSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    licenseNumber: this.licenseNumber,
    bikeTrackerNumber: this.bikeTrackerNumber,
    isOnline: this.isOnline,
    lastLocation: this.lastLocation
  };
};

module.exports = mongoose.model("Driver", driverSchema);

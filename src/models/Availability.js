const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: "availability", unique: true },
    isAvailable: { type: Boolean, default: true },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

async function getOrCreateAvailability() {
  const Availability = mongoose.model("Availability");
  let doc = await Availability.findOne({ singletonKey: "availability" });
  if (!doc) {
    doc = await Availability.create({ singletonKey: "availability", isAvailable: true });
  }
  return doc;
}

module.exports = mongoose.model("Availability", availabilitySchema);
module.exports.getOrCreateAvailability = getOrCreateAvailability;

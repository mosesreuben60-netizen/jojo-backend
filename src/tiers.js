// Single source of truth for delivery tiers. The frontend has a matching
// copy in config.js for display, but the SERVER always recalculates price
// from here when a booking is created — so a tampered client request can't
// set its own price.

const TIERS = [
  { id: "bike_light", label: "Bike – Light Package", desc: "Docs, small parcels, under 5kg", price: 1500 },
  { id: "bike_medium", label: "Bike – Medium Package", desc: "Boxes, groceries, 5–15kg", price: 2500 },
  { id: "bike_rush", label: "Rush Delivery", desc: "Priority, picked up within 20 mins", price: 3500 },
  { id: "bike_multi", label: "Multi-Stop Run", desc: "2–4 drop-off points", price: 4500 }
];

function findTier(tierId) {
  return TIERS.find(t => t.id === tierId) || null;
}

module.exports = { TIERS, findTier };

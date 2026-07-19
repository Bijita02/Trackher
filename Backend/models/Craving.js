const mongoose = require("mongoose");

const cravingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  food: { type: String, required: true },
  category: { type: String, default: "" }, 
  intensity: { type: Number, min: 1, max: 10, default: 5 },
  satisfied: { type: Boolean, default: false }, 
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Craving", cravingSchema);
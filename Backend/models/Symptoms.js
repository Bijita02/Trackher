const mongoose = require("mongoose");

const symptomSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  tags: [{ type: String }],
  notes: { type: String, default: "" },
  intensity: { type: Number, min: 1, max: 10, default: 5 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Symptom", symptomSchema);
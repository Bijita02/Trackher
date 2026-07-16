const mongoose = require("mongoose");

const weightLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },

  weightKg: { type: Number, required: true },

  enteredValue: { type: Number, required: true },
  enteredUnit: { type: String, enum: ["kg", "lb"], default: "kg" },

  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WeightLog", weightLogSchema);
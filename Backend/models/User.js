const mongoose = require("mongoose");

const cycleHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true }
});

const cycleInfoSchema = new mongoose.Schema({
  lastPeriod: { type: Date },
  cycleLength: { type: Number, default: 28 },
  periodLength: { type: Number, default: 5 },
  history: {
    type: [cycleHistorySchema],
    default: []
  }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  birthdate: Date,
  created_at: { type: Date, default: Date.now },
  cycleInfo: { type: cycleInfoSchema, default: () => ({ history: [] }) }
});

module.exports = mongoose.model("User", userSchema);
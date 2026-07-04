const mongoose = require("mongoose");

const cycleInfoSchema = new mongoose.Schema({
  lastPeriod: { type: Date },
  cycleLength: { type: Number, default: 28 },
  periodLength: { type: Number, default: 5 },
});

const pregnancyInfoSchema = new mongoose.Schema(
  {
    dueDate: { type: Date, required: true },
    lastPeriod: { type: Date }, 
    startDate: { type: Date, default: Date.now }, 
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  birthdate: Date,
  created_at: { type: Date, default: Date.now },
  cycleInfo: { type: cycleInfoSchema, default: () => ({}) },
  pregnancyInfo: { type: pregnancyInfoSchema, default: null },
});

module.exports = mongoose.model("User", userSchema);
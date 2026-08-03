const mongoose = require("mongoose");

const cycleHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true }, 
  endDate: { type: Date },              
  cycleLength: { type: Number },
  periodLength: { type: Number },
});


const symptomLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  tags: { type: [String], default: [] },
  notes: { type: String, default: "" },
  intensity: { type: Number, default: 5 },
});

const cycleInfoSchema = new mongoose.Schema({
  lastPeriod: { type: Date },
  cycleLength: { type: Number, default: 28 },
  periodLength: { type: Number, default: 5 },
  history: {
    type: [cycleHistorySchema],
    default: [],
  },
  symptoms: {
    type: [symptomLogSchema],
    default: [],
  },
});

const pregnancyInfoSchema = new mongoose.Schema(
  {
    dueDate: { type: Date, required: true },
    lastPeriod: { type: Date },
    startDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  birthdate: Date,
  created_at: { type: Date, default: Date.now },
  cycleInfo: { type: cycleInfoSchema, default: () => ({ history: [], symptoms: [] }) },
  pregnancyInfo: { type: pregnancyInfoSchema, default: null },
});

module.exports = mongoose.model("User", userSchema);
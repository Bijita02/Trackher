const mongoose = require("mongoose");

const pregnancyReminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true, trim: true },
    note: { type: String, trim: true, default: "" },
    time: { type: String, default: "" }, 
    type: { type: String, enum: ["appointment", "important"], default: "appointment" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PregnancyReminder", pregnancyReminderSchema);
const express = require("express");
const router = express.Router();
const PregnancyReminder = require("../models/Pregnancyreminder");

const verifyT
router.get("/", verifyToken, async (req, res) => {
  try {
    const reminders = await PregnancyReminder.find({ user: req.user.id }).sort({ date: 1 });
    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't fetch reminders." });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { date, title, note, time, type } = req.body;
    if (!date || !title) {
      return res.status(400).json({ error: "Date and title are required." });
    }
    const reminder = await PregnancyReminder.create({
      user: req.user.id,
      date,
      title,
      note,
      time,
      type,
    });
    res.status(201).json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't save reminder." });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { date, title, note, time, type } = req.body;
    const reminder = await PregnancyReminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { date, title, note, time, type },
      { new: true }
    );
    if (!reminder) return res.status(404).json({ error: "Reminder not found." });
    res.json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't update reminder." });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const reminder = await PregnancyReminder.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!reminder) return res.status(404).json({ error: "Reminder not found." });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't delete reminder." });
  }
});

module.exports = router;
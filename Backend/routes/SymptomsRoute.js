const express = require("express");
const router = express.Router();
const Symptom = require("../models/Symptoms");
const verifyToken = require("../middleware/verifyToken");

router.get("/", verifyToken, async (req, res) => {
  try {
    const symptoms = await Symptom.find({ userId: req.user.id })
      .sort({ date: -1 })
      .lean();
    res.json(symptoms);
  } catch (err) {
    console.error("GET /api/symptoms error:", err);
    res.status(500).json({ error: "Failed to fetch symptoms" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { date, tags, notes, intensity } = req.body;
    if (!date) return res.status(400).json({ error: "Date is required" });

    await Symptom.create({
      userId: req.user.id,
      date: new Date(date),
      tags: tags || [],
      notes: notes || "",
      intensity: intensity ?? 5,
    });

    const allSymptoms = await Symptom.find({ userId: req.user.id })
      .sort({ date: -1 })
      .lean();
    res.status(201).json(allSymptoms);
  } catch (err) {
    console.error("POST /api/symptoms error:", err);
    res.status(500).json({ error: "Failed to save symptom" });
  }
});

module.exports = router;
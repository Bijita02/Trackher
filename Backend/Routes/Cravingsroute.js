const express = require("express");
const router = express.Router();
const Craving = require("../models/Craving");
const verifyToken = require("../middleware/verifyToken");

router.get("/", verifyToken, async (req, res) => {
  try {
    const cravings = await Craving.find({ userId: req.user.id })
      .sort({ date: -1 })
      .lean();
    res.json(cravings);
  } catch (err) {
    console.error("GET /api/cravings error:", err);
    res.status(500).json({ error: "Failed to fetch cravings" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { date, food, category, intensity, satisfied, notes } = req.body;
    if (!date) return res.status(400).json({ error: "Date is required" });
    if (!food || !food.trim()) return res.status(400).json({ error: "Food/craving is required" });

    await Craving.create({
      userId: req.user.id,
      date: new Date(date),
      food: food.trim(),
      category: category || "",
      intensity: intensity ?? 5,
      satisfied: Boolean(satisfied),
      notes: notes || "",
    });

    const all = await Craving.find({ userId: req.user.id })
      .sort({ date: -1 })
      .lean();
    res.status(201).json(all);
  } catch (err) {
    console.error("POST /api/cravings error:", err);
    res.status(500).json({ error: "Failed to save craving" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { date, food, category, intensity, satisfied, notes } = req.body;

    const craving = await Craving.findOne({ _id: req.params.id, userId: req.user.id });
    if (!craving) return res.status(404).json({ error: "Craving not found" });

    if (date) craving.date = new Date(date);
    if (food !== undefined) craving.food = food.trim();
    if (category !== undefined) craving.category = category;
    if (intensity !== undefined) craving.intensity = intensity;
    if (satisfied !== undefined) craving.satisfied = Boolean(satisfied);
    if (notes !== undefined) craving.notes = notes;
    await craving.save();

    const all = await Craving.find({ userId: req.user.id })
      .sort({ date: -1 })
      .lean();
    res.json(all);
  } catch (err) {
    console.error("PUT /api/cravings/:id error:", err);
    res.status(500).json({ error: "Failed to update craving" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const craving = await Craving.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!craving) return res.status(404).json({ error: "Craving not found" });

    const all = await Craving.find({ userId: req.user.id })
      .sort({ date: -1 })
      .lean();
    res.json(all);
  } catch (err) {
    console.error("DELETE /api/cravings/:id error:", err);
    res.status(500).json({ error: "Failed to delete craving" });
  }
});

module.exports = router;
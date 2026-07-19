const express = require("express");
const router = express.Router();
const WeightLog = require("../models/WeightLog");
const verifyToken = require("../middleware/verifyToken");

const LB_TO_KG = 0.45359237;

router.get("/", verifyToken, async (req, res) => {
  try {
    const logs = await WeightLog.find({ userId: req.user.id })
      .sort({ date: 1 })
      .lean();
    res.json(logs);
  } catch (err) {
    console.error("GET /api/weight error:", err);
    res.status(500).json({ error: "Failed to fetch weight history" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { date, value, unit, notes } = req.body;
    if (!date) return res.status(400).json({ error: "Date is required" });
    if (value === undefined || value === null || value === "") {
      return res.status(400).json({ error: "Weight value is required" });
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      return res.status(400).json({ error: "Weight must be a positive number" });
    }

    const resolvedUnit = unit === "lb" ? "lb" : "kg";
    const weightKg = resolvedUnit === "lb" ? numericValue * LB_TO_KG : numericValue;

    await WeightLog.create({
      userId: req.user.id,
      date: new Date(date),
      weightKg,
      enteredValue: numericValue,
      enteredUnit: resolvedUnit,
      notes: notes || "",
    });

    const allLogs = await WeightLog.find({ userId: req.user.id })
      .sort({ date: 1 })
      .lean();
    res.status(201).json(allLogs);
  } catch (err) {
    console.error("POST /api/weight error:", err);
    res.status(500).json({ error: "Failed to save weight entry" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const log = await WeightLog.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!log) return res.status(404).json({ error: "Entry not found" });

    const allLogs = await WeightLog.find({ userId: req.user.id })
      .sort({ date: 1 })
      .lean();
    res.json(allLogs);
  } catch (err) {
    console.error("DELETE /api/weight/:id error:", err);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

module.exports = router;
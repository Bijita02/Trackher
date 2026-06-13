import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Saves cycle info
router.post("/user-cycle", auth, async (req, res) => {
  try {
    const { lastPeriod, cycleLength, periodLength } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { cycleInfo: { lastPeriod, cycleLength, periodLength } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gets user
router.get("/users/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log symptoms for a date
router.post("/symptoms", auth, async (req, res) => {
  try {
    const { date, tags, notes, intensity } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: "At least one symptom tag is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          "cycleInfo.symptoms": {
            date: new Date(date),
            tags,
            notes: notes || "",
            intensity: intensity || 5,
          },
        },
      },
      { new: true }
    );

    res.json(user.cycleInfo.symptoms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all logged symptoms for the user
router.get("/symptoms", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const symptoms = user.cycleInfo?.symptoms || [];

    // Return sorted newest first
    const sorted = [...symptoms].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a specific symptom log by its MongoDB _id
router.delete("/symptoms/:symptomId", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: {
          "cycleInfo.symptoms": { _id: req.params.symptomId },
        },
      },
      { new: true }
    );

    res.json(user.cycleInfo.symptoms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a specific symptom log by its MongoDB _id
router.put("/symptoms/:symptomId", auth, async (req, res) => {
  try {
    const { date, tags, notes, intensity } = req.body;

    const user = await User.findOneAndUpdate(
      {
        _id: req.user.id,
        "cycleInfo.symptoms._id": req.params.symptomId,
      },
      {
        $set: {
          "cycleInfo.symptoms.$.date": new Date(date),
          "cycleInfo.symptoms.$.tags": tags,
          "cycleInfo.symptoms.$.notes": notes || "",
          "cycleInfo.symptoms.$.intensity": intensity || 5,
        },
      },
      { new: true }
    );

    res.json(user.cycleInfo.symptoms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
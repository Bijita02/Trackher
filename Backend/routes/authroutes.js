import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// 1. Register Route
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });
    res.json({ _id: user._id, email: user.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🎯 3. NEW: Update User Cycle Information Route (Fixes the state glitch)
// 🎯 UPDATE: Adjusted to match your nested cycleInfo.lastPeriod schema structure
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { lastPeriod } = req.body; // Incoming date string from frontend (e.g., "2026-06-15")

    if (!lastPeriod) {
      return res.status(400).json({ error: "No date provided" });
    }

    // Find user by ID and update the nested object field cleanly
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 
        $set: { 
          "cycleInfo.lastPeriod": new Date(lastPeriod) // Converts string to Date object for MongoDB
        } 
      }, 
      { new: true } 
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User configuration profile data not found" });
    }

    res.json({ 
      success: true, 
      message: "Cycle history synchronized successfully!", 
      lastPeriodDate: updatedUser.cycleInfo.lastPeriod // Send it back to confirm
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
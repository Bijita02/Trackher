import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOTAL_PREGNANCY_DAYS = 280;

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

// Saves cycle info: updates current snapshot fields individually
// AND appends a full entry to history, instead of overwriting cycleInfo wholesale
router.post("/user-cycle", auth, async (req, res) => {
  try {
    const { lastPeriod, cycleLength, periodLength } = req.body;

    if (!lastPeriod) {
      return res.status(400).json({ error: "lastPeriod is required" });
    }

    const targetUserId = req.user.id || req.user._id;
    if (!targetUserId) {
      return res.status(400).json({ error: "User ID missing from token payload" });
    }

    const parsedCycleLength = cycleLength ? Number(cycleLength) : undefined;
    const parsedPeriodLength = periodLength ? Number(periodLength) : undefined;

    const user = await User.findByIdAndUpdate(
      targetUserId,
      {
        $set: {
          "cycleInfo.lastPeriod": new Date(lastPeriod),
          ...(parsedCycleLength && { "cycleInfo.cycleLength": parsedCycleLength }),
          ...(parsedPeriodLength && { "cycleInfo.periodLength": parsedPeriodLength }),
        },
        $push: {
          "cycleInfo.history": {
            date: new Date(lastPeriod),
            cycleLength: parsedCycleLength,
            periodLength: parsedPeriodLength,
          },
        },
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pregnancy-info", auth, async (req, res) => {
  try {
    const { dueDate, lastPeriod } = req.body;
    const targetUserId = req.user.id || req.user._id;

    let resolvedDueDate;
    if (dueDate) {
      resolvedDueDate = new Date(dueDate);
    } else if (lastPeriod) {
      resolvedDueDate = new Date(new Date(lastPeriod).getTime() + TOTAL_PREGNANCY_DAYS * MS_PER_DAY);
    } else {
      return res.status(400).json({ error: "Provide either dueDate or lastPeriod" });
    }

    if (Number.isNaN(resolvedDueDate.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      {
        pregnancyInfo: {
          dueDate: resolvedDueDate,
          lastPeriod: lastPeriod ? new Date(lastPeriod) : undefined,
          startDate: new Date(),
        },
      },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/pregnancy-info", auth, async (req, res) => {
  try {
    const targetUserId = req.user.id || req.user._id;
    const user = await User.findByIdAndUpdate(
      targetUserId,
      { $set: { pregnancyInfo: null } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/symptoms", auth, async (req, res) => {
  try {
    const { date, tags, notes, intensity } = req.body;
    const targetUserId = req.user.id || req.user._id;

    if (!date) return res.status(400).json({ error: "Date is required" });
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: "At least one symptom tag is required" });
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
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

router.get("/symptoms", auth, async (req, res) => {
  try {
    const targetUserId = req.user.id || req.user._id;
    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const symptoms = user.cycleInfo?.symptoms || [];
    const sorted = [...symptoms].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/symptoms/:symptomId", auth, async (req, res) => {
  try {
    const targetUserId = req.user.id || req.user._id;
    const user = await User.findByIdAndUpdate(
      targetUserId,
      { $pull: { "cycleInfo.symptoms": { _id: req.params.symptomId } } },
      { new: true }
    );
    res.json(user.cycleInfo.symptoms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/symptoms/:symptomId", auth, async (req, res) => {
  try {
    const { date, tags, notes, intensity } = req.body;
    const targetUserId = req.user.id || req.user._id;

    const user = await User.findOneAndUpdate(
      { _id: targetUserId, "cycleInfo.symptoms._id": req.params.symptomId },
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
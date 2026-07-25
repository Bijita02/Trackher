require("dotenv").config();
console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Key Found!" : "Key MISSING!");
console.log("Checking JWT Secret:", process.env.JWT_SECRET ? "Secret Found!" : "Secret MISSING!");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const User = require("./models/User");
const symptomsRoute = require("./Routes/SymptomsRoute");
const AiChatRoute = require("./Routes/AiChatRoute");
const statusRoutes = require("./Routes/statusRoutes");
const weightRoute = require("./Routes/WeightRoute");
const cravingsRoute = require("./Routes/Cravingsroute");
const pregnancyReminderRoute = require("./Routes/Pregnancyreminderroute");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.slice(7).trim();

  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      const message = err.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid token";
      return res.status(401).json({ error: message });
    }

    req.user = decoded;
    next();
  });
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOTAL_PREGNANCY_DAYS = 280;

function computeEndDate(startDate, periodLength) {
  const end = new Date(startDate);
  end.setDate(end.getDate() + (periodLength || 5) - 1);
  return end;
}

async function syncLatestPeriod(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const sorted = [...user.cycleInfo.history].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const latest = sorted[0];

  user.cycleInfo.lastPeriod = latest ? latest.date : null;
  if (latest?.periodLength) user.cycleInfo.periodLength = latest.periodLength;

  await user.save();
  return user;
}

app.get("/", (req, res) => {
  res.send("Backend server is running");
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, birthdate } = req.body;
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, birthdate });
    await user.save();

    const userIdString = user._id.toString();

    const token = jwt.sign(
      { id: userIdString, _id: userIdString },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Account created securely!",
      token,
      userId: userIdString,
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const userIdString = user._id.toString();

    const token = jwt.sign(
      { id: userIdString, _id: userIdString },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", token, userId: userIdString });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: "A valid email is required." });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with that email." });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.post("/api/user-cycle", authenticateToken, async (req, res) => {
  try {
    const { lastPeriod, periodEnd, cycleLength, periodLength } = req.body;
    const targetUserId = req.user.id || req.user._id;

    const parsedCycleLength = cycleLength ? Number(cycleLength) : undefined;
    const parsedPeriodLength = periodLength ? Number(periodLength) : undefined;

    const startDate = new Date(lastPeriod);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid lastPeriod date" });
    }

    const endDate = periodEnd
      ? new Date(periodEnd)
      : computeEndDate(startDate, parsedPeriodLength);

    if (Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid periodEnd date" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      {
        $set: {
          "cycleInfo.lastPeriod": startDate,
          "cycleInfo.cycleLength": parsedCycleLength,
          "cycleInfo.periodLength": parsedPeriodLength,
        },
        $push: {
          "cycleInfo.history": {
            date: startDate,
            endDate,
            cycleLength: parsedCycleLength,
            periodLength: parsedPeriodLength,
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User matching this token footprint not found" });
    }

    res.json({
      message: "Cycle updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Cycle update error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/user-cycle/:entryId", authenticateToken, async (req, res) => {
  try {
    const { lastPeriod, periodEnd, periodLength } = req.body;
    const targetUserId = req.user.id || req.user._id;

    if (!lastPeriod) {
      return res.status(400).json({ error: "lastPeriod is required" });
    }

    const startDate = new Date(lastPeriod);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid lastPeriod date" });
    }

    const parsedPeriodLength = periodLength ? Number(periodLength) : undefined;
    const endDate = periodEnd
      ? new Date(periodEnd)
      : computeEndDate(startDate, parsedPeriodLength);

    if (Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid periodEnd date" });
    }
    if (endDate < startDate) {
      return res.status(400).json({ error: "End date can't be before start date" });
    }

    const updated = await User.findOneAndUpdate(
      { _id: targetUserId, "cycleInfo.history._id": req.params.entryId },
      {
        $set: {
          "cycleInfo.history.$.date": startDate,
          "cycleInfo.history.$.endDate": endDate,
          ...(parsedPeriodLength && { "cycleInfo.history.$.periodLength": parsedPeriodLength }),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Period entry not found" });
    }

    const synced = await syncLatestPeriod(targetUserId);
    res.json(synced);
  } catch (err) {
    console.error("Cycle entry update error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/user-cycle/:entryId", authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.user.id || req.user._id;

    const exists = await User.findOne({
      _id: targetUserId,
      "cycleInfo.history._id": req.params.entryId,
    });
    if (!exists) {
      return res.status(404).json({ error: "Period entry not found" });
    }

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { "cycleInfo.history": { _id: req.params.entryId } },
    });

    const synced = await syncLatestPeriod(targetUserId);
    res.json(synced);
  } catch (err) {
    console.error("Cycle entry delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/pregnancy-info", authenticateToken, async (req, res) => {
  try {
    const { dueDate, lastPeriod } = req.body;

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
      req.user.id || req.user._id,
      {
        pregnancyInfo: {
          dueDate: resolvedDueDate,
          lastPeriod: lastPeriod ? new Date(lastPeriod) : undefined,
          startDate: new Date(),
        },
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Pregnancy info error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/pregnancy-info", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      { $set: { pregnancyInfo: null } },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Delete pregnancy info error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Fetch user error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use("/api/status", statusRoutes);
app.use("/api/symptoms", symptomsRoute);
app.use("/api/ai", AiChatRoute);
app.use("/api/weight", weightRoute);
app.use("/api/cravings", cravingsRoute);
app.use("/api/pregnancy-reminders", pregnancyReminderRoute);
stautu
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
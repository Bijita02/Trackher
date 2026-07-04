require("dotenv").config();
console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Key Found!" : "Key MISSING!");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("./models/User");
const symptomsRoute = require("./routes/SymptomsRoute"); 
const AiChatRoute = require("./routes/AiChatRoute");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

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
    res.status(201).json({ message: "Account created securely!" });
  } catch (err) {
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
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/user-cycle", async (req, res) => {
  try {
    const { userId, lastPeriod, cycleLength, periodLength } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID missing" });
    }

    const updatedUser = await mongoose.connection.collection("users").findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      {
        $set: {
          "cycleInfo.lastPeriod": new Date(lastPeriod),
          "cycleInfo.cycleLength": Number(cycleLength),
          "cycleInfo.periodLength": Number(periodLength),
        },

        $push: {
          "cycleInfo.history": {
            date: new Date(lastPeriod),
          },
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!updatedUser.value) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Cycle updated successfully",
      user: updatedUser.value,
    });

  } catch (err) {
    console.error("Cycle update error:", err);
    res.status(500).json({ error: err.message });
  }
});

function verifyToken(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    const err = new Error("No token");
    err.status = 401;
    throw err;
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    const err = new Error("Invalid token");
    err.status = 401;
    throw err;
  }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOTAL_PREGNANCY_DAYS = 280; 

app.post("/api/pregnancy-info", async (req, res) => {
  try {
    const decoded = verifyToken(req);
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
      decoded.id,
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
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.delete("/api/pregnancy-info", async (req, res) => {
  try {
    const decoded = verifyToken(req);

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { $set: { pregnancyInfo: null } },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/api/symptoms", symptomsRoute); 

app.use("/api/ai", AiChatRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
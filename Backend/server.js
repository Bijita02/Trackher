require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator=require("validator");
const User = require("./models/User");

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

    const user = new User({
      name,
      email,
      password: hashedPassword,
      birthdate
    });

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

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
     return res.status(401).json({ error: "Invalid password" });
    } else {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ message: "Login successful", token, userId: user._id, });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/user-cycle", async (req, res) => {
  try {
    const { userId, lastPeriod, cycleLength, periodLength } = req.body;
    console.log("Received:", req.body);

    
    const result = await mongoose.connection.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      {
        $set: {
          "cycleInfo.lastPeriod": new Date(lastPeriod),
          "cycleInfo.cycleLength": Number(cycleLength),
          "cycleInfo.periodLength": Number(periodLength),
        },
      }
    );

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await mongoose.connection.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(userId),
    });

    console.log("Updated user:", JSON.stringify(updatedUser));

    res.json({ message: "Cycle info saved!", user: updatedUser });

  } catch (err) {
    console.error("Save error:", err.message);
    res.status(500).json({ error: err.message });
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
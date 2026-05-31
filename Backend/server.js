require('dotenv').config(); 
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt=require("bcrypt");
const app = express();


app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
   ssl: {
    rejectUnauthorized: false
  }
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("Connected to TiDB Cloud");
  }
});


app.get("/", (req, res) => {
  res.send("Backend server is running");
});


app.get("/users", (req, res) => {
  const sql = "SELECT * FROM users";
  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.json(result);
    }
  });
});


app.post("/api/register", async (req, res) => {
  const { name, email, password, birthdate } = req.body;

  if (!name || !email || !password || !birthdate) {
    return res.status(400).json({ error: "All registration fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name, email, password, birthdate) VALUES (?, ?, ?, ?)";

    db.query(sql, [name, email, hashedPassword, birthdate], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "This email is already registered" });
        }

        console.log("Register Error:", err);
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ message: "Account created securely!" });
    });

  } catch (error) {
    res.status(500).json({ error: "Password hashing failed" });
  }
});


app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({ message: "Login successful" });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
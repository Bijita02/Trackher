require('dotenv').config(); 
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

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


app.post("/api/register", (req, res) => {
  const { name, email, password, birthdate } = req.body;

  if (!name || !email || !password || !birthdate) {
    return res.status(400).json({ error: "All registration fields are required." });
  }

  const sql = "INSERT INTO users (name, email, password, birthdate) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, email, password, birthdate], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "This email address is already registered." });
      }
      return res.status(500).json({ error: "Database registration failure." });
    }
    res.status(201).json({ message: "Account created cleanly!" });
  });
});


app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required fields." });
  }

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error during login check." });

    if (results.length > 0) {
      res.json({ message: "Login approved! Access granted." });
    } else {
      res.status(401).json({ error: "Invalid email address or password credentials." });
    }
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
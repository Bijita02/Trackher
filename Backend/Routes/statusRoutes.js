const express = require("express");
const router = express.Router();
const Status = require("../models/Status"); 
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Helper to safely verify the authorization token from incoming headers
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("No token provided");
    err.status = 401;
    throw err;
  }
  const token = authHeader.slice(7).trim();
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (jwtErr) {
    const err = new Error("Invalid token session");
    err.status = 401;
    throw err;
  }
}

// ==========================================================
// 1. GET ALL STATUS POSTS (Matches frontend /api/status/feed)
// ==========================================================
router.get("/feed", async (req, res) => {
  try {
    const statuses = await Status.find().sort({ createdAt: -1 });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================
// 2. CREATE STATUS POST (Maps text fields directly to your schema keys)
// ==========================================================
router.post("/add", async (req, res) => {
  try {
    // 1. Resolve authentication to extract a verified fallback user context
    let authenticatedUserId = null;
    try {
      const decoded = verifyToken(req);
      authenticatedUserId = decoded.id || decoded._id;
    } catch (tokenErr) {
      // Fallback if token check is lax on addition, but we prefer using req.body.userId if provided
    }

    const { userId, username, vibeBadge, statusText, content } = req.body;

    // 2. Map payload dynamically to fulfill the validation requirements
    const targetUser = authenticatedUserId || userId;
    const finalContent = statusText || content;
    const finalUserName = username || "Meejala";

    // 3. Prevent empty payloads before hits schema validation
    if (!finalContent || finalContent.trim() === "") {
      return res.status(400).json({ error: "Status content cannot be empty" });
    }
    if (!targetUser) {
      return res.status(400).json({ error: "User context identification is required" });
    }

    // 4. Construct the model instance matching your schema rules perfectly
    const newStatus = new Status({
      user: targetUser,          // Required schema path 'user'
      userName: finalUserName,   // Required schema path 'userName'
      content: finalContent.trim(), // Required schema path 'content'
      vibeBadge: vibeBadge || { emoji: "✨", text: "Vibing" },
      likes: [],
      comments: []
    });

    await newStatus.save();
    res.status(201).json(newStatus);
  } catch (err) {
    console.error("Validation breakdown on save:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ==========================================================
// 3. LIKE / UNLIKE A POST
// ==========================================================
router.post("/:id/like", async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const targetUserId = decoded.id || decoded._id;
    
    const post = await Status.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Status not found" });

    const hasLiked = post.likes.includes(targetUserId);
    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== targetUserId);
    } else {
      post.likes.push(targetUserId);
    }

    await post.save();
    res.json({ message: hasLiked ? "Unliked" : "Liked", likes: post.likes });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ==========================================================
// 4. COMMENT / REPLY ON A POST
// ==========================================================
router.post("/:id/comment", async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const targetUserId = decoded.id || decoded._id;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text cannot be empty" });
    }

    const post = await Status.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Status not found" });

    const commenterProfile = await User.findById(targetUserId);
    const activeDisplayName = commenterProfile ? commenterProfile.name : "Friend";

    const newComment = {
      user: targetUserId,
      userName: activeDisplayName,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    res.json({ message: "Comment saved successfully", comments: post.comments });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
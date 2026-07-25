const express = require("express");
const router = express.Router();
const Status = require("../models/Status"); 
const User = require("../models/User");
const jwt = require("jsonwebtoken");


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


router.get("/feed", async (req, res) => {
  try {
    const statuses = await Status.find().sort({ createdAt: -1 });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/add", async (req, res) => {
  try {
    let authenticatedUserId = null;
    try {
      const decoded = verifyToken(req);
      authenticatedUserId = decoded.id || decoded._id;
    } catch (tokenErr) {
      
    }

    const { userId, userName, username, vibeBadge, statusText, content } = req.body;

    const targetUser = authenticatedUserId || userId;
    const finalContent = statusText || content;

    if (!finalContent || finalContent.trim() === "") {
      return res.status(400).json({ error: "Status content cannot be empty" });
    }
    if (!targetUser) {
      return res.status(400).json({ error: "User context identification is required" });
    }

  
    const userProfile = await User.findById(targetUser);
    const activeDisplayName =
      (userProfile && (userProfile.name || userProfile.userName || userProfile.username)) ||
      userName ||
      username ||
      "Friend";

    const newStatus = new Status({
      user: targetUser,          
      userName: activeDisplayName, // Dynamically set to real user name
      content: finalContent.trim(), 
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

router.post("/:id/like", async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const targetUserId = decoded.id || decoded._id;
    
    const post = await Status.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Status not found" });

    const hasLiked = post.likes.includes(targetUserId);
    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== targetUserId.toString());
    } else {
      post.likes.push(targetUserId);
    }

    await post.save();
    res.json({ message: hasLiked ? "Unliked" : "Liked", likes: post.likes });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});


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
    const activeDisplayName =
      (commenterProfile && (commenterProfile.name || commenterProfile.userName || commenterProfile.username)) ||
      "Friend";

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


router.delete("/:id", async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const targetUserId = decoded.id || decoded._id;

    const post = await Status.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Status not found" });
    }

    if (post.user.toString() !== targetUserId.toString()) {
      return res.status(403).json({ error: "Unauthorized to delete this status" });
    }

    await Status.findByIdAndDelete(req.params.id);
    res.json({ message: "Status deleted successfully", deletedId: req.params.id });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
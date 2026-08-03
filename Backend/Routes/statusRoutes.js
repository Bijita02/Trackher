const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Inline Notification Schema & Model
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  targetStatusId: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

// Status Schema & Model
const statusSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  vibeBadge: {
    emoji: String,
    label: String,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      userName: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Status = mongoose.models.Status || mongoose.model("Status", statusSchema);

// Helper Token Verification Middleware
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
    const err = new Error("Invalid or expired token");
    err.status = 401;
    throw err;
  }
}

// ==========================================
// 1. GET STATUS FEED
// ==========================================
router.get(["/", "/feed"], async (req, res) => {
  try {
    const statuses = await Status.find().sort({ createdAt: -1 });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. CREATE A STATUS POST
// ==========================================
router.post(["/", "/add"], async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const userId = decoded.id || decoded._id;
    const { content, text, userName, username, vibeBadge } = req.body;

    const rawContent = content || text;
    const finalContent = rawContent && rawContent.trim() !== "" 
      ? rawContent 
      : (vibeBadge?.label ? `Feeling ${vibeBadge.label}` : (vibeBadge?.emoji || "Shared a vibe update"));

    const finalUserName = userName || username || decoded.name || decoded.userName || "Anonymous";

    const newStatus = new Status({
      user: userId,
      userName: finalUserName,
      content: finalContent,
      vibeBadge,
    });

    await newStatus.save();
    res.status(201).json(newStatus);
  } catch (err) {
    console.error("Create status error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ==========================================
// 3. LIKE / UNLIKE A STATUS
// ==========================================
router.post("/:id/like", async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const userId = decoded.id || decoded._id;

    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ error: "Status post not found" });

    const likedIndex = status.likes.findIndex((id) => String(id) === String(userId));

    if (likedIndex > -1) {
      status.likes.splice(likedIndex, 1);
    } else {
      status.likes.push(userId);

      if (String(status.user) !== String(userId)) {
        await Notification.create({
          recipient: status.user,
          sender: userId,
          message: `Someone liked your status!`,
          targetStatusId: status._id,
        });
      }
    }

    await status.save();
    res.json(status);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ==========================================
// 4. ADD A COMMENT
// ==========================================
const handleAddComment = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const userId = decoded.id || decoded._id;
    const { text, userName, username } = req.body;

    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ error: "Status post not found" });

    // Extracts username from body, token, or falls back gracefully
    const finalUserName = userName || username || decoded.name || decoded.userName || "Someone";

    const newComment = {
      user: userId,
      userName: finalUserName,
      text,
      createdAt: new Date(),
    };

    status.comments.push(newComment);
    await status.save();

    if (String(status.user) !== String(userId)) {
      await Notification.create({
        recipient: status.user,
        sender: userId,
        message: `${finalUserName} commented on your status.`,
        targetStatusId: status._id,
      });
    }

    res.json(status);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

router.post("/:id/comment", handleAddComment);
router.post("/:id/comments", handleAddComment);

// ==========================================
// 5. DELETE A COMMENT
// ==========================================
router.delete("/:statusId/comments/:commentId", async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const userId = decoded.id || decoded._id;

    const status = await Status.findById(req.params.statusId);
    if (!status) return res.status(404).json({ error: "Status post not found" });

    const comment = status.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const isCommentAuthor = String(comment.user) === String(userId);
    const isStatusOwner = String(status.user) === String(userId);

    if (!isCommentAuthor && !isStatusOwner) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    status.comments.pull(req.params.commentId);
    await status.save();

    res.json({ message: "Comment deleted successfully", status });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ==========================================
// 6. DELETE A STATUS POST
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const userId = decoded.id || decoded._id;

    const status = await Status.findById(req.params.id);
    if (!status) return res.status(404).json({ error: "Status post not found" });

    if (String(status.user) !== String(userId)) {
      return res.status(403).json({ error: "Not authorized to delete this status" });
    }

    await Status.findByIdAndDelete(req.params.id);
    res.json({ message: "Status deleted successfully" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
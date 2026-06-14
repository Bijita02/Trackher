// routes/AiChatRoute.js
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with the API key from your backend .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// This handles: POST http://localhost:5000/api/chat
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // 🚀 THE FIX: Switched to 'gemini-2.0-flash' since the 1.5 series is deprecated
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "You are Luna, a warm, helpful, and deeply knowledgeable AI assistant for a cycle tracking app named TrackHer.",
    });

    const result = await model.generateContent(message);
    const text = result.response.text();

    // Sends the clean reply payload back to your React client
    res.json({ reply: text });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Trackher is having trouble connecting to her brain right now." });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateWithRetry(model, prompt, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      lastError = error;

      console.log(`Attempt ${attempt} failed`);

      if (error.status === 503 && attempt < maxRetries) {
        const delay = attempt * 2000;

        console.log(
          `Gemini busy. Retrying in ${delay / 1000} seconds...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );

        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message text is required",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        "You are Luna, a warm, helpful, and deeply knowledgeable AI assistant for a cycle tracking app named TrackHer.",
    });

    const result = await generateWithRetry(model, message);

    const reply = result.response.text();

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    if (error.status === 503) {
      return res.status(503).json({
        success: false,
        error:
          "Luna is currently busy. Please try again in a few moments.",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error:
          "Too many requests. Please wait a moment and try again.",
      });
    }

    res.status(500).json({
      success: false,
      error:
        "TrackHer is having trouble connecting to Luna right now.",
    });
  }
});

module.exports = router;
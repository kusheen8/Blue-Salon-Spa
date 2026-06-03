import express from "express";
import multer from "multer";
import { getAIResponse } from "../services/aiService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/chat
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const message = req.body.message;
const sessionId = req.body.sessionId;
const image = req.file;
console.log("Image received:", image?.originalname);

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    let finalMessage = message;

if (image) {
  finalMessage = `
User uploaded a hair image.

User question:
${message}

Please give professional haircare advice,
hairstyle suggestions,
hair fall treatment tips,
scalp analysis assumptions,
and salon recommendations naturally.
`;
}


const response = await getAIResponse(
  sessionId || "web-user",
  finalMessage,
  "chat"
);

    res.json({
      success: true,
      reply: response.message,
      sessionId: response.sessionId,
    });

  } catch (error) {
    console.error("Chat API Error:", error);

    res.status(500).json({
      success: false,
      error: "AI assistant failed",
    });
  }
});

export default router;
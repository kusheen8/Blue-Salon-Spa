import express from "express";
import multer from "multer";
import { getAIResponse, checkBookingIntent } from "../services/aiService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/chat
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const message = req.body.message;
    const sessionId = req.body.sessionId;
    const image = req.file;
    const isAuthenticated = req.body.isAuthenticated === "true";
    console.log("Image received:", image?.originalname, "isAuthenticated:", isAuthenticated);

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const isBookingRequest = await checkBookingIntent(message);
    if (isBookingRequest) {
      if (!isAuthenticated) {
        return res.json({
          success: true,
          action: "AUTH_REQUIRED",
          message: "I'd be happy to help you book an appointment. Please sign up or log in first to continue.",
          buttons: [
            {
              "label": "Sign Up",
              "action": "SIGNUP"
            },
            {
              "label": "Login",
              "action": "LOGIN"
            }
          ]
        });
      } else {
        return res.json({
          success: true,
          action: "BOOKING_REDIRECT",
          message: "I can help you with that. To book your appointment, please use our booking form.",
          buttons: [
            {
              "label": "Book Appointment",
              "action": "BOOK_APPOINTMENT"
            }
          ]
        });
      }
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
/**
 * WhatsApp Routes — Twilio WhatsApp API
 * Goodness Glamour AI Messaging Assistant
 */
import express from 'express';
import twilio from 'twilio';
import { getAIResponse, needsHumanHandoff, SALON_KNOWLEDGE } from '../services/aiService.js';

const router = express.Router();
const MessagingResponse = twilio.twiml.MessagingResponse;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ── POST /api/whatsapp/incoming — Twilio webhook ──────────────────────────────
router.post('/incoming', async (req, res) => {
  const { Body, From, ProfileName } = req.body;
  const sessionId = `wa_${From.replace(/[^0-9]/g, '')}`;

  console.log(`[WhatsApp] From: ${From} (${ProfileName}): "${Body}"`);

  const twiml = new MessagingResponse();

  if (needsHumanHandoff(Body)) {
    twiml.message(`Hey ${ProfileName || 'lovely'}! 💛 Our team will be with you shortly. You can also call us at ${SALON_KNOWLEDGE.phone}. We promise we're worth the wait! ✨`);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  try {
    const result = await getAIResponse(sessionId, Body, 'whatsapp');
    twiml.message(result.message);
  } catch (err) {
    twiml.message(`So sorry for the interruption! Please call us at ${SALON_KNOWLEDGE.phone} and we'll be happy to help. 💛`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// ── POST /api/whatsapp/send — Proactive outbound message ─────────────────────
router.post('/send', async (req, res, next) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'to and message required' });

    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to:   `whatsapp:${to}`,
      body: message,
    });
    res.json({ success: true, sid: msg.sid });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/whatsapp/reminder — Send appointment reminder ──────────────────
router.post('/reminder', async (req, res, next) => {
  try {
    const { to, clientName, service, dateTime, stylist } = req.body;
    const reminderMsg = `💛 Hi ${clientName}! This is a gentle reminder from ${SALON_KNOWLEDGE.name}.

✨ Your appointment is confirmed:
📋 Service: ${service}
🗓 Date & Time: ${dateTime}
💇 Stylist: ${stylist}
📍 ${SALON_KNOWLEDGE.address}

See you soon, gorgeous! Reply CONFIRM to confirm or CANCEL to cancel (24h notice appreciated). 🌸`;

    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to:   `whatsapp:${to}`,
      body: reminderMsg,
    });
    res.json({ success: true, sid: msg.sid });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/whatsapp/review-request — Post-visit review request ─────────────
router.post('/review-request', async (req, res, next) => {
  try {
    const { to, clientName, service } = req.body;
    const reviewMsg = `✨ Hi ${clientName}! It was such a pleasure having you at ${SALON_KNOWLEDGE.name} today.

We hope you're absolutely loving your ${service}! 💇‍♀️

We'd be so grateful if you'd share your experience with us. It only takes a moment and means the world to our team:
⭐ Leave a review: ${process.env.REVIEW_URL || 'https://goodnessglamour.com/review'}

Thank you for choosing us, beautiful! See you next time. 💛`;

    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to:   `whatsapp:${to}`,
      body: reviewMsg,
    });
    res.json({ success: true, sid: msg.sid });
  } catch (err) {
    next(err);
  }
});

export default router;
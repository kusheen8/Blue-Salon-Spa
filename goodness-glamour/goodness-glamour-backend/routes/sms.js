/**
 * SMS Routes — Twilio SMS API
 */
import express from "express";
import twilio from "twilio";

import {
  getAIResponse,
  needsHumanHandoff,
  SALON_KNOWLEDGE
} from "../services/aiService.js";

const router = express.Router();

const MessagingResponse = twilio.twiml.MessagingResponse;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// POST /api/sms/incoming
router.post('/incoming', async (req, res) => {
  const { Body, From } = req.body;
  const sessionId = `sms_${From.replace(/[^0-9]/g, '')}`;
  const twiml = new MessagingResponse();

  if (needsHumanHandoff(Body)) {
    twiml.message(`Hi! Our team will call you shortly. Or reach us at ${SALON_KNOWLEDGE.phone}. – Goodness Glamour 💛`);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  try {
    const result = await getAIResponse(sessionId, Body, 'sms');
    // SMS: truncate to 160 chars if needed, split intelligently
    const text = result.message.length > 320
      ? result.message.substring(0, 317) + '...'
      : result.message;
    twiml.message(text);
  } catch (err) {
    twiml.message(`Sorry for the trouble! Call us at ${SALON_KNOWLEDGE.phone}. – Goodness Glamour`);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// POST /api/sms/send
router.post('/send', async (req, res, next) => {
  try {
    const { to, message } = req.body;
    const msg = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body: message,
    });
    res.json({ success: true, sid: msg.sid });
  } catch (err) {
    next(err);
  }
});

// POST /api/sms/booking-confirmation
router.post('/booking-confirmation', async (req, res, next) => {
  try {
    const { to, clientName, service, dateTime, stylist } = req.body;
    const msg = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body: `✨ Booked! Hi ${clientName}, your ${service} with ${stylist} is confirmed for ${dateTime} at Goodness Glamour. Questions? Reply or call ${SALON_KNOWLEDGE.phone}. See you soon! 💛`,
    });
    res.json({ success: true, sid: msg.sid });
  } catch (err) {
    next(err);
  }
});

export default router;

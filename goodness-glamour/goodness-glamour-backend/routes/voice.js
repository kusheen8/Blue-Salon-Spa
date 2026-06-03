/**
 * Voice Call Routes — Twilio Integration
 * Goodness Glamour AI Phone Assistant
 */
import express from 'express';
import twilio from 'twilio';
import { getAIResponse, SALON_KNOWLEDGE } from '../services/aiService.js';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// ── Call State Store (use Redis in production) ────────────────────────────────
const callSessions = new Map();

// ── Helper: Build TwiML with Gather ──────────────────────────────────────────
function buildGatherTwiML(speechText, sessionId, isFirst = false) {
  const response = new VoiceResponse();

  // Add a pause for natural feel on first call
  if (isFirst) response.pause({ length: 1 });

  response.say({ voice: 'Polly.Joanna-Neural', language: 'en-US' }, speechText);

  const gather = response.gather({
    input:           'speech',
    action:          `/webhooks/voice/gather?sessionId=${sessionId}`,
    method:          'POST',
    speechTimeout:   'auto',
    speechModel:     'phone_call',
    enhanced:        true,
    language:        'en-US',
    timeout:         8,
  });

  gather.say({ voice: 'Polly.Joanna-Neural' }, ''); // Keep gather active

  // Fallback if no input
  response.say({ voice: 'Polly.Joanna-Neural' }, 
    "I didn't quite catch that — let me connect you with one of our stylists. Please hold just a moment.");
  response.dial(SALON_KNOWLEDGE.phone);

  return response.toString();
}

// ── POST /api/voice/incoming — Twilio calls this for incoming calls ───────────
router.post('/incoming', (req, res) => {
  const callSid   = req.body.CallSid || 'unknown';
  const sessionId = `voice_${callSid}`;

  callSessions.set(sessionId, {
    callSid,
    startTime: new Date(),
    status: 'active',
    transcript: [],
  });

  const greeting = `Welcome to ${SALON_KNOWLEDGE.name}, where beauty meets luxury. 
    My name is Aria, your personal beauty concierge. 
    I can help you book an appointment, learn about our services, or answer any questions. 
    How may I pamper you today?`;

  res.type('text/xml');
  res.send(buildGatherTwiML(greeting, sessionId, true));
});

// ── POST /api/voice/status — Call status callback ────────────────────────────
router.post('/status', (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;
  console.log(`[Voice] Call ${CallSid}: ${CallStatus} (${CallDuration}s)`);

  if (['completed', 'busy', 'no-answer', 'canceled', 'failed'].includes(CallStatus)) {
    const sessionId = `voice_${CallSid}`;
    if (callSessions.has(sessionId)) {
      const session = callSessions.get(sessionId);
      session.status   = CallStatus;
      session.duration = CallDuration;
      session.endTime  = new Date();
      // In production: save to DB, trigger follow-up SMS/email
      console.log(`[Voice] Session transcript:`, session.transcript);
    }
  }

  res.sendStatus(200);
});

// ── POST /api/voice/missed-call — Handle missed calls via SMS callback ────────
router.post('/missed-call', async (req, res) => {
  const { From } = req.body;
  if (!From) return res.sendStatus(200);

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      to:   From,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: `💛 Hi, it's Aria from ${SALON_KNOWLEDGE.name}! We missed your call and we'd love to connect. Reply here to chat, or call us back at ${SALON_KNOWLEDGE.phone}. We're here ${SALON_KNOWLEDGE.hours['Monday–Friday']} and look forward to hearing from you! ✨`,
    });
    console.log(`[Voice] Missed call callback SMS sent to ${From}`);
  } catch (err) {
    console.error('[Voice] Missed call SMS error:', err.message);
  }

  res.sendStatus(200);
});

// ── GET /api/voice/sessions — Dev/admin endpoint ──────────────────────────────
router.get('/sessions', (req, res) => {
  const sessions = Array.from(callSessions.entries()).map(([id, data]) => ({ id, ...data }));
  res.json({ sessions });
});

export default router;
// ── POST /api/voice/gather — Process caller speech ───────────────────────────
router.post('/gather', async (req, res) => {
  const speechResult = req.body.SpeechResult || '';
  const sessionId = req.query.sessionId;

  console.log('[Voice] User said:', speechResult);

  const response = new VoiceResponse();

  // No speech fallback
  if (!speechResult.trim()) {
    response.say(
      { voice: 'Polly.Joanna-Neural' },
      "I'm sorry darling, I didn't hear anything. Could you please repeat that?"
    );

    response.redirect(`/api/voice/incoming`);

    res.type('text/xml');
    return res.send(response.toString());
  }

  try {
    // Store transcript
    if (callSessions.has(sessionId)) {
      callSessions.get(sessionId).transcript.push({
        role: 'user',
        text: speechResult,
        time: new Date(),
      });
    }

    // AI RESPONSE
    const aiReply = await getAIResponse(
      sessionId,
      speechResult,
      'voice'
    );

    const replyText = aiReply.message || "I'd love to help you further.";

    // Store assistant reply
    if (callSessions.has(sessionId)) {
      callSessions.get(sessionId).transcript.push({
        role: 'assistant',
        text: replyText,
        time: new Date(),
      });
    }

    // Speak AI response
    response.say(
      {
        voice: 'Polly.Joanna-Neural',
      },
      replyText
    );

    // Continue listening
    const gather = response.gather({
      input: 'speech',
      action: `/api/voice/gather?sessionId=${sessionId}`,
      method: 'POST',
      speechTimeout: 'auto',
      enhanced: true,
      speechModel: 'phone_call',
    });

    gather.say(
      {
        voice: 'Polly.Joanna-Neural',
      },
      'Please continue.'
    );

    res.type('text/xml');
    res.send(response.toString());

  } catch (err) {
    console.error('[Voice AI Error]', err.message);

    response.say(
      { voice: 'Polly.Joanna-Neural' },
      "I'm having a little trouble right now. Let me connect you to our salon team."
    );

    response.dial(SALON_KNOWLEDGE.phone);

    res.type('text/xml');
    res.send(response.toString());
  }
});
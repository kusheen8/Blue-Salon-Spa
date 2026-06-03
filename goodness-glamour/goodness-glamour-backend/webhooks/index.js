/**
 * Twilio Webhook Routes
 */
const express = require('express');
const router  = express.Router();
const twilio  = require('twilio');
const { getAIResponse, SALON_KNOWLEDGE } = require('./services/aiService');

const VoiceResponse = twilio.twiml.VoiceResponse;

// ── POST /webhooks/voice/gather — Handles speech input during call ────────────
router.post('/voice/gather', async (req, res) => {
  const { SpeechResult, sessionId } = { ...req.body, ...req.query };
  const response = new VoiceResponse();

  if (!SpeechResult) {
    response.say({ voice: 'Polly.Joanna-Neural' }, "I'm so sorry, I didn't catch that. Could you say that again?");
    response.gather({
      input:   'speech',
      action:  `/webhooks/voice/gather?sessionId=${sessionId}`,
      method:  'POST',
      timeout: 8,
    });
    res.type('text/xml');
    return res.send(response.toString());
  }

  console.log(`[Voice Gather] Session: ${sessionId}, Input: "${SpeechResult}"`);

  try {
    const result = await getAIResponse(sessionId, SpeechResult, 'voice');
    const aiText = result.message;

    // Check for booking completion keywords
    const isBookingComplete = aiText.toLowerCase().includes('confirmed') && aiText.toLowerCase().includes('appointment');
    const isEndOfCall = ['goodbye', 'have a wonderful', 'take care', 'see you soon'].some(k => aiText.toLowerCase().includes(k));

    response.say({ voice: 'Polly.Joanna-Neural', language: 'en-US' }, aiText);

    if (isEndOfCall) {
      response.hangup();
    } else {
      response.gather({
        input:         'speech',
        action:        `/webhooks/voice/gather?sessionId=${sessionId}`,
        method:        'POST',
        speechTimeout: 'auto',
        timeout:       8,
      });
      // Prompt re-engage if silence
      response.say({ voice: 'Polly.Joanna-Neural' }, "Is there anything else I can help you with today?");
      response.gather({
        input:   'speech',
        action:  `/webhooks/voice/gather?sessionId=${sessionId}`,
        method:  'POST',
        timeout: 6,
      });
      response.say({ voice: 'Polly.Joanna-Neural' }, `Thank you for calling ${SALON_KNOWLEDGE.name}. Have a beautiful day! Goodbye.`);
      response.hangup();
    }
  } catch (err) {
    console.error('[Webhook Voice] Error:', err.message);
    response.say({ voice: 'Polly.Joanna-Neural' },
      `I'm so sorry, I'm having a little trouble right now. Please call us back at ${SALON_KNOWLEDGE.phone} and our team will be delighted to help you. Have a wonderful day!`);
    response.hangup();
  }

  res.type('text/xml');
  res.send(response.toString());
});

// ── POST /webhooks/voice/status ───────────────────────────────────────────────
router.post('/voice/status', (req, res) => {
  console.log('[Webhook Voice Status]', req.body.CallStatus, req.body.CallSid);
  res.sendStatus(200);
});

module.exports = router;

/**
 * Goodness Glamour - Core AI Service
 * Supports: Google Gemini | HuggingFace | OpenAI-compatible APIs
 */

import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
const conversationStore = new Map(); // In-memory; swap for Redis in production
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
// ── Salon Knowledge Base ──────────────────────────────────────────────────────
const SALON_KNOWLEDGE = {
  name: "Goodness Glamour",
  tagline: "Where Beauty Meets Luxury",
  address: "12 Velvet Lane, Blossom Quarter, City Centre",
  phone: process.env.SALON_PHONE || "+1-800-GLAMOUR",
  email: "hello@goodnessglamour.com",
  hours: {
    "Monday–Friday": "9:00 AM – 8:00 PM",
    "Saturday":       "8:00 AM – 9:00 PM",
    "Sunday":         "10:00 AM – 6:00 PM",
  },
  services: [
    { name: "Signature Blowout",           duration: "45 min",  price: "$65",  category: "styling"    },
    { name: "Brazilian Keratin Treatment", duration: "3 hrs",   price: "$280", category: "treatment"  },
    { name: "Balayage & Highlights",       duration: "2.5 hrs", price: "$220", category: "color"      },
    { name: "Hydra-Glow Hair Spa",         duration: "1.5 hrs", price: "$120", category: "treatment"  },
    { name: "Precision Haircut",           duration: "1 hr",    price: "$85",  category: "cut"        },
    { name: "Bridal Hair Package",         duration: "3 hrs",   price: "$350", category: "bridal"     },
    { name: "Olaplex Repair Treatment",    duration: "2 hrs",   price: "$160", category: "treatment"  },
    { name: "Scalp Detox Ritual",          duration: "1 hr",    price: "$95",  category: "treatment"  },
    { name: "Luxury Hair Gloss",           duration: "1 hr",    price: "$110", category: "color"      },
    { name: "Children's Haircut",          duration: "30 min",  price: "$45",  category: "cut"        },
  ],
  stylists: [
    { name: "Isabella Morano",  specialty: "Balayage & Color",       experience: "12 years", availability: "Tue–Sat" },
    { name: "Camille Laurent",  specialty: "Keratin & Treatments",   experience: "9 years",  availability: "Mon–Fri" },
    { name: "Ava Sinclair",     specialty: "Bridal & Updos",         experience: "15 years", availability: "Wed–Sun" },
    { name: "Nadia Osei",       specialty: "Natural & Textured Hair",experience: "8 years",  availability: "Mon–Sat" },
    { name: "Sofia Reyes",      specialty: "Precision Cuts & Style", experience: "11 years", availability: "Tue–Sun" },
  ],
  faq: {
    parking:      "Complimentary valet parking available. Street parking also available on Velvet Lane.",
    cancellation: "We request 24-hour notice for cancellations. Late cancellations may incur a 50% service fee.",
    products:     "We exclusively use Kerastase, Olaplex, and L'Oreal Professionnel products.",
    wifi:         "Complimentary high-speed WiFi available. Password provided upon arrival.",
    children:     "Children are welcome! We offer children's cuts and a special junior styling experience.",
  },
};

// ── System Prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(channel = 'chat') {
  const channelInstructions = {
    chat: "You are in a live chat widget on our website. Responses should be warm, 1–3 sentences unless detail is needed.",
    voice: "You are on a phone call. Speak naturally and conversationally. Keep sentences short. Pause naturally. Never use markdown or symbols.",
    sms: "You are responding via SMS. Be brief—max 2–3 sentences. Use plain text only, no emojis unless very subtle.",
    whatsapp: "You are responding via WhatsApp. Be friendly and slightly more expressive. Use occasional emojis. Keep replies concise.",
  };

  return `You are Aria, the exclusive AI Concierge for ${SALON_KNOWLEDGE.name} — "${SALON_KNOWLEDGE.tagline}". 

PERSONALITY: Elegant, warm, feminine, emotionally intelligent, sophisticated, and genuinely helpful. You speak like a trusted beauty advisor who happens to know everything about haircare. Never robotic. Always personal.

YOUR ROLE:
- Welcome clients and make them feel pampered from the first word
- Answer questions about services, pricing, stylists, and availability
- Guide clients through booking appointments
- Offer personalized hairstyle, color, and treatment recommendations
- Handle scheduling, reminders, and follow-ups
- Escalate to a human stylist when: client is upset, question is too specific, or they explicitly request it

SALON DETAILS:
- Name: ${SALON_KNOWLEDGE.name}
- Address: ${SALON_KNOWLEDGE.address}
- Phone: ${SALON_KNOWLEDGE.phone}
- Hours: Mon–Fri 9AM–8PM | Sat 8AM–9PM | Sun 10AM–6PM

SERVICES (highlight these naturally):
${SALON_KNOWLEDGE.services.map(s => `- ${s.name}: ${s.duration}, ${s.price}`).join('\n')}

STYLISTS:
${SALON_KNOWLEDGE.stylists.map(s => `- ${s.name}: ${s.specialty} (${s.experience})`).join('\n')}

HAIRSTYLE RECOMMENDATION RULES:
- For oval face: Any style works. Suggest versatile cuts like long layers or a lob.
- For round face: Suggest volume at crown, long layers, side parts, avoid blunt bobs.
- For square face: Soft waves, side-swept bangs, long layers to soften the jaw.
- For heart face: Chin-length bobs, side parts, waves that add width at jaw.
- For oblong face: Waves, curls, avoid very long straight styles.

BOOKING FLOW: 
1. Ask what service they're interested in
2. Ask preferred date/time
3. Ask preferred stylist (or recommend one)
4. Confirm details before finalizing
5. Ask for name and contact number
6. Confirm booking warmly

CHANNEL: ${channelInstructions[channel] || channelInstructions.chat}

IMPORTANT:
- Never make up prices or details not in your knowledge base
- If unsure, say "Let me connect you with one of our team" and offer the salon number
- Always end conversations with warmth: offer to help further, remind them of the booking, or wish them a beautiful day
- Multi-language: If client writes in another language, respond in that language naturally
`;
}

// ── Gemini API Call ───────────────────────────────────────────────────────────
async function callGemini(messages, channel) {
  const API_KEY = process.env.GEMINI_API_KEY;
  const MODEL   = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const systemPrompt = buildSystemPrompt(channel);
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.8, maxOutputTokens: 600 },
  };

  const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

// ── HuggingFace API Call ──────────────────────────────────────────────────────
async function callHuggingFace(messages, channel) {
  const API_KEY = process.env.HUGGINGFACE_API_KEY;
  const MODEL   = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  const url = `https://api-inference.huggingface.co/models/${MODEL}`;

  const systemPrompt = buildSystemPrompt(channel);
  const formatted = `<s>[INST] <<SYS>>\n${systemPrompt}\n<</SYS>>\n\n${messages.map(m => m.content).join('\n')} [/INST]`;

  const res  = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: formatted, parameters: { max_new_tokens: 400, temperature: 0.8 } }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return Array.isArray(data) ? data[0].generated_text.split('[/INST]').pop().trim() : data.generated_text;
}

async function callGroq(messages, channel) {
  const systemPrompt = buildSystemPrompt(channel);

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  return completion.choices[0].message.content;
}

// ── Main AI Router ────────────────────────────────────────────────────────────
async function getAIResponse(sessionId, userMessage, channel = 'chat') {
  // Load or create conversation history
  if (!conversationStore.has(sessionId)) {
    conversationStore.set(sessionId, []);
  }
  const history = conversationStore.get(sessionId);
  history.push({ role: 'user', content: userMessage });

  // Keep last 10 turns to manage token budget
  const recentHistory = history.slice(-10);

  let response;
  const provider = process.env.AI_PROVIDER || 'gemini';

  try {
    if (provider === 'groq') {
  response = await callGroq(recentHistory, channel);

} else if (provider === 'gemini') {
  response = await callGemini(recentHistory, channel);

} else if (provider === 'huggingface') {
  response = await callHuggingFace(recentHistory, channel);

} else {
  throw new Error(`Unknown AI provider: ${provider}`);
}
  } catch (err) {
   console.error("[FULL AI ERROR]", err);
    response = "I'm so sorry, darling — I'm having a moment! Please call us directly at " + SALON_KNOWLEDGE.phone + " and our team will take wonderful care of you. 💛";
  }

  history.push({ role: 'assistant', content: response });
  conversationStore.set(sessionId, history);

  return {
    message: response,
    sessionId,
    timestamp: new Date(),
    channel,
  };
}

// ── Detect Human Handoff Request ──────────────────────────────────────────────
function needsHumanHandoff(message) {
  const triggers = ['speak to a human', 'real person', 'manager', 'complaint', 'speak to someone', 'agent', 'upset', 'angry'];
  return triggers.some(t => message.toLowerCase().includes(t));
}

// ── Clear Session ─────────────────────────────────────────────────────────────
function clearSession(sessionId) {
  conversationStore.delete(sessionId);
}

// ── Get Conversation History ──────────────────────────────────────────────────
function getHistory(sessionId) {
  return conversationStore.get(sessionId) || [];
}

// NEW - ES Modules
export {
  getAIResponse,
  needsHumanHandoff,
  clearSession,
  getHistory,
  SALON_KNOWLEDGE,
  buildSystemPrompt,
};

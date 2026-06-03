import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import twilio from "twilio";
import cron from "node-cron";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fetch from "node-fetch";
import voiceRoutes from "./routes/voice.js";
import smsRoutes from "./routes/sms.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
import whatsappRoutes from "./routes/whatsapp.js";
import chatRoutes from "./routes/chat.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { BrevoClient } = require("@getbrevo/brevo");
import booking from "./Models/booking.js";
import fs from "fs";
import connectDB from "./config/db.js";
connectDB();
const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://goodness-glamour-4u7x.onrender.com"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options(/.*/, cors());
app.use(express.json());
app.use("/api/voice", voiceRoutes);
app.use("/api/sms", smsRoutes); app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/chat", chatRoutes);
// ─── Twilio Client ────────────────────────────────────────────────────────────
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ─── Nodemailer (Gmail) ───────────────────────────────────────────────────────
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
  requireTLS: true,
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendEmail({ to, subject, html }) {
  try {
    console.log(`📨 Attempting to send transactional email to ${to} via Brevo...`);
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: "Goodness Glamour", email: "2akonsultant@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });
    console.log("✅ Email sent successfully via Brevo API!");
  } catch (brevoError) {
    console.warn(`⚠️ Brevo failed (${brevoError.message}). Initiating Gmail SMTP failover...`);
    try {
      const info = await mailer.sendMail({
        from: `"Goodness Glamour" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log("✅ Email sent successfully via Gmail SMTP fallback!", info.response);
    } catch (gmailError) {
      console.error("❌ Both Brevo API and Gmail SMTP fallback failed!", gmailError.message);
      throw gmailError;
    }
  }
}

// ping system for uptime monitoring
app.get("/ping", (req, res) => {
  console.log("✅ UptimeRobot ping received");
  res.status(200).send("Server is awake");
});

// logging setup

const logFile = "./server.log";

const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {

  const message =
    args.join(" ");

  fs.appendFileSync(
    logFile,
    `[LOG ${new Date().toISOString()}] ${message}\n`
  );

  originalLog(...args);

};

console.error = (...args) => {

  const message =
    args.join(" ");

  fs.appendFileSync(
    logFile,
    `[ERROR ${new Date().toISOString()}] ${message}\n`
  );

  originalError(...args);

};

app.get("/download-logs", (req, res) => {

  res.download("./server.log");

});
/*const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },

  requireTLS: true,

  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },

  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,

  family: 4,
});

mailer.verify((err) => {
  if (err) console.error("❌ Gmail FAILED:", err.message);
  else console.log("✅ Gmail connected!");
});*/

// ─── In-memory stores ─────────────────────────────────────────────────────────
const otpStore = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────
/*async function sendEmail({ to, subject, html }) {

  const info = await mailer.sendMail({
    from: `"Goodness Glamour" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("✅ Email sent:", info.response);
}*/

async function sendSMS({ to, body }) {
  await twilioClient.messages.create({
    body,
    from: process.env.TWILIO_PHONE,
    to,
  });
}

async function sendWhatsApp({ to, body }) {
  await twilioClient.messages.create({
    body,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
  });
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── ROUTE 1: Send OTP ───────────────────────────────────────────────────────
app.post("/api/send-otp", async (req, res) => {
  const { phone, email, name } = req.body;
  if (!phone || !email || !name)
    return res.status(400).json({ error: "phone, email and name required" });

  const otp = generateOTP();
  otpStore[phone] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

  try {
    await sendSMS({ to: phone, body: `Your Goodness Glamour verification code is: ${otp}. Valid for 10 minutes.` });
    console.log("🚀 Attempting to send booking email...");
    await sendEmail({
      to: email,
      subject: "Your Goodness Glamour Verification Code",
      html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;">
          <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;">Goodness <span style="color:#B8956A;">Glamour</span></h1>
          <p style="color:#9A9A9A;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:0;">Premium Salon</p>
          <hr style="border:none;border-top:1px solid #E8E0D8;margin:24px 0;">
          <p style="color:#4A4A4A;">Hi <strong>${name}</strong>, welcome!</p>
          <p style="color:#4A4A4A;">Your verification code is:</p>
          <div style="background:#1C1C1C;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <span style="color:#B8956A;font-size:40px;font-weight:bold;letter-spacing:8px;">${otp}</span>
          </div>
          <p style="color:#9A9A9A;font-size:13px;">Valid for 10 minutes. Do not share with anyone.</p>
        </div>
      `,
    });
    await sendWhatsApp({ to: phone, body: `👋 Hi ${name}! Your Goodness Glamour verification code is: *${otp}*\n\nValid for 10 minutes.` });
    res.json({ success: true, message: "OTP sent via SMS, Email & WhatsApp" });
    console.log("✅ Booking email sent!");
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP", details: err.message });
  }
});


// ─── ROUTE 2: Verify OTP ─────────────────────────────────────────────────────
app.post("/api/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  const record = otpStore[phone];
  if (!record) return res.status(400).json({ error: "No OTP found for this number" });
  if (Date.now() > record.expiresAt) {
    delete otpStore[phone];
    return res.status(400).json({ error: "OTP expired. Please request a new one." });
  }
  if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
  delete otpStore[phone];
  res.json({ success: true, message: "Phone verified successfully" });
});

// ─── ROUTE 3: Booking Confirmation ───────────────────────────────────────────
app.post("/api/booking-confirm", async (req, res) => {
  const { name, email, phone, service, date, time, stylist, price } = req.body;
  await booking.create({ name, email, phone, service, date, time, stylist, price, oneHourReminderSent: false, fifteenMinReminderSent: false, source: "manual" });

  const msg = `✅ Booking Confirmed!\n\nService: ${service}\nDate: ${date}\nTime: ${time}\nStylist: ${stylist}\nTotal: ₹${price}\n\nSee you soon! 💇‍♀️`;

  try {

    // EMAIL
    try {
      await sendEmail({
        to: email,
        subject: `✅ Booking Confirmed — ${service} at Goodness Glamour`,
        html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;border:1px solid rgba(212,165,116,0.15);">
  <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;text-align:center;font-weight:normal;font-family:'Playfair Display',serif;">
    Goodness <span style="color:#B8956A;">Glamour</span>
  </h1>

  <p style="color:#9A9A9A;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-top:0;margin-bottom:24px;">
    Premium Salon
  </p>

  <div style="background:#1C1C1C;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
    <p style="color:#D4A574;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;font-weight:600;">
      Booking Confirmed
    </p>

    <h2 style="color:white;font-size:20px;margin:0;font-weight:normal;">
      Appointment Confirmed 🎉
    </h2>
  </div>

  <p style="color:#4A4A4A;font-size:15px;line-height:1.6;">
    Hi <strong>${name}</strong>, your appointment is confirmed!
  </p>

  <hr style="border:none;border-top:1px solid #E8E0D8;margin:24px 0;">

  <h3 style="color:#1C1C1C;font-size:15px;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">
    Booking Details
  </h3>

  <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
    <tr>
      <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">
        Service
      </td>
      <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">
        ${service}
      </td>
    </tr>

    <tr>
      <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">
        Date
      </td>
      <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">
        ${date}
      </td>
    </tr>

    <tr>
      <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">
        Time
      </td>
      <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">
        ${time}
      </td>
    </tr>

    <tr>
      <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">
        Stylist
      </td>
      <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">
        ${stylist}
      </td>
    </tr>

    <tr>
      <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">
        Phone
      </td>
      <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">
        ${phone}
      </td>
    </tr>

    <tr>
      <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">
        Total
      </td>
      <td style="padding:10px 0;color:#D4A574;font-weight:700;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">
        ₹${price}
      </td>
    </tr>
  </table>

  <div style="background:rgba(212,165,116,0.06);border-radius:10px;padding:15px;text-align:center;margin-bottom:28px;border:1px dashed rgba(212,165,116,0.3);">
    <p style="color:#7A7A7A;font-size:12px;margin:0;line-height:1.5;">
      📍 Bengaluru, Karnataka • 📞 063645 54220<br>
      We look forward to giving you an exceptional experience!
    </p>
  </div>

  <p style="color:#B8956A;font-weight:600;text-align:center;font-size:16px;margin:0;">
    See you very soon! 💇‍♀️
  </p>
</div>
      `,
      });
    } catch (e) {
      console.log("Email skipped:", e.message);
    }

    // SMS
    try {
      await sendSMS({ to: phone, body: msg });
    } catch (e) {
      console.log("SMS skipped:", e.message);
    }

    // WHATSAPP
    try {
      await sendWhatsApp({ to: phone, body: msg });
    } catch (e) {
      console.log("WhatsApp skipped:", e.message);
    }

    res.json({
      success: true,
      message: "Booking confirmation processed!",
    });

  } catch (err) {

    console.error("Booking confirm error:", err);

    res.status(500).json({
      error: "Failed to process booking",
      details: err.message,
    });

  }
});

// ─── ROUTE 4: Thank You ───────────────────────────────────────────────────────
app.post("/api/thank-you", async (req, res) => {
  const { name, email, phone } = req.body;
  const msg = `💖 Thank you ${name} for visiting Goodness Glamour!\n\nPlease leave us a review! 🌟`;
  try {
    await sendEmail({
      to: email,
      subject: "Thank you for visiting Goodness Glamour 💖",
      html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;text-align:center;">
          <h1 style="color:#1C1C1C;font-size:28px;">Goodness <span style="color:#B8956A;">Glamour</span></h1>
          <hr style="border:none;border-top:1px solid #E8E0D8;margin:24px 0;">
          <p style="color:#4A4A4A;font-size:16px;">Hi <strong>${name}</strong>, thank you for your visit! 💖</p>
          <a href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK" style="display:inline-block;background:#B8956A;color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;margin:20px 0;">⭐ Leave a Review</a>
        </div>
      `,
    });
    try { await sendSMS({ to: phone, body: msg }); } catch (e) { console.log("SMS skipped"); }
    try { await sendWhatsApp({ to: phone, body: msg }); } catch (e) { console.log("WA skipped"); }
    res.json({ success: true });
  } catch (err) {
    console.error("Thank you error:", err);
    res.status(500).json({ error: "Failed to send thank you", details: err.message });
  }
});

// ─── ROUTE 5: Hair AI (Hugging Face) ─────────────────────────────────────────
app.post("/api/hair-ai", async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are a luxury salon AI assistant for Goodness Glamour Salon. Help users with hairstyles, haircuts, hair coloring, treatments, hair care routines, salon suggestions and styling tips. Keep replies friendly, elegant, short to medium length with emojis. Redirect unrelated questions back to hair topics.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const reply = data?.choices?.[0]?.message?.content || "✨ Sorry, I couldn't respond right now.";
    res.json({ reply });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── CRON: Reminders ─────────────────────────────────────────────────────────
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const bookings = await booking.find();
  for (const booking of bookings) {
    try {
      if (!booking.date || !booking.time) {
        continue;
      }

      const apptTime = new Date(
        `${booking.date}T${convertTo24hr(booking.time)}+05:30`
      );
      console.log(
        "[CRON] ISO Appointment:",
        apptTime.toISOString()
      );

      const diffMins = (apptTime - now) / 60000;
      console.log("=================================");
      console.log("[CRON] Checking booking:", booking.name);
      console.log("[CRON] Stored Date:", booking.date);
      console.log("[CRON] Stored Time:", booking.time);
      console.log(
        "[CRON] Current IST:",
        now.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata"
        })
      );

      console.log(
        "[CRON] Appointment IST:",
        apptTime.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata"
        })
      );
      console.log("[CRON] Difference Minutes:", diffMins);
      console.log("[CRON] Is Valid Date:", !isNaN(apptTime));

      console.log("=================================");
      // 1 HOUR REMINDER
      if (
        diffMins > 45 &&
        diffMins <= 60 &&
        !booking.oneHourReminderSent
      ) {

        console.log("ENTERED 1 HOUR REMINDER BLOCK");

        try {

          await sendEmail({
            to: booking.email,
            subject: "⏰ Reminder: Your appointment is in 1 hour!",
            html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;border:1px solid rgba(212,165,116,0.15);">
          <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;text-align:center;font-weight:normal;font-family:'Playfair Display',serif;">
            Goodness <span style="color:#B8956A;">Glamour</span>
          </h1>
          <p style="color:#9A9A9A;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-top:0;margin-bottom:24px;">
            Premium Salon
          </p>

          <div style="background:#1C1C1C;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
            <p style="color:#D4A574;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;font-weight:600;">Upcoming Appointment</p>
            <h2 style="color:white;font-size:22px;margin:0;font-weight:normal;">In 1 Hour ⏰</h2>
          </div>

          <p style="color:#4A4A4A;font-size:15px;line-height:1.6;">
            Hi <strong>${booking.name}</strong>, this is a friendly reminder that your salon session starts in <strong>1 hour</strong>. We are getting everything ready for you!
          </p>

          <hr style="border:none;border-top:1px solid #E8E0D8;margin:24px 0;">

          <h3 style="color:#1C1C1C;font-size:15px;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Appointment Details</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
            <tr>
              <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Service</td>
              <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${booking.service}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Date</td>
              <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${booking.date}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Time</td>
              <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${booking.time}</td>
            </tr>
          </table>

          <div style="background:rgba(212,165,116,0.06);border-radius:10px;padding:15px;text-align:center;margin-bottom:28px;border:1px dashed rgba(212,165,116,0.3);">
            <p style="color:#7A7A7A;font-size:12px;margin:0;line-height:1.5;">
              📍 Bengaluru, Karnataka • 📞 063645 54220<br>
              Please arrive 5 minutes prior to ensure a perfect session.
            </p>
          </div>
          <div style="background:rgba(212,165,116,0.08);border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;border:1px solid rgba(212,165,116,0.25);">
  <p style="margin:0;color:#6B6B6B;font-size:13px;line-height:1.6;">
    📅 ${booking.date}<br>
    ⏰ ${booking.time}<br><br>
    ✨ Please arrive 5 minutes early for a seamless experience.
  </p>
</div>

          <p style="color:#B8956A;font-weight:600;text-align:center;font-size:16px;margin:0;">
            See you very soon! 💇‍♀️
          </p>
        </div>
      `
          });

          booking.oneHourReminderSent = true;
          await booking.save();

          console.log("[CRON] 1 hour reminder sent");

        } catch (err) {

          console.log("EMAIL ERROR:", err);

        }
      }

      // 15 MIN REMINDER
      if (
        diffMins > 0 &&
        diffMins <= 15 &&
        !booking.fifteenMinReminderSent
      ) {

        console.log("ENTERED 15 MIN REMINDER BLOCK");

        try {

          await sendEmail({
            to: booking.email,
            subject: "⏰ Reminder: Your appointment is in 15 minutes!",
            html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;border:1px solid rgba(212,165,116,0.15);">
          <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;text-align:center;font-weight:normal;font-family:'Playfair Display',serif;">
            Goodness <span style="color:#B8956A;">Glamour</span>
          </h1>
          <p style="color:#9A9A9A;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-top:0;margin-bottom:24px;">
            Premium Salon
          </p>

          <div style="background:#1C1C1C;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
            <p style="color:#D4A574;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;font-weight:600;">Upcoming Appointment</p>
            <h2 style="color:white;font-size:22px;margin:0;font-weight:normal;">In 15 Mins ⏰</h2>
          </div>

          <p style="color:#4A4A4A;font-size:15px;line-height:1.6;">
            Hi <strong>${booking.name}</strong>, your stylist is ready! Your salon session starts in just <strong>15 minutes</strong>. We are excited to welcome you.
          </p>

          <hr style="border:none;border-top:1px solid #E8E0D8;margin:24px 0;">

          <h3 style="color:#1C1C1C;font-size:15px;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Appointment Details</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
            <tr>
              <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Service</td>
              <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${booking.service}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Date</td>
              <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${booking.date}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Time</td>
              <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${booking.time}</td>
            </tr>
          </table>

          <div style="background:rgba(212,165,116,0.06);border-radius:10px;padding:15px;text-align:center;margin-bottom:28px;border:1px dashed rgba(212,165,116,0.3);">
            <p style="color:#7A7A7A;font-size:12px;margin:0;line-height:1.5;">
              📍 Bengaluru, Karnataka • 📞 063645 54220<br>
              We look forward to giving you an exceptional experience!
            </p>
          </div>
          <div style="background:rgba(212,165,116,0.08);border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;border:1px solid rgba(212,165,116,0.25);">
  <p style="margin:0;color:#6B6B6B;font-size:13px;line-height:1.6;">
    📅 ${booking.date}<br>
    ⏰ ${booking.time}<br><br>
    ✨ Please arrive 5 minutes early for a seamless experience.
  </p>
</div>

          <p style="color:#B8956A;font-weight:600;text-align:center;font-size:16px;margin:0;">
            See you very soon! 💇‍♀️
          </p>
        </div>
      `
          });

          booking.fifteenMinReminderSent = true;
          await booking.save();

          console.log("[CRON] 15 minute reminder sent");

        } catch (err) {

          console.log("EMAIL ERROR:", err);

        }
      }
    } catch (loopErr) {
      console.error(`❌ Cron error processing booking for ${booking.name || "Unknown"}:`, loopErr.message);
    }
  }
});
function convertTo24hr(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return "12:00:00";
  try {
    const parts = timeStr.trim().split(" ");
    if (parts.length < 2) {
      const timePart = parts[0];
      if (timePart.includes(":")) {
        const [h, m] = timePart.split(":");
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
      }
      return "12:00:00";
    }
    const [time, modifier] = parts;
    if (!time.includes(":")) return "12:00:00";
    let [hours, minutes] = time.split(":");
    let hNum = parseInt(hours) || 12;
    let mStr = minutes ? String(minutes).padStart(2, "0") : "00";

    if (modifier && modifier.toUpperCase() === "PM" && hNum !== 12) hNum += 12;
    if (modifier && modifier.toUpperCase() === "AM" && hNum === 12) hNum = 0;

    return `${String(hNum).padStart(2, "0")}:${mStr}:00`;
  } catch (err) {
    console.warn("⚠️ Failed to convert 24hr time for:", timeStr, err.message);
    return "12:00:00";
  }
}

// ─── RETELL AI FRONTEND ─────────────────────────────


app.get("/api/create-web-call", async (req, res) => {

  try {

    console.log("🚀 /api/create-web-call hit");

    console.log("🔑 RETELL KEY EXISTS:",
      !!process.env.RETELL_API_KEY
    );

    const response = await fetch(
      "https://api.retellai.com/v2/create-web-call",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agent_id: "agent_9dffc356b42631d2ff98761370"
        })
      }
    );

    console.log("📡 Retell Status:", response.status);

    const data = await response.json();

    console.log("📦 Retell Response:", data);

    res.json(data);

  } catch (err) {

    console.error("❌ RETELL ROUTE ERROR:");

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

// ─── RETELL AI WEBHOOK ─────────────────────────────

const processedCalls = new Set();

app.post("/api/retell-webhook", async (req, res) => {
  console.log("🚀 Webhook received from Retell AI! Request payload body:", JSON.stringify(req.body, null, 2));

  try {
    const call = req.body.call;
    if (!call) {
      console.log("⚠️ Webhook received but no 'call' object found in payload. Exiting.");
      return res.json({ success: true });
    }

    const callId = call.call_id;
    console.log(`📞 Incoming Call ID: ${callId}. Current processed list:`, Array.from(processedCalls));

    // avoid duplicate emails
    if (processedCalls.has(callId)) {
      console.log(`⚠️ Call ID ${callId} has already been processed! Preventing duplicate email and exit.`);
      return res.json({ success: true });
    }

    const analysis = call?.call_analysis?.custom_analysis_data || {};
    const transcript = call?.transcript || "";

    const name =
      analysis["Name"] ||
      analysis["name"] ||
      analysis["Customer Name"] ||
      "Customer";

    const phone =
      analysis["Phone Number"] ||
      analysis["phone"] ||
      analysis["Phone"] ||
      analysis["phone_number"] ||
      "";

    const email =
      analysis["Gmail id"] ||
      analysis["Email"] ||
      analysis["email"] ||
      analysis["Gmail"] ||
      analysis["gmail"] ||
      "";

    const dateTime =
      analysis["Date and Time"] ||
      analysis["dateTime"] ||
      analysis["date_time"] ||
      analysis["Date Time"] ||
      "";

    const service =
      analysis["Service"] ||
      analysis["service"] ||
      "Salon Service";

    console.log("========== RETELL AI CUSTOM EXTRACTION ==========");
    console.log(`👤 Name Extracted: "${name}"`);
    console.log(`📞 Phone Extracted: "${phone}"`);
    console.log(`📧 Email Extracted: "${email}"`);
    console.log(`📅 Date/Time Extracted: "${dateTime}"`);
    console.log(`💇‍♀️ Service Extracted: "${service}"`);
    console.log(`📝 Transcript Length: ${transcript.length} characters`);

    // only continue if meaningful transcript
    if (!transcript || transcript.length < 100) {
      console.log("⚠️ Transcript too short or non-existent (<100 chars). Skipping processing.");
      return res.json({ success: true });
    }

    // detect confirmed booking
    const isBookingConfirmed = service && dateTime && phone && email;
    console.log(`🧐 Booking confirmation check: service=${!!service}, dateTime=${!!dateTime}, phone=${!!phone}, email=${!!email} ➔ Confirmed=${isBookingConfirmed}`);

    // SEND ONLY ONE EMAIL
    if (isBookingConfirmed && email) {
      console.log(`✨ Voice booking confirmed! Adding Call ID ${callId} to processed set.`);
      processedCalls.add(callId);

      let formattedDate = "";
      let formattedTime = "";

      console.log(`📅 Commencing date parsing for raw string: "${dateTime}"...`);
      try {
        if (dateTime.includes("-") && dateTime.includes(":")) {
          const parsedDate = new Date(dateTime);
          if (!isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toISOString().split("T")[0];
            formattedTime = parsedDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            });
            console.log("➔ Parsed Format 1 (YYYY-MM-DD HH:MM) successfully");
          }
        } else if (dateTime.includes(" at ")) {
          const [rawDate, rawTime] = dateTime.split(" at ");
          // strip ordinal suffixes like 29th -> 29 to make Date parsing bulletproof
          const cleanDate = rawDate.replace(/(st|nd|rd|th)/g, "");
          const currentYear = new Date().getFullYear();
          const parsedDate = new Date(`${cleanDate} ${currentYear}`);

          if (!isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toISOString().split("T")[0];
          } else {
            formattedDate = cleanDate;
          }
          formattedTime = rawTime;
          console.log(`➔ Parsed Format 2 (Date at Time). Suffix stripped: "${cleanDate}" successfully`);
        } else {
          formattedDate = dateTime;
          formattedTime = "Scheduled";
          console.log("➔ Parsed Format 3 (Generic string fallback)");
        }
      } catch (dateErr) {
        console.warn("⚠️ Date formatting threw an error. Falling back gracefully to raw values:", dateErr.message);
        formattedDate = dateTime;
        formattedTime = "Scheduled";
      }

      console.log(`💾 Saving appointment details to MongoDB...`);
      console.log({
        name,
        email,
        phone,
        service,
        date: formattedDate,
        time: formattedTime,
        source: "voice"
      });

      const newBooking = await booking.create({
        name,
        email,
        phone,
        service,
        date: formattedDate,
        time: formattedTime,
        source: "voice",
        oneHourReminderSent: false,
        fifteenMinReminderSent: false
      });

      console.log(`✅ MongoDB Booking created successfully! Document ID: ${newBooking._id}`);
      console.log(`📧 Attempting to trigger transactional email for voice booking to: ${email}...`);

      await sendEmail({

        to: email,

        subject:
          "✨ Goodness Glamour Appointment Confirmation",
        /*
        html: `
          <div style="font-family:sans-serif;padding:20px;">

            <h2>
              ✨ Appointment Confirmed
            </h2>

            <p>
              Hello ${name},
            </p>

            <p>
              Your appointment has been confirmed successfully.
            </p>

            <p>
              📅 ${dateTime}
            </p>

            <p>
              We look forward to seeing you at
              Goodness Glamour 💇‍♀️
            </p>

          </div>
        `*/
        html: `
          <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;border:1px solid rgba(212,165,116,0.15);">
            <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;text-align:center;font-weight:normal;font-family:'Playfair Display',serif;">
              Goodness <span style="color:#B8956A;">Glamour</span>
            </h1>
            <p style="color:#9A9A9A;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-top:0;margin-bottom:24px;">
              Premium Salon
            </p>

            <div style="background:#1C1C1C;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
              <p style="color:#D4A574;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;font-weight:600;">Voice Booking Confirmed</p>
              <h2 style="color:white;font-size:20px;margin:0;font-weight:normal;">Appointment Confirmed 🎉</h2>
            </div>

            <p style="color:#4A4A4A;font-size:15px;line-height:1.6;">
              Hi <strong>${name}</strong>, thank you for booking with us! Your voice call appointment is confirmed.
            </p>

            <hr style="border:none;border-top:1px solid #E8E0D8;margin:24px 0;">

            <h3 style="color:#1C1C1C;font-size:15px;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Booking Details</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
              <tr>
                <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Service</td>
                <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${service}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Date</td>
                <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${formattedDate || dateTime}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Time</td>
                <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${formattedTime || "Scheduled"}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Phone</td>
                <td style="padding:10px 0;color:#1C1C1C;font-weight:600;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">${phone}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#9A9A9A;font-size:13px;border-bottom:1px solid #E8E0D8;">Booking Source</td>
                <td style="padding:10px 0;color:#D4A574;font-weight:700;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Priya (AI Voice)</td>
              </tr>
            </table>

            <div style="background:rgba(212,165,116,0.06);border-radius:10px;padding:15px;text-align:center;margin-bottom:28px;border:1px dashed rgba(212,165,116,0.3);">
              <p style="color:#7A7A7A;font-size:12px;margin:0;line-height:1.5;">
                📍 Bengaluru, Karnataka • 📞 063645 54220<br>
                We look forward to giving you an exceptional experience!
              </p>
            </div>

            <p style="color:#B8956A;font-weight:600;text-align:center;font-size:16px;margin:0;">
              See you very soon! 💇‍♀️
            </p>
          </div>
        `
      });

      console.log("✅ Confirmation email sent");
    }

    res.json({
      success: true
    });

  } catch (err) {

    console.error("Retell webhook error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});


// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Goodness Glamour server running on port ${PORT}`);
  console.log(`📧 Gmail: ${process.env.GMAIL_USER || "❌ NOT SET"}`);
  console.log(`🔑 Pass: ${process.env.GMAIL_APP_PASS ? "✅ SET" : "❌ NOT SET"}`);
  console.log(`🤖 Groq Key: ${process.env.GROQ_API_KEY ? "✅ SET" : "❌ NOT SET"}`);
});
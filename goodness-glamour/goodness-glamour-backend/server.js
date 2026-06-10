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
import billingRoutes from "./routes/billing.js";
import Razorpay from "razorpay";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { BrevoClient } = require("@getbrevo/brevo");
import booking from "./Models/booking.js";
import User from "./Models/user.js";
import Plan from "./Models/plan.js";
import fs from "fs";
import connectDB from "./config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyToken, authorizeRoles } from "./middleware/auth.js";

connectDB().then(() => {
  seedAdminUser();
  seedPlans();
});

async function seedAdminUser() {
  try {
    const adminEmail = "kusheendhar@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("Admin@123blue", 10);
      await User.create({
        fullName: "Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        salonName: "Blue Spa & Salon",
        isActive: true,
        subscriptionStatus: "trial",
        trialCallsRemaining: 2,
        createdAt: new Date()
      });
      console.log("👥 Default Admin user seeded successfully!");
    } else {
      // Force update of role and password to guarantee it matches admin requirements
      existingAdmin.role = "admin";
      existingAdmin.password = await bcrypt.hash("Admin@123blue", 10);
      if (existingAdmin.subscriptionStatus === undefined || existingAdmin.subscriptionStatus === null) {
        existingAdmin.subscriptionStatus = "trial";
        existingAdmin.trialCallsRemaining = 2;
      }
      await existingAdmin.save();
      console.log("👥 Default Admin user updated to role: admin with seeded password successfully!");
    }
  } catch (err) {
    console.error("❌ Seeding admin user error:", err.message);
  }
}

async function seedPlans() {
  const isRazorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  let razorpay = null;
  if (isRazorpayConfigured) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  const plans = [
    { name: "Starter", price: 999, features: ["2 voice agent calls limit removed", "Email/SMS Alerts", "Basic Support"] },
    { name: "Growth", price: 2499, features: ["Everything in Starter", "Premium AI responses", "Priority Support"] },
    { name: "Premium", price: 4999, features: ["Everything in Growth", "Dedicated Stylist Scheduling", "24/7 Phone Support"] }
  ];

  for (const p of plans) {
    let existing = await Plan.findOne({ name: p.name });
    if (!existing) {
      try {
        let rpPlanId = `plan_mock_${p.name.toLowerCase()}`;
        if (isRazorpayConfigured) {
          const rpPlan = await razorpay.plans.create({
            period: "monthly",
            interval: 1,
            item: {
              name: `${p.name} Plan`,
              amount: p.price * 100, // in paise
              currency: "INR"
            }
          });
          rpPlanId = rpPlan.id;
        }
        await Plan.create({
          name: p.name,
          price: p.price,
          billingCycle: "month",
          razorpayPlanId: rpPlanId,
          features: p.features
        });
        console.log(`Plan ${p.name} seeded successfully!`);
      } catch (err) {
        console.error(`Failed to create plan ${p.name} on Razorpay:`, err.message, ". Falling back to mock.");
        await Plan.create({
          name: p.name,
          price: p.price,
          billingCycle: "month",
          razorpayPlanId: `plan_mock_${p.name.toLowerCase()}`,
          features: p.features
        });
      }
    } else if (isRazorpayConfigured && existing.razorpayPlanId.startsWith("plan_mock_")) {
      try {
        console.log(`Upgrading existing plan ${p.name} from mock to real Razorpay plan...`);
        const rpPlan = await razorpay.plans.create({
          period: "monthly",
          interval: 1,
          item: {
            name: `${p.name} Plan`,
            amount: p.price * 100,
            currency: "INR"
          }
        });
        existing.razorpayPlanId = rpPlan.id;
        await existing.save();
        console.log(`Plan ${p.name} updated with Razorpay ID: ${rpPlan.id}`);
      } catch (err) {
        console.error(`Failed to update plan ${p.name} on Razorpay:`, err.message);
      }
    }
  }
}

const app = express();
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://goodness-glamour-2.onrender.com",
    "https://blue-salon-spa.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use("/api/billing", billingRoutes);
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
      sender: { name: "Blue Spa & Salon", email: "2akonsultant@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });
    console.log("✅ Email sent successfully via Brevo API!");
  } catch (brevoError) {
    console.warn(`⚠️ Brevo failed (${brevoError.message}). Initiating Gmail SMTP failover...`);
    try {
      const info = await mailer.sendMail({
        from: `"Blue Spa & Salon" <${process.env.GMAIL_USER}>`,
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
    from: `"Blue Spa & Salon" <${process.env.GMAIL_USER}>`,
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
    await sendSMS({ to: phone, body: `Your Blue Spa & Salon verification code is: ${otp}. Valid for 10 minutes.` });
    console.log("🚀 Attempting to send booking email...");
    await sendEmail({
      to: email,
      subject: "Your Blue Spa & Salon Verification Code",
      html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;">
          <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;">Blue <span style="color:#2563EB;">Spa & Salon</span></h1>
          <p style="color:#9A9A9A;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:0;">Where beauty meets care 💙</p>
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
    await sendWhatsApp({ to: phone, body: `👋 Hi ${name}! Your Blue Spa & Salon verification code is: *${otp}*\n\nValid for 10 minutes.` });
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
app.post("/api/booking-confirm", verifyToken, async (req, res) => {
  const { name, email, phone, service, date, time, stylist, price } = req.body;

  // RBAC check: User can only create booking for themselves, unless admin
  if (req.user.role !== "admin" && req.user.email.toLowerCase() !== email.toLowerCase()) {
    return res.status(403).json({ error: "Access denied. You can only book appointments for your own account." });
  }

  await booking.create({ name, email, phone, service, date, time, stylist, price, status: "upcoming", oneHourReminderSent: false, fifteenMinReminderSent: false, source: "manual" });

  try {
    const uEmail = email ? email.toLowerCase() : "";
    if (uEmail) {
      const existingUser = await User.findOne({ email: uEmail });
      if (existingUser) {
        let updated = false;
        if (phone && (!existingUser.phone || existingUser.phone === "N/A")) {
          existingUser.phone = phone;
          updated = true;
        }
        if (name && existingUser.name === existingUser.email.split("@")[0]) {
          existingUser.name = name;
          updated = true;
        }
        if (updated) {
          await existingUser.save();
        }
      }
    }
  } catch (uErr) {
    console.error("Failed to update user in booking confirm:", uErr.message);
  }

  const msg = `✅ Booking Confirmed!\n\nService: ${service}\nDate: ${date}\nTime: ${time}\nStylist: ${stylist}\nTotal: ₹${price}\n\nSee you soon! 💇‍♀️`;

  try {

    // EMAIL
    try {
      await sendEmail({
        to: email,
        subject: `✅ Booking Confirmed — ${service} at Blue Spa & Salon`,
        html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;border:1px solid rgba(37,99,235,0.15);">
  <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;text-align:center;font-weight:normal;font-family:'Playfair Display',serif;">
    Blue <span style="color:#2563EB;">Spa & Salon</span>
  </h1>

  <p style="color:#9A9A9A;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-top:0;margin-bottom:24px;">
    Where beauty meets care 💙
  </p>

  <div style="background:#1D4ED8;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
    <p style="color:#DBEAFE;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;font-weight:600;">
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
      <td style="padding:10px 0;color:#2563EB;font-weight:700;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;">
        ₹${price}
      </td>
    </tr>
  </table>

  <div style="background:rgba(37,99,235,0.06);border-radius:10px;padding:15px;text-align:center;margin-bottom:28px;border:1px dashed rgba(37,99,235,0.3);">
    <p style="color:#7A7A7A;font-size:12px;margin:0;line-height:1.5;">
      📍 Raichandani Square, Golden Mile Rd, Kokapet, Hyderabad, Telangana 500075, India • 📞 +91 81215 00912<br>
      We look forward to giving you an exceptional experience!
    </p>
  </div>

  <p style="color:#2563EB;font-weight:600;text-align:center;font-size:16px;margin:0;">
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
  const msg = `💖 Thank you ${name} for visiting Blue Spa & Salon!\n\nPlease leave us a review! 🌟`;
  try {
    await sendEmail({
      to: email,
      subject: "Thank you for visiting Blue Spa & Salon 💖",
      html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;text-align:center;">
          <h1 style="color:#1C1C1C;font-size:28px;">Blue <span style="color:#2563EB;">Spa & Salon</span></h1>
          <hr style="border:none;border-top:1px solid #E8E0D8;margin:24px 0;">
          <p style="color:#4A4A4A;font-size:16px;">Hi <strong>${name}</strong>, thank you for your visit! 💖</p>
          <a href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK" style="display:inline-block;background:#2563EB;color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;margin:20px 0;">⭐ Leave a Review</a>
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

// ─── ROUTE 4.1: Get Bookings ─────────────────────────────────────────────────
app.get("/api/bookings", verifyToken, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(200).json([]);
    }
    // RBAC check: Only owner or admin can view history
    if (req.user.role !== "admin" && req.user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: "Access denied. You do not have permission to view these bookings." });
    }
    const bookingsList = await booking.find({ email }).sort({ createdAt: -1 });
    if (!bookingsList) {
      return res.status(200).json([]);
    }
    res.status(200).json(bookingsList);
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ error: "Failed to get bookings", details: err.message });
  }
});

// ─── ROUTE 4.2: Update Booking (Reschedule / Cancel) ─────────────────────────
app.put("/api/bookings/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const bookingDoc = await booking.findById(id);
    if (!bookingDoc) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // RBAC check: Only owner or admin can modify bookings
    if (req.user.role !== "admin" && req.user.email.toLowerCase() !== bookingDoc.email.toLowerCase()) {
      return res.status(403).json({ error: "Access denied. You do not have permission to manage this booking." });
    }

    const { status, date, time, name, phone, service, stylist, price } = req.body;
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (service !== undefined) updateData.service = service;
    if (stylist !== undefined) updateData.stylist = stylist;
    if (price !== undefined) updateData.price = price;

    const updated = await booking.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, booking: updated });
  } catch (err) {
    console.error("Update booking error:", err);
    res.status(500).json({ error: "Failed to update booking", details: err.message });
  }
});

// ─── ROUTE 4.3: Get All Bookings (Admin) ──────────────────────────────────────
app.get("/api/bookings/all", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const allBookings = await booking.find().sort({ createdAt: -1 });

    // Get local date string YYYY-MM-DD
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    // Filter out past bookings (keep only today's and future bookings)
    const activeBookings = allBookings.filter((b) => {
      if (!b.date) return false;
      return b.date >= todayStr;
    });

    res.json(activeBookings);
  } catch (err) {
    console.error("Get all bookings error:", err);
    res.status(500).json({ error: "Failed to fetch bookings", details: err.message });
  }
});

// ─── ROUTE 4.4: Register User ────────────────────────────────────────────────
app.post("/api/users", async (req, res) => {
  try {
    const { name, fullName, email, phone, password } = req.body;
    const finalName = fullName || name;
    if (!finalName || !email || !password) {
      return res.status(400).json({ error: "Full Name, email, and password are required." });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const uEmail = email.toLowerCase();

    // Check duplicate email
    const existingUser = await User.findOne({ email: uEmail });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // Validate password rules (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      fullName: finalName,
      email: uEmail,
      phone: phone || "N/A",
      password: hashedPassword,
      role: "user",
      salonName: "Blue Spa & Salon",
      isActive: true,
      createdAt: new Date()
    });

    // Sign JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "gg_super_secret_jwt_key_123!@#";
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role, fullName: newUser.fullName },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      token,
      message: "Account created successfully!",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        salonName: newUser.salonName
      }
    });
  } catch (err) {
    console.error("User registration error:", err);
    res.status(500).json({ error: "Failed to register user", details: err.message });
  }
});

// ─── ROUTE 4.4.1: Login User ──────────────────────────────────────────────────
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const uEmail = email.toLowerCase();
    const user = await User.findOne({ email: uEmail });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is disabled. Please contact support." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Sign JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "gg_super_secret_jwt_key_123!@#";
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        salonName: user.salonName
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to log in", details: err.message });
  }
});

// ─── ROUTE 4.4.2: Get User Profile ───────────────────────────────────────────
app.get("/api/users/me", verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// ─── ROUTE 4.5: Get All Users (Admin) ────────────────────────────────────────
app.get("/api/users", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const bookings = await booking.find();
    const countsMap = {};
    bookings.forEach((b) => {
      if (b.email) {
        const emailKey = b.email.toLowerCase();
        countsMap[emailKey] = (countsMap[emailKey] || 0) + 1;
      }
    });
    const result = users.map((u) => ({
      _id: u._id,
      name: u.fullName,
      email: u.email,
      phone: u.phone || "N/A",
      createdAt: u.createdAt,
      totalBookings: countsMap[u.email.toLowerCase()] || 0
    }));
    res.json(result);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users", details: err.message });
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
              content: "You are a luxury salon AI assistant for Blue Spa & Salon. Help users with hairstyles, haircuts, hair coloring, treatments, hair care routines, salon suggestions and styling tips. Keep replies friendly, elegant, short to medium length with emojis. Redirect unrelated questions back to hair topics.",
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
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;border:1px solid rgba(37,99,235,0.15);">
          <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;text-align:center;font-weight:normal;font-family:'Playfair Display',serif;">
            Blue <span style="color:#2563EB;">Spa & Salon</span>
          </h1>
          <p style="color:#9A9A9A;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-top:0;margin-bottom:24px;">
            Where beauty meets care 💙
          </p>

          <div style="background:#1D4ED8;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
            <p style="color:#DBEAFE;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;font-weight:600;">Upcoming Appointment</p>
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

          <div style="background:rgba(37,99,235,0.06);border-radius:10px;padding:15px;text-align:center;margin-bottom:28px;border:1px dashed rgba(37,99,235,0.3);">
            <p style="color:#7A7A7A;font-size:12px;margin:0;line-height:1.5;">
              📍 Raichandani Square, Golden Mile Rd, Kokapet, Hyderabad, Telangana 500075, India • 📞 +91 81215 00912<br>
              Please arrive 5 minutes prior to ensure a perfect session.
            </p>
          </div>
          <div style="background:rgba(37,99,235,0.08);border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;border:1px solid rgba(37,99,235,0.25);">
  <p style="margin:0;color:#6B6B6B;font-size:13px;line-height:1.6;">
    📅 ${booking.date}<br>
    ⏰ ${booking.time}<br><br>
    ✨ Please arrive 5 minutes early for a seamless experience.
  </p>
</div>

          <p style="color:#2563EB;font-weight:600;text-align:center;font-size:16px;margin:0;">
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
        <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;border:1px solid rgba(37,99,235,0.15);">
          <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;text-align:center;font-weight:normal;font-family:'Playfair Display',serif;">
            Blue <span style="color:#2563EB;">Spa & Salon</span>
          </h1>
          <p style="color:#9A9A9A;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-top:0;margin-bottom:24px;">
            Where beauty meets care 💙
          </p>

          <div style="background:#1D4ED8;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
            <p style="color:#DBEAFE;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;font-weight:600;">Upcoming Appointment</p>
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

          <div style="background:rgba(37,99,235,0.06);border-radius:10px;padding:15px;text-align:center;margin-bottom:28px;border:1px dashed rgba(37,99,235,0.3);">
            <p style="color:#7A7A7A;font-size:12px;margin:0;line-height:1.5;">
              📍 Raichandani Square, Golden Mile Rd, Kokapet, Hyderabad, Telangana 500075, India • 📞 +91 81215 00912<br>
              We look forward to giving you an exceptional experience!
            </p>
          </div>
          <div style="background:rgba(37,99,235,0.08);border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;border:1px solid rgba(37,99,235,0.25);">
  <p style="margin:0;color:#6B6B6B;font-size:13px;line-height:1.6;">
    📅 ${booking.date}<br>
    ⏰ ${booking.time}<br><br>
    ✨ Please arrive 5 minutes early for a seamless experience.
  </p>
</div>

          <p style="color:#2563EB;font-weight:600;text-align:center;font-size:16px;margin:0;">
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

    // Subscription & trial check
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(403).json({
        error: "Voice assistant currently unavailable. Please contact the salon directly."
      });
    }

    const isTrialValid = admin.subscriptionStatus === "trial" && admin.trialCallsRemaining > 0;
    const isActive = admin.subscriptionStatus === "active";

    if (!isActive && !isTrialValid) {
      return res.status(403).json({
        error: "Voice assistant currently unavailable. Please contact the salon directly."
      });
    }

    // Decrement trial calls if trial active
    if (admin.subscriptionStatus === "trial") {
      admin.trialCallsRemaining = admin.trialCallsRemaining - 1;
      await admin.save();
      console.log(`[RETELL] Trial call decremented. Remaining: ${admin.trialCallsRemaining}`);
    }

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
          agent_id: "agent_cbb5e144e4253eab0c77b1657b"
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
        status: "upcoming",
        source: "voice",
        oneHourReminderSent: false,
        fifteenMinReminderSent: false
      });

      try {
        const uEmail = email ? email.toLowerCase() : "";
        if (uEmail) {
          const existingUser = await User.findOne({ email: uEmail });
          if (existingUser) {
            let updated = false;
            if (phone && (!existingUser.phone || existingUser.phone === "N/A")) {
              existingUser.phone = phone;
              updated = true;
            }
            if (name && existingUser.name === existingUser.email.split("@")[0]) {
              existingUser.name = name;
              updated = true;
            }
            if (updated) {
              await existingUser.save();
            }
          }
        }
      } catch (uErr) {
        console.error("Failed to update user in retell webhook:", uErr.message);
      }

      console.log(`✅ MongoDB Booking created successfully! Document ID: ${newBooking._id}`);
      console.log(`📧 Attempting to trigger transactional email for voice booking to: ${email}...`);

      await sendEmail({

        to: email,

        subject:
          "✨ Blue Spa & Salon Appointment Confirmation",
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
              Blue Spa & Salon 💇‍♀️
            </p>

          </div>
        `*/
        html: `
          <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:40px;background:#FAF8F5;border-radius:16px;border:1px solid rgba(37,99,235,0.15);">
            <h1 style="color:#1C1C1C;font-size:28px;margin-bottom:4px;text-align:center;font-weight:normal;font-family:'Playfair Display',serif;">
              Blue <span style="color:#2563EB;">Spa & Salon</span>
            </h1>
            <p style="color:#9A9A9A;font-size:11px;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-top:0;margin-bottom:24px;">
              Where beauty meets care 💙
            </p>

            <div style="background:#1D4ED8;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
              <p style="color:#DBEAFE;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;font-weight:600;">Voice Booking Confirmed</p>
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
                <td style="padding:10px 0;color:#2563EB;font-weight:700;font-size:13px;border-bottom:1px solid #E8E0D8;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Priya (AI Voice)</td>
              </tr>
            </table>

            <div style="background:rgba(37,99,235,0.06);border-radius:10px;padding:15px;text-align:center;margin-bottom:28px;border:1px dashed rgba(37,99,235,0.3);">
              <p style="color:#7A7A7A;font-size:12px;margin:0;line-height:1.5;">
                📍 Raichandani Square, Golden Mile Rd, Kokapet, Hyderabad, Telangana 500075, India • 📞 +91 81215 00912<br>
                We look forward to giving you an exceptional experience!
              </p>
            </div>

            <p style="color:#2563EB;font-weight:600;text-align:center;font-size:16px;margin:0;">
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
  console.log(`✅ Blue Spa & Salon server running on port ${PORT}`);
  console.log(`📧 Gmail: ${process.env.GMAIL_USER || "❌ NOT SET"}`);
  console.log(`🔑 Pass: ${process.env.GMAIL_APP_PASS ? "✅ SET" : "❌ NOT SET"}`);
  console.log(`🤖 Groq Key: ${process.env.GROQ_API_KEY ? "✅ SET" : "❌ NOT SET"}`);
});

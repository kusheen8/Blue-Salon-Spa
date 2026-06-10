# 💙 Blue Spa & Salon — AI Salon Platform

> Where beauty meets care 💙

An enterprise-ready, AI-driven booking, beauty consultation, and customer notification platform built for **Blue Spa & Salon** in Kokapet, Hyderabad. The stack combines a React + Vite frontend, a Node.js + Express backend, Mongoose + MongoDB storage, and multiple AI/communication integrations (Google Gemini, Groq, HuggingFace, Twilio, and Brevo).

---

## 🚀 Key Features

### 🔐 1. Authentication & Role-Based Access Control (RBAC)
- **Email Sign Up & Log In**: Standard authentication with password validation, email format checking, and password hashing using `bcryptjs`.
- **JWT Session Persistence**: Signs a secure 24-hour JSON Web Token (JWT) on login, persisting users through page refreshes.
- **Protected Routes**: Restricts booking portals, profiles, and admin tools. Redirects guests automatically.
- **Simulated Google Authentication**: Includes a custom Google Account chooser dialog (supporting quick-test presets for Priya/Rahul and custom email inputs) linked to a dedicated `/api/users/google-login` backend route. Registers new accounts automatically on first login.
- **Seeded Administration**: Automatically seeds the system owner (`kusheendhar@gmail.com` / `Admin@123blue`) on startup, routing them to the interactive controls of the Salon Dashboard.

### 💇 2. Multi-Channel AI Concierge (Aria)
- **AI Chatbot**: A friendly and elegant salon assistant widget powered by Groq/Gemini/HuggingFace that guides clients through hairstyle consultations, service pricing, and booking.
- **Voice Agent Integration**: Connects via Twilio / Retell AI web calls to enable phone-based automated voice bookings.
- **System Instructions**: Configures custom templates for Chat, Voice, SMS, and WhatsApp channels.

### 📅 3. Real-Time Bookings & Locator
- **Online Booking**: Seamlessly book styling, colors, cuts, facials, and grooming services.
- **Kokapet Address Locator**: Integrated map visualizer that calculates distances and opens custom driving directions to our Kokapet branch:
  - *Address:* Shop No. 302, 3rd Floor, Raichandani Square, Golden Mile Rd, Kokapet, Hyderabad, Telangana 500075, India.

### ⏰ 4. Automated Reminders & Review Requests (Cron)
- **1-Hour Alert**: Outbound email reminding clients of their upcoming session.
- **15-Minute Alert**: Outbound email, SMS, and WhatsApp alerts notifying clients that their stylist is ready.
- **Post-Visit Thank You**: Proactive review triggers via email/SMS/WhatsApp with custom links pointing to our review portal (`bluespasalon.com/review`).

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, JavaScript, Custom Vanilla CSS, Lucide icons.
- **Backend**: Node.js, Express.js, nodemon.
- **Database**: MongoDB Atlas, Mongoose.
- **AI Models**: Groq (Llama-3), Google Gemini (gemini-1.5-flash), HuggingFace (Mistral-7B).
- **APIs & Communication**: Twilio (Voice webhooks, SMS, WhatsApp Business API), Brevo Transactional Email SDK, Gmail SMTP Fallback.

---

## 📂 Project Structure

```bash
blue-spa-salon/
│
├── goodness-glamour/             # Frontend React Workspace
│   ├── src/
│   │   ├── components/           # Navbar, GeminiChatSidebar, VirtualAssistantCard
│   │   ├── pages/                # HomePage, BookingPage, LoginPage, SignupPage, AdminPage
│   │   ├── App.jsx               # Routes, State Management, Session Checking
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json              # Vite Configurations & Dependencies
│   └── vite.config.js
│
└── goodness-glamour-backend/     # Backend Server Workspace
    ├── Models/                   # user.js, booking.js
    ├── config/                   # db.js (MongoDB Connection)
    ├── middleware/               # auth.js (JWT Validation & RBAC Guard)
    ├── routes/                   # sms.js, whatsapp.js, voice.js, chat.js
    ├── services/                 # aiService.js (Gemini/Groq router & prompts)
    ├── server.js                 # API Endpoints, Admin Seeds, Mail Routing
    └── package.json              # Express, mongoose, bcryptjs, jsonwebtoken, groq-sdk
```

---

## ⚙️ Environment Configuration

### Frontend (`goodness-glamour/.env`)
```env
VITE_API_URL=http://localhost:4000
VITE_HF_API_KEY=your_huggingface_inference_key
```

### Backend (`goodness-glamour-backend/.env`)
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_key

# AI Provider Keys
AI_PROVIDER=groq # 'groq' | 'gemini' | 'huggingface'
GROQ_API_KEY=your_groq_api_token
GROQ_MODEL=llama-3.1-8b-instant
GEMINI_API_KEY=your_google_gemini_key

# Transactional Email Providers
BREVO_API_KEY=your_brevo_v3_api_key
GMAIL_USER=your_gmail_address
GMAIL_APP_PASS=your_gmail_app_specific_password

# Messaging (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_purchased_number
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number
```

---

## 🏁 How to Run

### 1. Launch the Backend
```bash
cd goodness-glamour-backend
npm install
npm start # Nodemon will hot-reload on save
```

### 2. Launch the Frontend
```bash
cd goodness-glamour
npm install
npm run dev # Vite development server launches on http://localhost:5173
```

### 3. Production Build
```bash
cd goodness-glamour
npm run build
```
The compiled output is optimized and built into the `dist/` directory.

---

## 💙 Branding Specifications

- **Name:** Blue Spa & Salon
- **Tagline:** Where beauty meets care 💙
- **Category:** Beauty, Cosmetic & Personal Care
- **Address:** Shop No. 302, 3rd Floor, Raichandani Square, Golden Mile Rd, Kokapet, Hyderabad, Telangana 500075, India
- **Phone:** `+91 81215 00912`
- **Email:** `bluespasaloon@gmail.com`
- **Hours:** Daily, 10:00 AM - 9:00 PM
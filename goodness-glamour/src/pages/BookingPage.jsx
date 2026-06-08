import { useState } from "react";
const API = `${import.meta.env.VITE_API_URL}/api`;

const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return "";
  const parts = dateString.split("-"); // yyyy-mm-dd
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

const services = [
  { id: 1, name: "Haircut & Styling", price: 599, duration: "45 min", icon: "✂️" },
  { id: 2, name: "Hair Coloring", price: 1499, duration: "2 hrs", icon: "🎨" },
  { id: 3, name: "Keratin Treatment", price: 2999, duration: "3 hrs", icon: "💆" },
  { id: 4, name: "Beard Grooming", price: 399, duration: "30 min", icon: "🪒" },
  { id: 5, name: "Facial & Cleanup", price: 799, duration: "1 hr", icon: "✨" },
  { id: 6, name: "Manicure & Pedicure", price: 499, duration: "1 hr", icon: "💅" },
];

const timeSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];

const stylists = [
  { id: 1, name: "Priya Sharma", specialty: "Hair Color Specialist" },
  { id: 2, name: "Bipin Kumar", specialty: "Senior Stylist" },
  { id: 3, name: "Nadim Ali", specialty: "Grooming Expert" },
  { id: 4, name: "Lakshmi R.", specialty: "Skin & Nail Specialist" },
];

export default function BookingPage({ navigate }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({
    service: null, date: "", time: null, stylist: null, name: "", phone: "", email: ""
  });
  const [booked, setBooked] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const update = (key, val) => setSelected((prev) => ({ ...prev, [key]: val }));
  const today = new Date().toISOString().split("T")[0];

  // ── Pre-fill from logged-in user ─────────────────────────────────────────────
  useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("gg_user") || "{}");
      if (user.name) setSelected((p) => ({ ...p, name: user.name, phone: user.phone || "", email: user.email || "" }));
    } catch (_) { }
  }, []);

  const handleBook = async () => {
    setError("");
    if (!selected.name || !selected.phone || !selected.email) {
      setError("Please fill in all contact details."); return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API}/booking-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected.name,
          email: selected.email,
          phone: selected.phone,
          service: selected.service?.name,
          date: selected.date,
          time: selected.time,
          stylist: selected.stylist?.name,
          price: selected.service?.price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBooked(true);
    } catch (err) {
      setError(err.message || "Failed to confirm booking. Is backend running?");
    } finally {
      setSending(false);
    }
  };

  // ── Booking Confirmed Screen ─────────────────────────────────────────────────
  if (booked) return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8F5" }} className="px-4 py-12 sm:px-6 sm:py-20">
      <div style={{ textAlign: "center", maxWidth: "500px" }}>
        <div style={{ fontSize: "72px", marginBottom: "24px", animation: "bounce 1s infinite" }}>🎉</div>
        <h2 style={{ fontSize: "36px", fontWeight: "900", color: "#1C1C1C", marginBottom: "12px", letterSpacing: "-0.5px", fontFamily: "'Playfair Display', serif" }}>Booking Confirmed!</h2>
        <p style={{ color: "#7A7A7A", marginBottom: "8px", fontSize: "16px" }}>Your appointment has been successfully reserved.</p>
        <p style={{ fontSize: "14px", color: "#D4A574", marginBottom: "32px", fontWeight: "700" }}>📩 Confirmation sent via Email, SMS & WhatsApp!</p>
        <div style={{ background: "white", borderRadius: "16px", padding: "28px", border: "1px solid rgba(212, 165, 116, 0.3)", marginBottom: "24px", boxShadow: "0 10px 30px rgba(212, 165, 116, 0.08)" }}>
          {[
            ["Service", `${selected.service?.icon} ${selected.service?.name}`],
            ["Date", formatDateToDDMMYYYY(selected.date)],
            ["Time", selected.time],
            ["Stylist", selected.stylist?.name],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", borderBottom: "1px solid #F5F0EA", paddingBottom: "12px", marginBottom: "12px" }}>
              <span style={{ color: "#9A9A9A" }}>{k}</span>
              <span style={{ fontWeight: "700", color: "#1C1C1C" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "900", paddingTop: "12px", borderTop: "2px solid #E8E0D8" }}>
            <span>Total Amount</span>
            <span style={{ color: "#D4A574" }}>₹{selected.service?.price}</span>
          </div>
        </div>
        <div style={{ background: "#F5F0EA", borderRadius: "12px", padding: "18px", fontSize: "14px", color: "#7A7A7A", marginBottom: "32px", lineHeight: "1.6" }}>
          ⏰ You'll receive a reminder <strong>1 hour before</strong> your appointment. Please arrive 5 minutes early.
        </div>
        <button onClick={() => navigate("home")} style={{
          background: "linear-gradient(135deg, #D4A574, #B8956A)", color: "white", padding: "16px 40px",
          borderRadius: "8px", border: "none", fontWeight: "800", fontSize: "16px", cursor: "pointer",
          boxShadow: "0 8px 24px rgba(212,165,116,0.3)", transition: "all 0.3s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,165,116,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.3)"; }}>
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "#FAF8F5" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }} className="px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <span style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#D4A574", fontWeight: "800", display: "block", marginBottom: "12px" }}>Reserve Your Spot</span>
          <h1 style={{ fontSize: "42px", fontWeight: "900", color: "#1C1C1C", margin: "0", letterSpacing: "-1px", fontFamily: "'Playfair Display', serif" }}>Book Your Appointment</h1>
          <p style={{ color: "#7A7A7A", marginTop: "12px", fontSize: "16px" }}>Choose your service, date, time, and stylist</p>
        </div>

        {/* Enhanced Progress Indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "56px", gap: "12px", flexWrap: "wrap" }}>
          {["Service", "Date & Time", "Stylist", "Confirm"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "800",
                transition: "all 0.3s",
                background: step > i + 1
                  ? "rgba(212, 165, 116, 0.15)"
                  : step === i + 1
                    ? "linear-gradient(135deg, #D4A574 0%, #B8956A 100%)"
                    : "#F5F0EA",
                color: step > i + 1
                  ? "#B8956A"
                  : step === i + 1
                    ? "white"
                    : "#9A9A9A",
                border: step > i + 1
                  ? "2px solid #D4A574"
                  : step === i + 1
                    ? "none"
                    : "1px solid #E8E0D8",
                boxShadow: step === i + 1 ? "0 8px 20px rgba(212,165,116,0.35)" : "none",
              }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: "13px", fontWeight: step === i + 1 ? "800" : "600",
                color: step === i + 1 ? "#1C1C1C" : "#9A9A9A",
                display: "none",
              }} className="hidden sm:inline">
                {label}
              </span>
              {i < 3 && <div style={{
                width: "24px", height: "2px",
                background: step > i + 1 ? "#D4A574" : "#E8E0D8",
                transition: "all 0.3s", display: "none",
              }} className="hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div style={{
          background: "white",
          borderRadius: "24px",
          boxShadow: "0 16px 40px rgba(212, 165, 116, 0.08), 0 4px 16px rgba(0,0,0,0.02)",
          border: "1px solid rgba(212, 165, 116, 0.22)",
          borderTop: "5px solid #D4A574",
        }} className="p-5 sm:p-10 md:p-12">

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-[#1C1C1C] mb-6">Choose a Service</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((s) => (
                  <button key={s.id} onClick={() => update("service", s)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md
                      ${selected.service?.id === s.id ? "border-[#B8956A] bg-[#B8956A]/5" : "border-[#E8E0D8] hover:border-[#B8956A]/40"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-[#B8956A] font-semibold text-sm">₹{s.price}</span>
                    </div>
                    <div className="font-medium text-[#1C1C1C]">{s.name}</div>
                    <div className="text-xs text-[#9A9A9A] mt-1">⏱ {s.duration}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-8">
                <button onClick={() => selected.service && setStep(2)}
                  className={`px-8 py-3 rounded-full font-medium transition-all
                    ${selected.service ? "bg-[#B8956A] text-white hover:bg-[#A07850]" : "bg-[#E8E0D8] text-[#9A9A9A] cursor-not-allowed"}`}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-[#1C1C1C] mb-6">Pick Date & Time</h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#4A4A4A] mb-2">Select Date</label>
                <div className="relative">
                  {/* Custom styled display box to guarantee consistent format & color on all devices */}
                  <div className="w-full border border-[#E8E0D8] rounded-xl px-4 py-3 bg-white flex justify-between items-center cursor-pointer pointer-events-none">
                    <span className={selected.date ? "text-[#1C1C1C] font-semibold" : "text-[#9A9A9A]"}>
                      {selected.date ? formatDateToDDMMYYYY(selected.date) : "Select Date (DD/MM/YYYY)"}
                    </span>
                  </div>
                  {/* Invisible native input placed over it to trigger native calendar controls */}
                  <input
                    type="date"
                    min={today}
                    value={selected.date}
                    onChange={(e) => update("date", e.target.value)}
                    onClick={(e) => {
                      if (typeof e.target.showPicker === "function") {
                        try {
                          e.target.showPicker();
                        } catch (err) {
                          console.error("showPicker failed:", err);
                        }
                      }
                    }}
                    onFocus={(e) => {
                      if (typeof e.target.showPicker === "function") {
                        try {
                          e.target.showPicker();
                        } catch (err) {
                          console.error("showPicker failed:", err);
                        }
                      }
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A] mb-3">Select Time</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {timeSlots.map((t) => (
                    <button key={t} onClick={() => update("time", t)}
                      className={`py-3 rounded-xl text-sm font-medium border-2 transition-all
                        ${selected.time === t ? "border-[#B8956A] bg-[#B8956A] text-white" : "border-[#E8E0D8] text-[#4A4A4A] hover:border-[#B8956A]/40"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-full border border-[#E8E0D8] text-[#4A4A4A] hover:border-[#B8956A]">← Back</button>
                <button onClick={() => selected.date && selected.time && setStep(3)}
                  className={`px-8 py-3 rounded-full font-medium transition-all
                    ${selected.date && selected.time ? "bg-[#B8956A] text-white hover:bg-[#A07850]" : "bg-[#E8E0D8] text-[#9A9A9A] cursor-not-allowed"}`}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-[#1C1C1C] mb-6">Choose Your Stylist</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {stylists.map((s) => (
                  <button key={s.id} onClick={() => update("stylist", s)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md
                      ${selected.stylist?.id === s.id ? "border-[#B8956A] bg-[#B8956A]/5" : "border-[#E8E0D8] hover:border-[#B8956A]/40"}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B8956A] to-[#D4A882] flex items-center justify-center text-white font-bold text-lg mb-3">
                      {s.name[0]}
                    </div>
                    <div className="font-medium text-[#1C1C1C]">{s.name}</div>
                    <div className="text-xs text-[#B8956A] mt-1">{s.specialty}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(2)} className="px-6 py-3 rounded-full border border-[#E8E0D8] text-[#4A4A4A] hover:border-[#B8956A]">← Back</button>
                <button onClick={() => selected.stylist && setStep(4)}
                  className={`px-8 py-3 rounded-full font-medium transition-all
                    ${selected.stylist ? "bg-[#B8956A] text-white hover:bg-[#A07850]" : "bg-[#E8E0D8] text-[#9A9A9A] cursor-not-allowed"}`}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-[#1C1C1C] mb-6">Confirm Details</h2>
              <div style={{
                background: "rgba(212, 165, 116, 0.04)",
                border: "1px solid rgba(212, 165, 116, 0.2)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "24px"
              }} className="space-y-3">
                {[
                  ["Service", `${selected.service?.icon} ${selected.service?.name}`],
                  ["Price", `₹${selected.service?.price}`],
                  ["Date", formatDateToDDMMYYYY(selected.date)],
                  ["Time", selected.time],
                  ["Stylist", selected.stylist?.name],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm" style={{ borderBottom: "1px solid rgba(212, 165, 116, 0.08)", paddingBottom: "8px" }}>
                    <span className="text-[#9A9A9A]">{k}</span>
                    <span className="font-semibold text-[#1C1C1C]" style={{ color: k === "Price" ? "#D4A574" : "#1C1C1C" }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-[#4A4A4A] uppercase tracking-wider">Contact Details</h3>
                {[
                  { label: "Your Name *", key: "name", type: "text", placeholder: "Priya Sharma" },
                  { label: "Email *", key: "email", type: "email", placeholder: "you@example.com" },
                  { label: "Phone (with +91) *", key: "phone", type: "tel", placeholder: "+919876543210" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-[#4A4A4A] mb-1.5">{f.label}</label>
                    <input type={f.type} value={selected[f.key]} placeholder={f.placeholder}
                      onChange={(e) => update(f.key, e.target.value)}
                      className="w-full border border-[#E8E0D8] rounded-xl px-4 py-3 focus:outline-none focus:border-[#B8956A] transition-colors" />
                  </div>
                ))}
              </div>

              <div style={{
                background: "rgba(184, 149, 106, 0.08)",
                border: "1px solid rgba(184, 149, 106, 0.25)",
                borderRadius: "12px",
                padding: "14px 18px",
                marginBottom: "20px",
                fontSize: "14px",
                color: "#B8956A",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span>📩</span>
                <span>Confirmation will be sent via <strong>Email + SMS + WhatsApp</strong></span>
              </div>

              {error && (
                <p style={{
                  color: "#D32F2F",
                  fontSize: "14px",
                  background: "rgba(211, 47, 47, 0.06)",
                  border: "1px solid rgba(211, 47, 47, 0.2)",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  fontWeight: "500"
                }}>
                  {error}
                </p>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="px-6 py-3 rounded-full border border-[#E8E0D8] text-[#4A4A4A] hover:border-[#B8956A]">← Back</button>
                <button onClick={handleBook} disabled={sending}
                  className="bg-[#B8956A] text-white px-8 py-3 rounded-full font-medium hover:bg-[#A07850] transition-all disabled:opacity-60 flex items-center gap-2">
                  {sending
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Confirming...</>
                    : "Confirm Booking ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

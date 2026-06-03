import { useState } from "react";

const appointments = [
  { id: 1, service: "Haircut & Styling", stylist: "Bipin Kumar", date: "2026-05-10", time: "11:00 AM", status: "upcoming", price: 599 },
  { id: 2, service: "Hair Coloring", stylist: "Priya Sharma", date: "2026-04-20", time: "2:00 PM", status: "completed", price: 1499 },
  { id: 3, service: "Beard Grooming", stylist: "Nadim Ali", date: "2026-03-15", time: "4:00 PM", status: "completed", price: 399 },
];

const statusStyle = {
  upcoming: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
};

export default function DashboardPage({ navigate }) {
  const [tab, setTab] = useState("upcoming");

  const filtered = tab === "all" ? appointments : appointments.filter((a) => a.status === tab);

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "#FAF8F5" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px 64px" }}>
        {/* Header */}
        <div style={{ display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row", justifyContent: "space-between", alignItems: window.innerWidth < 768 ? "flex-start" : "center", marginBottom: "48px", gap: "24px" }}>
          <div>
            <span style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#D4A574", fontWeight: "800", display: "block", marginBottom: "8px" }}>Welcome back</span>
            <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#1C1C1C", margin: "0", letterSpacing: "-0.5px", fontFamily: "'Playfair Display', serif" }}>My Dashboard</h1>
          </div>
          <button onClick={() => navigate("booking")} style={{
            background: "linear-gradient(135deg, #D4A574, #B8956A)", color: "white", padding: "14px 32px",
            borderRadius: "8px", border: "none", fontWeight: "800", fontSize: "15px", cursor: "pointer",
            boxShadow: "0 8px 24px rgba(212,165,116,0.3)", transition: "all 0.3s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,165,116,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.3)"; }}>
            + New Booking
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "48px" }}>
          {[
            { label: "Total Appointments", value: "3", icon: "🗓️", color: "#D4A574" },
            { label: "Total Spent", value: "₹2,497", icon: "💸", color: "#E8B4A0" },
            { label: "Loyalty Points", value: "249", icon: "⭐", color: "#C49970" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "white", borderRadius: "16px", padding: "28px 24px", border: "1px solid #E8E0D8",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)", textAlign: "center", transition: "all 0.3s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,165,116,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>{s.icon}</div>
              <div style={{ fontSize: "32px", fontWeight: "900", color: "#1C1C1C", marginBottom: "8px", fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "#9A9A9A", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
          {["upcoming", "completed", "all"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "800",
              border: tab === t ? "none" : "1px solid #E8E0D8", cursor: "pointer",
              background: tab === t ? "linear-gradient(135deg, #1C1C1C, #2D2D2D)" : "white",
              color: tab === t ? "white" : "#4A4A4A", textTransform: "capitalize", transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              if (tab !== t) {
                e.currentTarget.style.borderColor = "#D4A574";
                e.currentTarget.style.background = "#FAF8F5";
              }
            }}
            onMouseLeave={e => {
              if (tab !== t) {
                e.currentTarget.style.borderColor = "#E8E0D8";
                e.currentTarget.style.background = "white";
              }
            }}>
              {t === "all" ? "All Appointments" : t}
            </button>
          ))}
        </div>

        {/* Appointments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 32px", color: "#9A9A9A" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
              <p style={{ fontSize: "16px", marginBottom: "24px" }}>No appointments found.</p>
              <button onClick={() => navigate("booking")} style={{
                color: "#D4A574", fontWeight: "800", background: "none", border: "none", cursor: "pointer",
                fontSize: "15px", textDecoration: "none", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}>
                Book one now →
              </button>
            </div>
          )}
          {filtered.map((a) => (
            <div key={a.id} style={{
              background: "white", borderRadius: "16px", padding: "28px", border: "1px solid #E8E0D8",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)", transition: "all 0.3s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.15)"; e.currentTarget.style.borderColor = "#D4A574"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#E8E0D8"; }}>
              <div style={{ display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row", alignItems: window.innerWidth < 768 ? "flex-start" : "center", justifyContent: "space-between", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "56px", height: "56px", background: "linear-gradient(135deg, #D4A574, #B8956A)",
                    borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "28px", boxShadow: "0 4px 12px rgba(212,165,116,0.2)",
                  }}>✂️</div>
                  <div>
                    <h3 style={{ fontWeight: "800", color: "#1C1C1C", margin: "0", fontSize: "16px" }}>{a.service}</h3>
                    <p style={{ fontSize: "13px", color: "#9A9A9A", margin: "6px 0 0 0", fontWeight: "600" }}>with {a.stylist}</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "24px" }}>
                  <div style={{ fontSize: "14px" }}>
                    <div style={{ fontSize: "12px", color: "#9A9A9A", fontWeight: "700", marginBottom: "4px", textTransform: "uppercase" }}>Date</div>
                    <div style={{ fontWeight: "800", color: "#1C1C1C" }}>{a.date}</div>
                  </div>
                  <div style={{ fontSize: "14px" }}>
                    <div style={{ fontSize: "12px", color: "#9A9A9A", fontWeight: "700", marginBottom: "4px", textTransform: "uppercase" }}>Time</div>
                    <div style={{ fontWeight: "800", color: "#1C1C1C" }}>{a.time}</div>
                  </div>
                  <div style={{ fontSize: "14px" }}>
                    <div style={{ fontSize: "12px", color: "#9A9A9A", fontWeight: "700", marginBottom: "4px", textTransform: "uppercase" }}>Amount</div>
                    <div style={{ fontWeight: "800", color: "#D4A574" }}>₹{a.price}</div>
                  </div>
                  <span style={{
                    fontSize: "12px", padding: "8px 16px", borderRadius: "6px", fontWeight: "800",
                    textTransform: "capitalize",
                    background: a.status === "upcoming" ? "#E3F2FD" : a.status === "completed" ? "#E8F5E9" : "#FFEBEE",
                    color: a.status === "upcoming" ? "#1976D2" : a.status === "completed" ? "#388E3C" : "#D32F2F",
                    border: `1px solid ${a.status === "upcoming" ? "#BBDEFB" : a.status === "completed" ? "#C8E6C9" : "#FFCDD2"}`,
                  }}>
                    {a.status}
                  </span>
                </div>
              </div>
              {a.status === "upcoming" && (
                <div style={{ display: "flex", gap: "24px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #F0EBE5" }}>
                  <button style={{
                    fontSize: "14px", color: "#D4A574", background: "none", border: "none", cursor: "pointer",
                    fontWeight: "800", transition: "all 0.2s", textDecoration: "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}>
                    Reschedule
                  </button>
                  <button style={{
                    fontSize: "14px", color: "#E53E3E", background: "none", border: "none", cursor: "pointer",
                    fontWeight: "800", transition: "all 0.2s", textDecoration: "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

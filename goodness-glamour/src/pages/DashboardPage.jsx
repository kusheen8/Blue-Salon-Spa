import { useState, useEffect } from "react";

const statusStyle = {
  upcoming: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
};

export default function DashboardPage({ navigate }) {
  const [tab, setTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userStr = localStorage.getItem("gg_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userEmail = user?.email || "";

  const fetchAppointments = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const API = `${import.meta.env.VITE_API_URL}/api`;
      const token = localStorage.getItem("gg_token");
      
      const res = await fetch(`${API}/bookings?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Failed to fetch appointments");
      const data = await res.json();
      setAppointments(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error loading appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [userEmail]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const API = `${import.meta.env.VITE_API_URL}/api`;
      const token = localStorage.getItem("gg_token");
      
      const res = await fetch(`${API}/bookings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Failed to cancel appointment");
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const handleReschedule = async (id, currentDate, currentTime) => {
    const newDate = window.prompt("Enter new date (YYYY-MM-DD):", currentDate);
    if (!newDate) return;
    const newTime = window.prompt("Enter new time (e.g., 11:00 AM):", currentTime);
    if (!newTime) return;

    try {
      const API = `${import.meta.env.VITE_API_URL}/api`;
      const token = localStorage.getItem("gg_token");
      
      const res = await fetch(`${API}/bookings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date: newDate, time: newTime, status: "upcoming" }),
      });
      if (!res.ok) throw new Error("Failed to reschedule appointment");
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert("Failed to reschedule appointment. Please try again.");
    }
  };

  const filtered = tab === "all" ? appointments : appointments.filter((a) => a.status === tab);

  const totalSpent = appointments
    .filter(a => a.status !== "cancelled")
    .reduce((sum, a) => {
      const p = parseFloat(String(a.price).replace(/[^0-9.]/g, "")) || 0;
      return sum + p;
    }, 0);

  const loyaltyPoints = Math.floor(totalSpent * 0.1);

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "#FAF8F5" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }} className="px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <span style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#D4A574", fontWeight: "800", display: "block", marginBottom: "8px" }}>Welcome back</span>
            <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#1C1C1C", margin: "0 0 4px 0", letterSpacing: "-0.5px", fontFamily: "'Playfair Display', serif" }}>
              {user?.fullName || "My Dashboard"}
            </h1>
            <p style={{ margin: "0", fontSize: "14px", color: "#9A9A9A", fontWeight: "500" }}>
              📧 {userEmail} | 🏢 {user?.salonName || "Blue Spa & Salon"}
            </p>
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
            { label: "Total Appointments", value: filtered.length.toString(), icon: "🗓️", color: "#D4A574" },
            { label: "Total Spent", value: `₹${totalSpent.toLocaleString()}`, icon: "💸", color: "#E8B4A0" },
            { label: "Loyalty Points", value: loyaltyPoints.toString(), icon: "⭐", color: "#C49970" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "white", borderRadius: "16px", border: "1px solid #E8E0D8",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)", textAlign: "center", transition: "all 0.3s",
            }}
              className="p-5 sm:p-7"
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
          {loading && (
            <div style={{ textAlign: "center", padding: "48px", color: "#9A9A9A", fontSize: "16px", fontWeight: "600" }}>
              Loading appointments...
            </div>
          )}
          {!loading && error && (
            <div style={{ textAlign: "center", padding: "48px", color: "#E53E3E", fontSize: "16px", fontWeight: "600" }}>
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 32px", color: "#9A9A9A" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
              <p style={{ fontSize: "16px", marginBottom: "24px" }}>No appointments found. Book your first appointment to get started.</p>
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
          {!loading && !error && filtered.map((a) => (
            <div key={a._id} style={{
              background: "white", borderRadius: "16px", border: "1px solid #E8E0D8",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)", transition: "all 0.3s",
            }}
              className="p-5 sm:p-7"
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.15)"; e.currentTarget.style.borderColor = "#D4A574"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#E8E0D8"; }}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "56px", height: "56px", background: "linear-gradient(135deg, #D4A574, #B8956A)",
                    borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "28px", boxShadow: "0 4px 12px rgba(212,165,116,0.2)",
                  }}>✂️</div>
                  <div>
                    <h3 style={{ fontWeight: "800", color: "#1C1C1C", margin: "0", fontSize: "16px" }}>{a.service}</h3>
                    <p style={{ fontSize: "13px", color: "#9A9A9A", margin: "6px 0 0 0", fontWeight: "600" }}>with {a.stylist || "Stylist"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
                    <div style={{ fontWeight: "800", color: "#D4A574" }}>₹{a.price || 0}</div>
                  </div>
                  <span style={{
                    fontSize: "12px", padding: "8px 16px", borderRadius: "6px", fontWeight: "800",
                    textTransform: "capitalize",
                    background: a.status === "upcoming" ? "#E3F2FD" : a.status === "completed" ? "#E8F5E9" : "#FFEBEE",
                    color: a.status === "upcoming" ? "#1976D2" : a.status === "completed" ? "#388E3C" : "#D32F2F",
                    border: `1px solid ${a.status === "upcoming" ? "#BBDEFB" : a.status === "completed" ? "#C8E6C9" : "#FFCDD2"}`,
                  }}>
                    {a.status || "upcoming"}
                  </span>
                </div>
              </div>
              {a.status === "upcoming" && (
                <div style={{ display: "flex", gap: "24px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #F0EBE5" }}>
                  <button onClick={() => handleReschedule(a._id, a.date, a.time)} style={{
                    fontSize: "14px", color: "#D4A574", background: "none", border: "none", cursor: "pointer",
                    fontWeight: "800", transition: "all 0.2s", textDecoration: "none",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}>
                    Reschedule
                  </button>
                  <button onClick={() => handleCancel(a._id)} style={{
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

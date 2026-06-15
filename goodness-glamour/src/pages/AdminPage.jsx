import { useState, useEffect } from "react";

const gold = "#B8956A";
const dark = "#1C1C1C";
const cream = "#FAF8F5";
const border = "#E8E0D8";
const gray = "#9A9A9A";

const initServices = [
  { id: 1, name: "Haircut & Styling", price: 599, duration: "45 min", icon: "✂️", bookings: 48 },
  { id: 2, name: "Hair Coloring", price: 1499, duration: "2 hrs", icon: "🎨", bookings: 22 },
  { id: 3, name: "Keratin Treatment", price: 2999, duration: "3 hrs", icon: "💆", bookings: 10 },
  { id: 4, name: "Beard Grooming", price: 399, duration: "30 min", icon: "🪒", bookings: 35 },
  { id: 5, name: "Facial & Cleanup", price: 799, duration: "1 hr", icon: "✨", bookings: 18 },
  { id: 6, name: "Manicure & Pedicure", price: 499, duration: "1 hr", icon: "💅", bookings: 25 },
];

const initStylists = [
  { id: 1, name: "Priya Sharma", role: "Color Specialist", phone: "9876543210", email: "priya@bluespasalon.com", clients: 38, rating: "4.9" },
  { id: 2, name: "Bipin Kumar", role: "Senior Stylist", phone: "9123456789", email: "bipin@bluespasalon.com", clients: 52, rating: "5.0" },
  { id: 3, name: "Nadim Ali", role: "Grooming Expert", phone: "9988776655", email: "nadim@bluespasalon.com", clients: 41, rating: "4.8" },
  { id: 4, name: "Lakshmi R.", role: "Skin & Nail", phone: "9876501234", email: "lakshmi@bluespasalon.com", clients: 29, rating: "4.9" },
];

const statusColor = {
  confirmed: { bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7" },
  pending:   { bg: "#FFF8E1", color: "#F57F17", border: "#FFE082" },
  cancelled: { bg: "#FFEBEE", color: "#C62828", border: "#EF9A9A" },
};

// ── Reusable Modal ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "white", borderRadius: "20px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: dark }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: gray, lineHeight: 1 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", maxHeight: "60vh" }}>{children}</div>
        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "999px", border: `1px solid ${border}`, background: "white", color: "#4A4A4A", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
            Cancel
          </button>
          <button onClick={onSave} style={{ padding: "10px 24px", borderRadius: "999px", border: "none", background: gold, color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Input ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text" }) {
  const isDate = type === "date";
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#4A4A4A", marginBottom: "6px" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={isDate ? (e) => {
          if (typeof e.target.showPicker === "function") {
            try {
              e.target.showPicker();
            } catch (err) {
              console.error("showPicker failed:", err);
            }
          }
        } : undefined}
        onFocus={isDate ? (e) => {
          if (typeof e.target.showPicker === "function") {
            try {
              e.target.showPicker();
            } catch (err) {
              console.error("showPicker failed:", err);
            }
          }
        } : undefined}
        style={{ width: "100%", border: `1px solid ${border}`, borderRadius: "10px", padding: "10px 14px", fontSize: "14px", outline: "none", boxSizing: "border-box", color: dark, cursor: isDate ? "pointer" : "text" }}
      />
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────────────────
export default function AdminPage({ navigate, onLogout }) {
  const [activeTab, setActiveTab] = useState("bookings");
  const [filter, setFilter] = useState("all");

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [errorBookings, setErrorBookings] = useState("");

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState("");

  const [voiceAnalytics, setVoiceAnalytics] = useState(null);
  const [loadingVoice, setLoadingVoice] = useState(true);

  const [services, setServices] = useState(() => {
    const local = localStorage.getItem("gg_services");
    return local ? JSON.parse(local) : initServices;
  });

  const [stylists, setStylists] = useState(() => {
    const local = localStorage.getItem("gg_stylists");
    return local ? JSON.parse(local) : initStylists;
  });

  // Modal state
  const [modal, setModal] = useState(null); // null | { type, id, isAdd }
  const [draft, setDraft] = useState({});

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const API = `${import.meta.env.VITE_API_URL}/api`;
      const token = localStorage.getItem("gg_token");
      const res = await fetch(`${API}/bookings/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.status === 401 || res.status === 403) {
        alert("Session expired or unauthorized. Please sign in again.");
        if (onLogout) onLogout();
        else navigate("login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      
      const mappedBookings = data.map((b) => ({
        id: b._id,
        client: b.name,
        phone: b.phone,
        service: b.service,
        stylist: b.stylist || "Not Assigned",
        date: b.date,
        time: b.time,
        status: b.status || "upcoming",
        price: b.price
      }));
      setBookings(mappedBookings);
      setErrorBookings("");
    } catch (err) {
      console.error(err);
      setErrorBookings("Failed to load bookings from database.");
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const API = `${import.meta.env.VITE_API_URL}/api`;
      const token = localStorage.getItem("gg_token");
      const res = await fetch(`${API}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.status === 401 || res.status === 403) {
        alert("Session expired or unauthorized. Please sign in again.");
        if (onLogout) onLogout();
        else navigate("login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
      setErrorUsers("");
    } catch (err) {
      console.error(err);
      setErrorUsers("Failed to load users from database.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchVoiceAnalytics = async () => {
    try {
      setLoadingVoice(true);
      const API = `${import.meta.env.VITE_API_URL}/api`;
      const token = localStorage.getItem("gg_token");
      const res = await fetch(`${API}/voice-analytics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.status === 401 || res.status === 403) {
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch voice analytics");
      const data = await res.json();
      setVoiceAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch voice analytics:", err);
    } finally {
      setLoadingVoice(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchUsers();
    fetchVoiceAnalytics();
  }, []);

  const openEdit = (type, item) => {
    setDraft({ ...item });
    setModal({ type, id: item.id, isAdd: false });
  };

  const openAdd = (type) => {
    setDraft({});
    setModal({ type, id: null, isAdd: true });
  };

  const closeModal = () => { setModal(null); setDraft({}); };

  const saveModal = () => {
    if (modal.type === "booking") {
      const updatedData = {
        name: draft.client,
        phone: draft.phone,
        service: draft.service,
        stylist: draft.stylist,
        date: draft.date,
        time: draft.time,
        status: draft.status,
        price: draft.price
      };
      
      const API = `${import.meta.env.VITE_API_URL}/api`;
      const token = localStorage.getItem("gg_token");
      fetch(`${API}/bookings/${modal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          alert("Session expired or unauthorized. Please sign in again.");
          if (onLogout) onLogout();
          else navigate("login");
          return;
        }
        if (!res.ok) throw new Error("Failed to update booking");
        return res.json();
      })
      .then((data) => {
        if (data) fetchBookings();
      })
      .catch(err => {
        console.error(err);
        alert("Failed to update booking");
      });
    } else if (modal.type === "service") {
      if (modal.isAdd) {
        setServices((prev) => {
          const newId = prev.length > 0 ? Math.max(...prev.map(s => s.id)) + 1 : 1;
          const newList = [...prev, { ...draft, id: newId, bookings: 0 }];
          localStorage.setItem("gg_services", JSON.stringify(newList));
          return newList;
        });
      } else {
        setServices((prev) => {
          const newList = prev.map((s) => s.id === modal.id ? { ...s, ...draft } : s);
          localStorage.setItem("gg_services", JSON.stringify(newList));
          return newList;
        });
      }
    } else if (modal.type === "stylist") {
      if (modal.isAdd) {
        setStylists((prev) => {
          const newId = prev.length > 0 ? Math.max(...prev.map(s => s.id)) + 1 : 1;
          const newList = [...prev, { ...draft, id: newId, clients: 0, rating: draft.rating || "5.0" }];
          localStorage.setItem("gg_stylists", JSON.stringify(newList));
          return newList;
        });
      } else {
        setStylists((prev) => {
          const newList = prev.map((s) => s.id === modal.id ? { ...s, ...draft } : s);
          localStorage.setItem("gg_stylists", JSON.stringify(newList));
          return newList;
        });
      }
    }
    closeModal();
  };

  const handleDeleteService = (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    setServices((prev) => {
      const newList = prev.filter((s) => s.id !== id);
      localStorage.setItem("gg_services", JSON.stringify(newList));
      return newList;
    });
  };

  const handleDeleteStylist = (id) => {
    if (!window.confirm("Are you sure you want to delete this stylist?")) return;
    setStylists((prev) => {
      const newList = prev.filter((s) => s.id !== id);
      localStorage.setItem("gg_stylists", JSON.stringify(newList));
      return newList;
    });
  };

  const updateDraft = (key, val) => setDraft((p) => ({ ...p, [key]: val }));

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  // Dynamic Stats calculations
  const todayDate = new Date().toISOString().split("T")[0];
  const todayBookingsCount = bookings.filter(b => b.date === todayDate).length;
  
  const totalRevenueVal = bookings
    .filter(b => b.status !== "cancelled")
    .reduce((sum, b) => {
      const p = parseFloat(String(b.price).replace(/[^0-9.]/g, "")) || 0;
      return sum + p;
    }, 0);

  const stats = [
    { label: "Today's Bookings", value: todayBookingsCount.toString(), icon: "📅", change: "Live count" },
    { label: "Total Revenue", value: `₹${totalRevenueVal.toLocaleString()}`, icon: "💰", change: "Non-cancelled bookings" },
    { label: "Active Clients", value: users.length.toString(), icon: "👥", change: "Registered users" },
    { label: "Avg. Rating", value: "4.9 ⭐", icon: "🌟", change: "Excellent reviews" },
  ];

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: cream }}>
      {/* ── Edit Modals ── */}
      {modal?.type === "booking" && (
        <Modal title="Edit Booking" onClose={closeModal} onSave={saveModal}>
          <Field label="Client Name" value={draft.client || ""} onChange={(v) => updateDraft("client", v)} />
          <Field label="Phone" value={draft.phone || ""} onChange={(v) => updateDraft("phone", v)} />
          <Field label="Service" value={draft.service || ""} onChange={(v) => updateDraft("service", v)} />
          <Field label="Stylist" value={draft.stylist || ""} onChange={(v) => updateDraft("stylist", v)} />
          <Field label="Date" value={draft.date || ""} onChange={(v) => updateDraft("date", v)} type="date" />
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#4A4A4A", marginBottom: "6px" }}>Status</label>
            <select
              value={draft.status || ""}
              onChange={(e) => updateDraft("status", e.target.value)}
              style={{ width: "100%", border: `1px solid ${border}`, borderRadius: "10px", padding: "10px 14px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Field label="Time" value={draft.time || ""} onChange={(v) => updateDraft("time", v)} />
        </Modal>
      )}

      {modal?.type === "service" && (
        <Modal title={modal.isAdd ? "Add Service" : "Edit Service"} onClose={closeModal} onSave={saveModal}>
          <Field label="Service Name" value={draft.name || ""} onChange={(v) => updateDraft("name", v)} />
          <Field label="Price (₹)" value={draft.price || ""} onChange={(v) => updateDraft("price", v)} type="number" />
          <Field label="Duration" value={draft.duration || ""} onChange={(v) => updateDraft("duration", v)} />
          <Field label="Icon (emoji)" value={draft.icon || ""} onChange={(v) => updateDraft("icon", v)} />
        </Modal>
      )}

      {modal?.type === "stylist" && (
        <Modal title={modal.isAdd ? "Add Stylist" : "Edit Stylist"} onClose={closeModal} onSave={saveModal}>
          <Field label="Full Name" value={draft.name || ""} onChange={(v) => updateDraft("name", v)} />
          <Field label="Role / Specialty" value={draft.role || ""} onChange={(v) => updateDraft("role", v)} />
          <Field label="Phone" value={draft.phone || ""} onChange={(v) => updateDraft("phone", v)} />
          <Field label="Email" value={draft.email || ""} onChange={(v) => updateDraft("email", v)} type="email" />
          <Field label="Rating" value={draft.rating || ""} onChange={(v) => updateDraft("rating", v)} />
        </Modal>
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto" }} className="px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#D4A574", marginBottom: "8px", fontWeight: "800" }}>Admin Panel</div>
            <h1 style={{ fontSize: "36px", fontWeight: "900", color: dark, margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>Salon Dashboard</h1>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap"
          }}>

            <button
              onClick={() => navigate("billing")}
              style={{
                padding: "14px 24px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                color: "white",
                cursor: "pointer",
                fontWeight: "800",
                fontSize: "14px",
                boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(37,99,235,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.2)"; }}
            >
              💳 Subscriptions & Billing
            </button>

            <button
              onClick={() => {
                const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
                window.open(`${API}/download-logs`);
              }}
              style={{
                padding: "14px 24px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #1C1C1C, #2D2D2D)",
                color: "white",
                cursor: "pointer",
                fontWeight: "800",
                fontSize: "14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; }}
            >
              ⬇ Download Logs
            </button>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: gray,
              background: "#E8F5E9",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "700",
            }}>
              <span style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#4CAF50",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }} />
              Live • Updated just now
            </div>

          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "48px" }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              background: "white", borderRadius: "16px", padding: "28px 24px", border: `1px solid ${border}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)", transition: "all 0.3s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,165,116,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>{s.icon}</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: dark, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: gray, marginTop: "8px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
              <div style={{ fontSize: "13px", color: "#D4A574", marginTop: "8px", fontWeight: "800" }}>{s.change}</div>
            </div>
          ))}

          {/* Voice Assistant Usage Card */}
          <div style={{
            background: "white", borderRadius: "16px", padding: "28px 24px", border: `1px solid ${border}`,
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)", transition: "all 0.3s",
            display: "flex", flexDirection: "column", justifyContent: "space-between"
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,165,116,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}>
            <div>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎙️</div>
              <div style={{ fontSize: "12px", color: gray, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Voice Assistant Usage</div>
              
              {loadingVoice ? (
                <div style={{ fontSize: "14px", color: gray, marginTop: "12px" }}>Loading stats...</div>
              ) : voiceAnalytics ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: gray, fontWeight: "600" }}>Total Calls:</span>
                    <span style={{ color: dark, fontWeight: "800" }}>{voiceAnalytics.totalCalls}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: gray, fontWeight: "600" }}>Total Minutes:</span>
                    <span style={{ color: dark, fontWeight: "800" }}>{voiceAnalytics.totalMinutes}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ color: gray, fontWeight: "600" }}>Avg Duration:</span>
                    <span style={{ color: dark, fontWeight: "800" }}>{voiceAnalytics.avgDurationLabel}</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "14px", color: gray, marginTop: "12px" }}>No data available</div>
              )}
            </div>
            <div style={{ fontSize: "13px", color: "#D4A574", marginTop: "12px", fontWeight: "800" }}>
              Overall voice usage
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", borderBottom: `2px solid ${border}`, marginBottom: "32px" }}>
          {["bookings", "services", "stylists", "users"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "14px 32px", background: "none", border: "none", fontSize: "15px", fontWeight: "800",
              cursor: "pointer", textTransform: "capitalize", letterSpacing: "1px",
              color: activeTab === t ? "#D4A574" : gray,
              borderBottom: activeTab === t ? `3px solid #D4A574` : "3px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (activeTab !== t) e.currentTarget.style.color = "#C49970"; }}
            onMouseLeave={e => { if (activeTab !== t) e.currentTarget.style.color = gray; }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {["all", "confirmed", "pending", "cancelled"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "6px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: "500", cursor: "pointer",
                  border: `1px solid ${filter === f ? dark : border}`,
                  background: filter === f ? dark : "white",
                  color: filter === f ? "white" : "#4A4A4A",
                  textTransform: "capitalize",
                }}>
                  {f}
                </button>
              ))}
            </div>

            <div style={{ background: "white", borderRadius: "16px", border: `1px solid ${border}`, overflow: "hidden" }} className="w-full overflow-x-auto">
              <div style={{ minWidth: "900px" }}>
                {/* Table head */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr 0.8fr 0.8fr", padding: "12px 20px", background: "#F5F0EA", fontSize: "11px", fontWeight: "700", color: gray, textTransform: "uppercase", letterSpacing: "1px" }}>
                  <span>Client</span><span>Service</span><span>Stylist</span><span>Date & Time</span><span>Status</span><span>Actions</span>
                </div>

                {loadingBookings ? (
                  <div style={{ textAlign: "center", padding: "48px", color: gray, fontSize: "14px" }}>
                    Loading bookings from database...
                  </div>
                ) : errorBookings ? (
                  <div style={{ textAlign: "center", padding: "48px", color: "#E53E3E", fontSize: "14px" }}>
                    {errorBookings}
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px", color: gray, fontSize: "14px" }}>
                    No bookings found.
                  </div>
                ) : (
                  filtered.map((b, i) => (
                    <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr 0.8fr 0.8fr", padding: "16px 20px", alignItems: "center", borderTop: i === 0 ? "none" : `1px solid ${border}` }}>
                      <div>
                        <div style={{ fontWeight: "600", color: dark, fontSize: "14px" }}>{b.client}</div>
                        <div style={{ fontSize: "12px", color: gray }}>📞 {b.phone}</div>
                      </div>
                      <div style={{ fontSize: "14px", color: "#4A4A4A" }}>{b.service}</div>
                      <div style={{ fontSize: "14px", color: "#4A4A4A" }}>{b.stylist}</div>
                      <div>
                        <div style={{ fontSize: "14px", color: "#4A4A4A" }}>{b.date}</div>
                        <div style={{ fontSize: "12px", color: gray }}>{b.time}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "999px", fontWeight: "600", textTransform: "capitalize", background: statusColor[b.status]?.bg || "#FFF8E1", color: statusColor[b.status]?.color || "#F57F17", border: `1px solid ${statusColor[b.status]?.border || "#FFE082"}` }}>
                          {b.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => openEdit("booking", b)}
                          style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "8px", border: `1px solid ${gold}`, background: "white", color: gold, cursor: "pointer", fontWeight: "600" }}
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SERVICES TAB ── */}
        {activeTab === "services" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
              <button
                onClick={() => openAdd("service")}
                style={{ padding: "10px 24px", borderRadius: "999px", border: "none", background: gold, color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600", boxShadow: "0 4px 12px rgba(212,165,116,0.2)" }}
              >
                + Add Service
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {services.map((s) => (
                <div key={s.id} style={{ background: "white", borderRadius: "16px", padding: "24px", border: `1px solid ${border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <span style={{ fontSize: "32px" }}>{s.icon}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => openEdit("service", s)}
                        style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "8px", border: `1px solid ${gold}`, background: "white", color: gold, cursor: "pointer", fontWeight: "600" }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "8px", border: "1px solid #E53E3E", background: "white", color: "#E53E3E", cursor: "pointer", fontWeight: "600" }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ fontWeight: "700", color: dark, fontSize: "16px", marginBottom: "4px" }}>{s.name}</div>
                  <div style={{ fontSize: "13px", color: gray, marginBottom: "16px" }}>⏱ {s.duration}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><div style={{ fontSize: "11px", color: gray }}>Price</div><div style={{ fontWeight: "700", color: gold, fontSize: "18px" }}>₹{s.price}</div></div>
                    <div><div style={{ fontSize: "11px", color: gray }}>Bookings</div><div style={{ fontWeight: "700", color: dark, fontSize: "18px" }}>{s.bookings}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STYLISTS TAB ── */}
        {activeTab === "stylists" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
              <button
                onClick={() => openAdd("stylist")}
                style={{ padding: "10px 24px", borderRadius: "999px", border: "none", background: gold, color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600", boxShadow: "0 4px 12px rgba(212,165,116,0.2)" }}
              >
                + Add Stylist
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              {stylists.map((s) => (
                <div key={s.id} style={{ background: "white", borderRadius: "16px", padding: "24px", border: `1px solid ${border}`, textAlign: "center" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: `linear-gradient(135deg, ${gold}, #D4A882)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "24px", margin: "0 auto 16px" }}>
                    {s.name ? s.name[0] : "?"}
                  </div>
                  <div style={{ fontWeight: "700", color: dark, fontSize: "16px" }}>{s.name}</div>
                  <div style={{ fontSize: "13px", color: gold, marginBottom: "4px" }}>{s.role}</div>
                  <div style={{ fontSize: "12px", color: gray, marginBottom: "16px" }}>{s.email}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "16px" }}>
                    <div><div style={{ fontSize: "11px", color: gray }}>Clients</div><div style={{ fontWeight: "700", color: dark }}>{s.clients}</div></div>
                    <div><div style={{ fontSize: "11px", color: gray }}>Rating</div><div style={{ fontWeight: "700", color: dark }}>⭐ {s.rating}</div></div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                    <button
                      onClick={() => openEdit("stylist", s)}
                      style={{ flex: 1, fontSize: "13px", padding: "8px 0", borderRadius: "8px", border: `1px solid ${gold}`, background: "white", color: gold, cursor: "pointer", fontWeight: "600" }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStylist(s.id)}
                      style={{ flex: 1, fontSize: "13px", padding: "8px 0", borderRadius: "8px", border: "1px solid #E53E3E", background: "white", color: "#E53E3E", cursor: "pointer", fontWeight: "600" }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div>
            <div style={{ background: "white", borderRadius: "16px", border: `1px solid ${border}`, overflow: "hidden" }} className="w-full overflow-x-auto">
              <div style={{ minWidth: "900px" }}>
                {/* Table head */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 1fr", padding: "12px 20px", background: "#F5F0EA", fontSize: "11px", fontWeight: "700", color: gray, textTransform: "uppercase", letterSpacing: "1px" }}>
                  <span>Full Name</span><span>Email Address</span><span>Phone Number</span><span>Registration Date</span><span>Total Bookings</span>
                </div>

                {loadingUsers ? (
                  <div style={{ textAlign: "center", padding: "48px", color: gray, fontSize: "14px" }}>
                    Loading users from database...
                  </div>
                ) : errorUsers ? (
                  <div style={{ textAlign: "center", padding: "48px", color: "#E53E3E", fontSize: "14px" }}>
                    {errorUsers}
                  </div>
                ) : users.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px", color: gray, fontSize: "14px" }}>
                    No registered users found.
                  </div>
                ) : (
                  users.map((u, i) => (
                    <div key={u._id || u.email} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1.5fr 1.5fr 1fr", padding: "16px 20px", alignItems: "center", borderTop: i === 0 ? "none" : `1px solid ${border}` }}>
                      <div style={{ fontWeight: "600", color: dark, fontSize: "14px" }}>{u.name}</div>
                      <div style={{ fontSize: "14px", color: "#4A4A4A" }}>{u.email}</div>
                      <div style={{ fontSize: "14px", color: "#4A4A4A" }}>{u.phone}</div>
                      <div style={{ fontSize: "14px", color: "#4A4A4A" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "N/A"}</div>
                      <div style={{ fontWeight: "700", color: gold, fontSize: "14px" }}>{u.totalBookings}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
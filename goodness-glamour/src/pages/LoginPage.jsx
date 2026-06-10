import { useState } from "react";

const API = `${import.meta.env.VITE_API_URL}/api`;

export default function LoginPage({ navigate, onLogin, authMessage }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    fetch(`${API}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password
      })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Invalid credentials. Please try again.");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          onLogin(data.token, data.user);
        }
      })
      .catch((err) => {
        console.error("Login submission error:", err.message);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={{
      paddingTop: "80px", minHeight: "100vh", background: "linear-gradient(135deg, #FAF8F5 0%, #FFFBF7 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} className="px-4 py-12 sm:px-6 sm:py-16">
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "36px", fontWeight: "900", letterSpacing: "-0.5px", color: "#1C1C1C", fontFamily: "'Playfair Display', serif" }}>Blue Spa</div>
          <div style={{ fontSize: "12px", letterSpacing: "5px", textTransform: "uppercase", color: "#2563EB", marginBottom: "28px", fontWeight: "800" }}>& Salon</div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#1C1C1C", margin: "0 0 8px 0", letterSpacing: "-0.5px", fontFamily: "'Playfair Display', serif" }}>Welcome Back</h1>
          <p style={{ color: "#9A9A9A", fontSize: "14px", marginTop: "8px" }}>Manage appointments, customers and salon operations.</p>
        </div>

        {/* Login Card */}
        <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", border: "1px solid #E8E0D8" }} className="p-6 sm:p-8">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email Field */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4A4A4A", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={handleKeyDown}
                style={{
                  width: "100%", border: "1px solid #E8E0D8", borderRadius: "10px", padding: "12px 16px",
                  fontSize: "14px", color: "#1C1C1C", fontWeight: "500", transition: "all 0.2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#D4A574"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,165,116,0.1)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E0D8"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#4A4A4A", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
                <button style={{ fontSize: "12px", color: "#D4A574", background: "none", border: "none", cursor: "pointer", fontWeight: "700", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}>
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={handleKeyDown}
                style={{
                  width: "100%", border: "1px solid #E8E0D8", borderRadius: "10px", padding: "12px 16px",
                  fontSize: "14px", color: "#1C1C1C", fontWeight: "500", transition: "all 0.2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#D4A574"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,165,116,0.1)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E0D8"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {authMessage && !error && (
              <p style={{ color: "#856404", fontSize: "13px", background: "#FFF9E6", border: "1px solid #FFEBAA", padding: "12px 14px", borderRadius: "8px", margin: "0", fontWeight: "600" }}>
                🔑 {authMessage}
              </p>
            )}

            {error && (
              <p style={{ color: "#E53E3E", fontSize: "13px", background: "#FED7D7", padding: "12px 14px", borderRadius: "8px", margin: "0" }}>{error}</p>
            )}

            {/* Sign In Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", background: "linear-gradient(135deg, #D4A574, #B8956A)", color: "white", padding: "14px",
                borderRadius: "10px", border: "none", fontWeight: "800", fontSize: "15px", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 8px 24px rgba(212,165,116,0.3)", transition: "all 0.3s", opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,165,116,0.4)"; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.3)"; } }}
            >
              {loading ? (
                <>
                  <span style={{ display: "inline-block", width: "14px", height: "14px", borderTop: "2px solid rgba(255,255,255,0.7)", borderRadius: "50%", marginRight: "8px", animation: "spin 0.8s linear infinite" }} />
                  Signing in...
                </>
              ) : "Sign In"}
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <p style={{ textAlign: "center", fontSize: "14px", color: "#9A9A9A", marginTop: "24px" }}>
          Don't have an account?{" "}
          <button onClick={() => navigate("signup")} style={{ color: "#D4A574", fontWeight: "800", background: "none", border: "none", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}>
            Sign Up Free
          </button>
        </p>

        {/* Admin Hint */}
        <div style={{ textAlign: "center", fontSize: "12px", color: "#B8B0A8", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #E8E0D8" }}>
          <p style={{ margin: "0 0 4px 0" }}>💡 Demo Credentials:</p>
          <p style={{ margin: "0", fontFamily: "monospace" }}>kusheendhar@gmail.com / Admin@123blue</p>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
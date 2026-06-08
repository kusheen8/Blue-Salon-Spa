import { useState } from "react";

const API = `${import.meta.env.VITE_API_URL}/api`;

export default function SignupPage({ navigate, onLogin }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.password) return;

    fetch(`${API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      })
    })
    .catch(err => console.error("Error creating user in DB:", err));

    localStorage.setItem("gg_user", JSON.stringify({ email: form.email, name: form.name, role: "user" }));
    onLogin(false);
  };

  return (
    <div style={{
      paddingTop: "80px", minHeight: "100vh", background: "linear-gradient(135deg, #FAF8F5 0%, #FFFBF7 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} className="px-4 py-12 sm:px-6 sm:py-16">
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "36px", fontWeight: "900", letterSpacing: "-0.5px", color: "#1C1C1C", fontFamily: "'Playfair Display', serif" }}>Goodness</div>
          <div style={{ fontSize: "12px", letterSpacing: "5px", textTransform: "uppercase", color: "#D4A574", marginBottom: "28px", fontWeight: "800" }}>Glamour</div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#1C1C1C", margin: "0 0 8px 0", letterSpacing: "-0.5px", fontFamily: "'Playfair Display', serif" }}>Create Your Account</h1>
          <p style={{ color: "#9A9A9A", fontSize: "14px", marginTop: "8px" }}>Join us for a premium salon experience</p>
        </div>

        {/* Signup Card */}
        <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", border: "1px solid #E8E0D8" }} className="p-6 sm:p-8">
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Full Name */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4A4A4A", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Name</label>
              <input
                type="text"
                placeholder="Priya Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: "100%", border: "1px solid #E8E0D8", borderRadius: "10px", padding: "12px 16px",
                  fontSize: "14px", color: "#1C1C1C", fontWeight: "500", transition: "all 0.2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#D4A574"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,165,116,0.1)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E0D8"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4A4A4A", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  width: "100%", border: "1px solid #E8E0D8", borderRadius: "10px", padding: "12px 16px",
                  fontSize: "14px", color: "#1C1C1C", fontWeight: "500", transition: "all 0.2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#D4A574"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,165,116,0.1)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E0D8"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4A4A4A", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{
                  width: "100%", border: "1px solid #E8E0D8", borderRadius: "10px", padding: "12px 16px",
                  fontSize: "14px", color: "#1C1C1C", fontWeight: "500", transition: "all 0.2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#D4A574"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,165,116,0.1)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E0D8"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4A4A4A", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{
                  width: "100%", border: "1px solid #E8E0D8", borderRadius: "10px", padding: "12px 16px",
                  fontSize: "14px", color: "#1C1C1C", fontWeight: "500", transition: "all 0.2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#D4A574"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,165,116,0.1)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E8E0D8"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Terms */}
            <p style={{ fontSize: "12px", color: "#9A9A9A", lineHeight: "1.5", margin: "0" }}>
              By signing up, you agree to our <span style={{ fontWeight: "700", color: "#1C1C1C" }}>Terms of Service</span> and <span style={{ fontWeight: "700", color: "#1C1C1C" }}>Privacy Policy</span>
            </p>

            {/* Sign Up Button */}
            <button
              onClick={handleSubmit}
              style={{
                width: "100%", background: "linear-gradient(135deg, #D4A574, #B8956A)", color: "white", padding: "14px",
                borderRadius: "10px", border: "none", fontWeight: "800", fontSize: "15px", cursor: "pointer",
                boxShadow: "0 8px 24px rgba(212,165,116,0.3)", transition: "all 0.3s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,165,116,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.3)"; }}
            >
              Create Account
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#E8E0D8" }} />
            <span style={{ fontSize: "12px", color: "#9A9A9A", fontWeight: "600" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#E8E0D8" }} />
          </div>

          {/* Google Sign Up */}
          <button style={{
            width: "100%", border: "1px solid #E8E0D8", padding: "12px", borderRadius: "10px",
            fontSize: "14px", fontWeight: "700", color: "#4A4A4A", background: "white",
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#D4A574"; e.currentTarget.style.background = "#FAF8F5"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8E0D8"; e.currentTarget.style.background = "white"; }}>
            📱 Sign Up with Google
          </button>
        </div>

        {/* Sign In Link */}
        <p style={{ textAlign: "center", fontSize: "14px", color: "#9A9A9A", marginTop: "24px" }}>
          Already have an account?{" "}
          <button onClick={() => navigate("login")} style={{ color: "#D4A574", fontWeight: "800", background: "none", border: "none", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
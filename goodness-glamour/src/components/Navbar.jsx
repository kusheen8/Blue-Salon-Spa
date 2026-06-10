import { useState } from "react";
import logo from "./logo.jpg";

export default function Navbar({ navigate, currentPage, isLoggedIn, isAdmin, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label: "Home",     page: "home", scrollTo: null },
    { label: "Services", page: "home", scrollTo: "services-section" },
    { label: "Gallery",  page: "home", scrollTo: "gallery-section" },
    { label: "Contact",  page: "home", scrollTo: "contact-section" },
  ];

  function handleNavClick(link) {
    navigate(link.page);
    setMenuOpen(false);
    if (link.scrollTo) {
      setTimeout(() => {
        document.getElementById(link.scrollTo)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  return (
    <nav style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "80px",
      background: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(228, 220, 212, 0.5)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      transition: "all 0.3s",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }} className="px-6">
        {/* Logo */}
        <button onClick={() => navigate("home")} style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          transition: "all 0.3s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
          <img src={logo} alt="Blue Spa & Salon Logo" style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "1px solid #E8E0D8",
          }} />
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            lineHeight: "1.1",
          }}>
            <span style={{
              fontSize: "19px",
              fontWeight: "800",
              letterSpacing: "-0.3px",
              color: "#1C1C1C",
              fontFamily: "'Playfair Display', serif",
            }}>
              Blue Spa & Salon
            </span>
            <span style={{
              fontSize: "9px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#B8956A",
              fontWeight: "700",
              marginTop: "2px",
            }}>
              Where beauty meets care
            </span>
          </div>
        </button>

        {/* Desktop Nav */}
        <div style={{
          alignItems: "center",
          gap: "32px",
        }} className="hidden md:flex">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNavClick(l)}
              style={{
                fontSize: "14px",
                letterSpacing: "0.5px",
                fontWeight: "600",
                color: "#4A4A4A",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                textTransform: "capitalize",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#4A4A4A"; }}
            >
              {l.label}
            </button>
          ))}
          {isLoggedIn && (
            <button
              onClick={() => navigate(isAdmin ? "admin" : "dashboard")}
              style={{
                fontSize: "14px",
                letterSpacing: "0.5px",
                fontWeight: "600",
                color: "#4A4A4A",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#4A4A4A"; }}
            >
              {isAdmin ? "Admin" : "My Appointments"}
            </button>
          )}
        </div>

        {/* CTA Buttons */}
        <div style={{
          alignItems: "center",
          gap: "12px",
        }} className="hidden md:flex">
          {isLoggedIn ? (
            <>
              {!isAdmin && (
                <button
                  onClick={() => navigate("dashboard")}
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#4A4A4A",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 16px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#4A4A4A"; }}
                >
                  Profile
                </button>
              )}
              <button
                onClick={onLogout}
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#4A4A4A",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 16px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#4A4A4A"; }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("login")}
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#4A4A4A",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 16px",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#4A4A4A"; }}
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => navigate("booking")}
            style={{
              background: "linear-gradient(135deg, #D4A574, #B8956A)",
              color: "white",
              fontSize: "14px",
              fontWeight: "800",
              padding: "10px 28px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(212,165,116,0.25)",
              transition: "all 0.3s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,165,116,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.25)"; }}
          >
            Book Now
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          style={{
            flexDirection: "column",
            gap: "6px",
            padding: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex md:hidden"
        >
          <span style={{
            width: "24px",
            height: "2px",
            background: "#1C1C1C",
            transition: "all 0.3s",
            transform: menuOpen ? "rotate(45deg) translate(5px, 6px)" : "none",
          }} />
          <span style={{
            width: "24px",
            height: "2px",
            background: "#1C1C1C",
            transition: "all 0.3s",
            opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            width: "24px",
            height: "2px",
            background: "#1C1C1C",
            transition: "all 0.3s",
            transform: menuOpen ? "rotate(-45deg) translate(5px, -6px)" : "none",
          }} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          gap: "16px",
          background: "#FFFFFF",
          borderTop: "1px solid #E8E0D8",
          padding: "20px 24px",
          animation: "slideInDown 0.3s ease-out",
          maxHeight: "calc(100vh - 70px)",
          overflowY: "auto",
        }} className="flex flex-col md:hidden">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNavClick(l)}
              style={{
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4A4A4A",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 0",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#4A4A4A"; }}
            >
              {l.label}
            </button>
          ))}
          {isLoggedIn && (
            <button
              onClick={() => { navigate(isAdmin ? "admin" : "dashboard"); setMenuOpen(false); }}
              style={{
                textAlign: "left",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4A4A4A",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              {isAdmin ? "Admin" : "My Appointments"}
            </button>
          )}
          <div style={{
            display: "flex",
            gap: "12px",
            paddingTop: "16px",
            borderTop: "1px solid #E8E0D8",
          }}>
            {isLoggedIn ? (
              <>
                {!isAdmin && (
                  <button
                    onClick={() => { navigate("dashboard"); setMenuOpen(false); }}
                    style={{
                      flex: 1,
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "2px solid #D4A574",
                      color: "#D4A574",
                      background: "white",
                      padding: "12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    Profile
                  </button>
                )}
                <button
                  onClick={() => { onLogout(); setMenuOpen(false); }}
                  style={{
                    flex: 1,
                    fontSize: "14px",
                    fontWeight: "700",
                    border: "2px solid #E53E3E",
                    color: "#E53E3E",
                    background: "white",
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { navigate("login"); setMenuOpen(false); }}
                style={{
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: "700",
                  border: "2px solid #D4A574",
                  color: "#D4A574",
                  background: "white",
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => { navigate("booking"); setMenuOpen(false); }}
              style={{
                flex: 1,
                fontSize: "14px",
                fontWeight: "700",
                background: "linear-gradient(135deg, #D4A574, #B8956A)",
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Book Now
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
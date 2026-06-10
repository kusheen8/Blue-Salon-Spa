import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  const [page, setPage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("gg_token");
    if (!token) {
      setVerifyingSession(false);
      return;
    }
    const API = `${import.meta.env.VITE_API_URL}/api`;
    fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      if (!res.ok) throw new Error("Invalid session");
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        setIsLoggedIn(true);
        setIsAdmin(data.user.role === "admin");
        setCurrentUser(data.user);
        if (data.user.role === "admin") {
          setPage("admin");
        }
      } else {
        throw new Error("Invalid session response");
      }
    })
    .catch((err) => {
      console.warn("Session validation failed:", err.message);
      // Auto logout on invalid/expired token
      localStorage.removeItem("gg_token");
      localStorage.removeItem("gg_user");
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUser(null);
    })
    .finally(() => {
      setVerifyingSession(false);
    });
  }, []);

  function navigate(p, message = "") {
    if (message) {
      setAuthMessage(message);
    } else {
      setAuthMessage("");
    }

    if (verifyingSession) return;

    // ✅ Protect admin route — only admins can access
    if (p === "admin" && !isAdmin) {
      setAuthMessage("Please sign in as admin to continue.");
      setPage("login");
      return;
    }
    // ✅ Protect dashboard — only logged in users
    if (p === "dashboard" && !isLoggedIn) {
      setAuthMessage("Please sign in to continue.");
      setPage("login");
      return;
    }
    // ✅ Protect booking page — only logged in users (Guests must never book)
    if (p === "booking" && !isLoggedIn) {
      setAuthMessage("Please sign in to continue.");
      setPage("login");
      return;
    }

    setPage(p);
    window.scrollTo(0, 0);
  }

  function handleLogin(token, user) {
    localStorage.setItem("gg_token", token);
    localStorage.setItem("gg_user", JSON.stringify(user));
    setIsLoggedIn(true);
    setIsAdmin(user.role === "admin");
    setCurrentUser(user);
    setAuthMessage("");
    setPage(user.role === "admin" ? "admin" : "dashboard");
    window.scrollTo(0, 0);
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
    localStorage.removeItem("gg_token");
    localStorage.removeItem("gg_user");
    setAuthMessage("");
    setPage("home");
    window.scrollTo(0, 0);
  }

  if (verifyingSession) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8F5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #E8E0D8", borderTop: "3px solid #D4A574", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#9A9A9A", fontSize: "14px", fontWeight: "600" }}>Verifying session...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAF8F5" }}>
      <Navbar
        navigate={navigate}
        currentPage={page}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />
      <main>
        {page === "home"      && <HomePage      navigate={navigate} isLoggedIn={isLoggedIn} />}
        {page === "booking"   && <BookingPage   navigate={navigate} />}
        {page === "dashboard" && <DashboardPage navigate={navigate} />}
        {page === "login"     && <LoginPage     navigate={navigate} onLogin={handleLogin} authMessage={authMessage} />}
        {page === "signup"    && <SignupPage    navigate={navigate} onLogin={handleLogin} />}
        {page === "admin"     && <AdminPage     navigate={navigate} onLogout={handleLogout} />}
      </main>
    </div>
  );
}
// retell voice assistant
import React, { useState, useRef, useEffect } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

export default function VirtualAssistantCard({ popupOnly = false }) {

  const [showCallPopup, setShowCallPopup] = useState(false);

  const [isCalling, setIsCalling] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // "connecting", "connected", "active"

  // ─── RETELL CLIENT ─────────────────────────────
  const retellWebClient = useRef(
    new RetellWebClient()
  ).current;

  // ─── TIMER EFFECT ──────────────────────────────
  useEffect(() => {

    let interval;

    if (showCallPopup) {

      interval = setInterval(() => {

        setCallSeconds(prev => prev + 1);

      }, 1000);
    }

    return () => clearInterval(interval);

  }, [showCallPopup]);

  // ─── EVENT LISTENER FOR VOICE AGENT TRIGGER ───
  useEffect(() => {
    const handleVoiceAgentClick = () => {
      startRetellCall();
    };

    window.addEventListener("open-voice-agent", handleVoiceAgentClick);
    return () => window.removeEventListener("open-voice-agent", handleVoiceAgentClick);
  }, []);

  // ─── START RETELL CALL ─────────────────────────
  const startRetellCall = async () => {
    try {
      setShowCallPopup(true);
      setIsConnecting(true);
      setConnectionStatus("connecting");
      setCallSeconds(0);

      const apiBaseUrl = import.meta.env.VITE_API_URL || "https://goodness-glamour-backend-9rb6.onrender.com";
      const response = await fetch(
        `${apiBaseUrl}/api/create-web-call`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();
      console.log("Retell Response:", data);

      if (data.error || !response.ok) {
        throw new Error(data.error || "Voice assistant currently unavailable. Please contact the salon directly.");
      }

      // start voice call
      await retellWebClient.startCall({
        accessToken: data.access_token
      });

      // Update to connected
      setConnectionStatus("connected");

      // auto close when call ends
      retellWebClient.on("call_ended", () => {
        console.log("Call ended");
        setIsCalling(false);
        setShowCallPopup(false);
        setIsConnecting(false);
        setConnectionStatus("connecting");
        setCallSeconds(0);
      });

      // Smooth transition to active call screen after a premium delay showing "Connected!"
      setTimeout(() => {
        setIsConnecting(false);
        setIsCalling(true);
        setConnectionStatus("active");
      }, 1500);

    } catch (err) {
      console.error("Retell Error:", err);
      alert(err.message || "Voice assistant currently unavailable. Please contact the salon directly.");
      setShowCallPopup(false);
      setIsConnecting(false);
      setConnectionStatus("connecting");
    }
  };

  // ─── END CALL ──────────────────────────────────
  const endCall = async () => {
    try {
      await retellWebClient.stopCall();
      setIsCalling(false);
      setShowCallPopup(false);
      setIsConnecting(false);
      setConnectionStatus("connecting");
      setCallSeconds(0);
    } catch (err) {
      console.error("End Call Error:", err);
    }
  };

  return (
    <>

      {/* ─── PULSE ANIMATION ───────────────────── */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }

            50% {
              transform: scale(1.12);
              opacity: 0.7;
            }

            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes glow {
            0% {
              box-shadow: 0 0 10px rgba(212,165,116,0.4);
            }

            50% {
              box-shadow: 0 0 30px rgba(212,165,116,0.9);
            }

            100% {
              box-shadow: 0 0 10px rgba(212,165,116,0.4);
            }
          }
          
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulseWave {
            0%, 100% {
              transform: scaleY(0.3);
            }
            50% {
              transform: scaleY(1.3);
            }
          }
        `}
      </style>

      {!popupOnly && (
        <div
          style={{
            background: "linear-gradient(135deg, #1C1C1C 0%, #2D2D2D 100%)",
            color: "white",
            padding: "32px",
            borderRadius: "20px",
            marginTop: "48px",
            textAlign: "center",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            border: "1px solid rgba(212,165,116,0.1)",
          }}
        >

          <h2
            style={{
              fontSize: "32px",
              marginBottom: "16px",
              fontWeight: "900",
              letterSpacing: "-0.5px",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            ✨ AI Voice Assistant
          </h2>

          <p
            style={{
              opacity: 0.85,
              marginBottom: "28px",
              lineHeight: "1.8",
              fontSize: "16px",
              maxWidth: "500px",
              margin: "0 auto 28px",
            }}
          >
            Connect with our intelligent voice agent for instant salon services, pricing, appointments, and personalized beauty consultations.
          </p>

          {/* ─── CALL BUTTON ───────────────────── */}
          <button
            onClick={startRetellCall}
            disabled={isConnecting}
            style={{
              background: "linear-gradient(135deg, #D4A574, #B8956A)",
              color: "white",
              padding: "16px 40px",
              borderRadius: "10px",
              border: "none",
              fontWeight: "800",
              fontSize: "16px",
              cursor: isConnecting ? "not-allowed" : "pointer",
              boxShadow: "0 8px 24px rgba(212,165,116,0.3)",
              transition: "all 0.3s",
              opacity: isConnecting ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!isConnecting) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(212,165,116,0.4)"; } }}
            onMouseLeave={e => { if (!isConnecting) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.3)"; } }}
          >
            {isConnecting ? "Connecting..." : "📞 Start Voice Call"}
          </button>

          <p style={{ fontSize: "12px", opacity: 0.6, marginTop: "16px", margin: "16px 0 0" }}>
            Available 24/7 • No wait time
          </p>
        </div>
      )}

      {/* ─── CALL POPUP ────────────────────────── */}
      {showCallPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 10, 10, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1C1C1C 0%, #252525 100%)",
              borderRadius: "24px",
              padding: "48px 32px",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.75)",
              border: "1px solid rgba(212, 165, 116, 0.2)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Ambient gold glow behind */}
            <div style={{
              position: "absolute", top: "-50px", left: "-50px", width: "150px", height: "150px",
              background: "radial-gradient(circle, rgba(212,165,116,0.08) 0%, transparent 70%)",
              borderRadius: "50%", zIndex: 0
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              {connectionStatus === "connecting" ? (
                <>
                  {/* Premium Gold Spinner */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "64px",
                    marginBottom: "32px"
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      border: "3px solid rgba(212, 165, 116, 0.15)",
                      borderTop: "3px solid #D4A574",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }} />
                  </div>
                  <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#D4A574", margin: "0 0 12px 0", letterSpacing: "1px", fontFamily: "'Playfair Display', serif" }}>
                    Initializing Call
                  </h3>
                  <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                    Setting up a secure audio line to Priya...
                  </p>
                </>
              ) : connectionStatus === "connected" ? (
                <>
                  {/* Elegant Golden Audio Waveform (Static Connected) */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    height: "64px",
                    marginBottom: "32px"
                  }}>
                    <div style={{ width: "4px", height: "16px", background: "#D4A574", borderRadius: "2px", opacity: 0.6 }} />
                    <div style={{ width: "4px", height: "24px", background: "#B8956A", borderRadius: "2px", opacity: 0.7 }} />
                    <div style={{ width: "4px", height: "36px", background: "#D4A574", borderRadius: "2px" }} />
                    <div style={{ width: "4px", height: "48px", background: "#B8956A", borderRadius: "2px" }} />
                    <div style={{ width: "4px", height: "36px", background: "#D4A574", borderRadius: "2px" }} />
                    <div style={{ width: "4px", height: "24px", background: "#B8956A", borderRadius: "2px", opacity: 0.7 }} />
                    <div style={{ width: "4px", height: "16px", background: "#D4A574", borderRadius: "2px", opacity: 0.6 }} />
                  </div>
                  <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#B8956A", margin: "0 0 12px 0", letterSpacing: "1px", fontFamily: "'Playfair Display', serif" }}>
                    Connected ✓
                  </h3>
                  <p style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                    Starting voice session...
                  </p>
                </>
              ) : connectionStatus === "active" ? (
                <>
                  {/* Animating Luxury Audio Waveform */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    height: "64px",
                    marginBottom: "32px"
                  }}>
                    <div style={{ width: "4px", height: "16px", background: "#D4A574", borderRadius: "2px", animation: "pulseWave 1.2s infinite ease-in-out" }} />
                    <div style={{ width: "4px", height: "32px", background: "#B8956A", borderRadius: "2px", animation: "pulseWave 1.2s infinite ease-in-out", animationDelay: "0.2s" }} />
                    <div style={{ width: "4px", height: "48px", background: "#D4A574", borderRadius: "2px", animation: "pulseWave 1.2s infinite ease-in-out", animationDelay: "0.4s" }} />
                    <div style={{ width: "4px", height: "24px", background: "#B8956A", borderRadius: "2px", animation: "pulseWave 1.2s infinite ease-in-out", animationDelay: "0.1s" }} />
                    <div style={{ width: "4px", height: "40px", background: "#D4A574", borderRadius: "2px", animation: "pulseWave 1.2s infinite ease-in-out", animationDelay: "0.3s" }} />
                    <div style={{ width: "4px", height: "16px", background: "#B8956A", borderRadius: "2px", animation: "pulseWave 1.2s infinite ease-in-out", animationDelay: "0.5s" }} />
                  </div>

                  <h3 style={{ fontSize: "22px", fontWeight: "900", color: "white", margin: "0 0 6px 0", letterSpacing: "0.5px", fontFamily: "'Playfair Display', serif" }}>
                    Priya
                  </h3>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700", margin: "0 0 20px 0" }}>
                    AI Salon Consultant
                  </p>

                  {/* Elegant gold duration badge */}
                  <div style={{
                    display: "inline-block",
                    background: "rgba(212, 165, 116, 0.12)",
                    border: "1px solid rgba(212, 165, 116, 0.25)",
                    padding: "6px 18px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "#D4A574",
                    marginBottom: "36px",
                    fontFamily: "monospace"
                  }}>
                    {String(Math.floor(callSeconds / 60)).padStart(2, "0")}:{String(callSeconds % 60).padStart(2, "0")}
                  </div>

                  <button
                    onClick={endCall}
                    style={{
                      width: "100%",
                      background: "linear-gradient(135deg, #EF5350, #C62828)",
                      color: "white",
                      border: "none",
                      padding: "16px 32px",
                      borderRadius: "12px",
                      fontSize: "15px",
                      fontWeight: "800",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      boxShadow: "0 8px 24px rgba(198, 40, 40, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(198, 40, 40, 0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(198, 40, 40, 0.3)"; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    End Call
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
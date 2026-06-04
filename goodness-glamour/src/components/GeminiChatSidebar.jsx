import { useState, useRef, useEffect } from "react";

const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const API_KEY = import.meta.env.VITE_HF_API_KEY;

const SYSTEM_PROMPT = `You are a luxury salon AI assistant for Goodness Glamour Salon.
You help users with hairstyles, haircuts, hair coloring, hair treatments, hair care routines, salon suggestions, and styling tips.
Keep replies friendly, elegant, professional, short to medium length, and use emojis naturally.
If unrelated questions are asked, politely redirect to salon and hair topics.`;

const SUGGESTIONS = [
  "Best haircut for round face? ✂️",
  "Hair color ideas ✨",
  "How to stop hair fall? 🌿",
  "Keratin vs smoothening 💆‍♀️",
];

export default function GeminiChatSidebar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
  const openChat = () => {
    setOpen(true);
  };

  window.addEventListener("open-ai-chat", openChat);

  return () => {
    window.removeEventListener("open-ai-chat", openChat);
  };
}, []);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello beautiful ✨ I'm your Goodness Glamour Hair Assistant. Ask me about hairstyles, treatments, hair colors, or salon care 💇‍♀️",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (open) inputRef.current?.focus();
  }, [messages, open]);

const handleImageUpload = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const imageUrl = URL.createObjectURL(file);

  setSelectedImage({
  file,
  preview: imageUrl,
});
};

const sendMessage = async (customText) => {
    const text = (customText || input).trim();
    if (!text || loading) return;

    const updatedMessages = [
  ...messages,
  {
    role: "user",
    text,
    image: selectedImage?.preview || null,
  },
];
    setMessages(updatedMessages);
    setInput("");
    
    setLoading(true);

    try {
     
  
  const formData = new FormData();

formData.append("message", text);
formData.append("sessionId", "website-user");

if (selectedImage?.file) {
  formData.append("image", selectedImage.file);
}
console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/chat`, {
  method: "POST",
  body: formData,
});

const data = await response.json();
console.log(data);
// if (data.error) throw new Error(data.error);

if (data.error) throw new Error(data.error);

let reply = data.reply || "✨ Sorry, I couldn't respond right now.";

      // Clean up any leftover prompt artifacts
      reply = reply.replace(/\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>>|<s>|<\/s>/g, "").trim();

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setSelectedImage(null);
    } catch (error) {
      console.error("HF error:", error.message);
      let errorMsg = "⚠️ Something went wrong. Please try again.";
      if (error.message?.includes("loading")) {
        errorMsg = "⏳ Model is loading, please wait 20 seconds and try again.";
      } else if (error.message?.includes("token") || error.message?.includes("auth")) {
        errorMsg = "⚠️ API key issue. Check VITE_HF_API_KEY in your .env file.";
      }
      setMessages((prev) => [...prev, { role: "assistant", text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", right: open ? "370px" : "0", top: "50%", transform: "translateY(-50%)",
          zIndex: 9999, border: "none", cursor: "pointer", padding: "16px 10px",
          borderRadius: "14px 0 0 14px", background: "linear-gradient(180deg, #D4A574 0%, #B8956A 50%, #6E4A31 100%)",
          color: "white", fontWeight: "900", letterSpacing: "1px", boxShadow: "-6px 4px 24px rgba(212,165,116,0.35)",
          transition: "0.3s ease", fontSize: "11px", textTransform: "uppercase",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "-8px 6px 32px rgba(212,165,116,0.45)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "-6px 4px 24px rgba(212,165,116,0.35)"; }}
      >
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "11px", fontWeight: "900" }}>
          HAIR AI ✂️
        </div>
      </button>

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: open ? 0 : "-370px",
          width: "370px",
          height: "100vh",
          background: "#fdf8f4",
          backdropFilter: "blur(18px)",
          boxShadow: "-10px 0 40px rgba(0,0,0,0.18)",
          zIndex: 9998,
          transition: "0.35s ease",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid rgba(200,155,109,0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "28px 24px", background: "linear-gradient(135deg, #D4A574 0%, #B8956A 50%, #8B6F47 100%)",
            color: "white", boxShadow: "0 8px 24px rgba(212,165,116,0.3)", position: "relative", overflow: "hidden",
          }}
        >
          {/* Decorative gradient element */}
          <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "200px", height: "200px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px", fontFamily: "'Playfair Display', serif" }}>✨ Hair AI</h2>
              <p style={{ margin: "6px 0 0", fontSize: "12px", opacity: 0.95, fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Goodness Glamour</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.2)", border: "none", width: "36px", height: "36px", borderRadius: "10px",
                color: "white", cursor: "pointer", fontSize: "18px", fontWeight: "700", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
            >
              ✕
            </button>
          </div>

          {messages.length <= 1 && (
            <div style={{ marginTop: "18px", display: "flex", flexWrap: "wrap", gap: "8px", position: "relative", zIndex: 1 }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.12)",
                    color: "white", borderRadius: "24px", padding: "8px 14px", fontSize: "11.5px",
                    cursor: "pointer", fontWeight: "700", transition: "all 0.2s", backdropFilter: "blur(10px)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1, overflowY: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: "16px",
            background: "#FFFBF7",
          }}
        >
          {messages.map((msg, index) => (
            <div key={index} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "slideInUp 0.3s ease" }}>
              <div
                style={{
                  maxWidth: "85%", padding: "14px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? "linear-gradient(135deg, #D4A574, #B8956A)" : "white",
                  color: msg.role === "user" ? "white" : "#1C1C1C", lineHeight: "1.6", fontSize: "14px",
                  boxShadow: msg.role === "user" ? "0 4px 16px rgba(212,165,116,0.25)" : "0 2px 12px rgba(0,0,0,0.06)",
                  whiteSpace: "pre-wrap", fontWeight: msg.role === "user" ? "600" : "500",
                }}
              >
                <>
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="uploaded"
                      style={{
                        width: "100%", borderRadius: "12px", marginBottom: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      }}
                    />
                  )}
                  {msg.text}
                </>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ background: "white", width: "100px", padding: "16px 18px", borderRadius: "18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", animation: "pulse 1.5s ease-in-out infinite", fontWeight: "700", fontSize: "14px", color: "#D4A574" }}>
              Thinking ✨
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "18px", borderTop: "2px solid #E8E0D8", background: "white" }}>
          <div
            style={{
              display: "flex", gap: "12px", alignItems: "center", background: "#FFFBF7",
              borderRadius: "14px", padding: "12px", border: "1px solid #E8E0D8", transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />

            <button
              onClick={() => fileInputRef.current.click()}
              title="Upload a hair photo"
              style={{
                border: "none", background: "transparent", cursor: "pointer", padding: "6px",
                flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
                gap: "2px", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V8M12 8L9 11M12 8L15 11"
                  stroke="#D4A574"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                  stroke="#D4A574"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask about hairstyles..."
              style={{
                flex: 1, border: "none", outline: "none", resize: "none", background: "transparent",
                fontSize: "14px", color: "#1C1C1C", fontWeight: "600", fontFamily: "inherit",
              }}
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: "40px", height: "40px", borderRadius: "10px", border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                background: loading || !input.trim()
                  ? "#E8E0D8"
                  : "linear-gradient(135deg, #D4A574, #B8956A)",
                color: loading || !input.trim() ? "#9A9A9A" : "white",
                fontSize: "16px", fontWeight: "700", transition: "all 0.2s",
                boxShadow: loading || !input.trim() ? "none" : "0 4px 12px rgba(212,165,116,0.25)",
              }}
              onMouseEnter={e => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(212,165,116,0.35)";
                }
              }}
              onMouseLeave={e => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(212,165,116,0.25)";
                }
              }}
            >
              ➤
            </button>
          </div>

          <p
            style={{
              textAlign: "center", fontSize: "11px", marginTop: "10px",
              color: "#B8956A", fontWeight: "700", letterSpacing: "0.5px",
            }}
          >
            Press Enter to send ✨
          </p>
        </div>
</div>
</>
);
}
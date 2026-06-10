import { useState } from "react";
import GeminiChatSidebar from "../components/GeminiChatSidebar";
import VirtualAssistantCard from "../components/VirtualAssistantCard";

// Import new images
import spaTherapyRoom from "../assets/spa_therapy_room.jpg";
import salonEntrance from "../assets/salon_entrance.jpg";
import receptionDesk from "../assets/reception_desk.jpg";
import stylingArea from "../assets/styling_area.jpg";
import hairWashBasin from "../assets/hair_wash_basin.jpg";
import receptionWaitingArea from "../assets/reception_waiting_area.jpg";
import singleSpaRoom from "../assets/single_spa_room.jpg";

const services = [
  {
    icon: "✂️",
    title: "Haircuts & Styling",
    desc: "Precision cuts tailored to your face shape and lifestyle",
    price: "From ₹599",
    img: stylingArea,
  },
  {
    icon: "🎨",
    title: "Hair Coloring",
    desc: "Global balayage, highlights & vivid color techniques",
    price: "From ₹1,499",
    img: hairWashBasin,
  },
  {
    icon: "💆",
    title: "Hair Treatments",
    desc: "Keratin, smoothing & deep conditioning therapies",
    price: "From ₹999",
    img: spaTherapyRoom,
  },
  {
    icon: "🪒",
    title: "Grooming & Shave",
    desc: "Classic hot towel shaves & beard sculpting",
    price: "From ₹399",
    img: receptionDesk,
  },
  {
    icon: "✨",
    title: "Skin Services",
    desc: "Facials, clean-ups & advanced skin treatments",
    price: "From ₹799",
    img: singleSpaRoom,
  },
  {
    icon: "💅",
    title: "Nail Art",
    desc: "Manicure, pedicure & artistic nail designs",
    price: "From ₹499",
    img: salonEntrance,
  },
];

const reviews = [
  { name: "Priya S.", rating: 5, text: "Absolutely loved my hair transformation! The stylists are incredibly skilled and the ambiance is so relaxing.", time: "2 weeks ago" },
  { name: "Rohan M.", rating: 5, text: "Best grooming experience in Hyderabad. Bipin is a legend — knew exactly what I wanted.", time: "1 month ago" },
  { name: "Akanksha B.", rating: 5, text: "Visited for a haircut and came out feeling like a new person. 10/10 would recommend!", time: "3 weeks ago" },
];

const stats = [
  { value: "5,000+", label: "Happy Clients" },
  { value: "12+", label: "Expert Stylists" },
  { value: "949", label: "Google Reviews" },
  { value: "8+", label: "Years of Excellence" },
];

const offers = [
  {
    tag: "Happy Hours",
    title: "40% OFF on All Services",
    subtitle: "Mon – Thurs | 10 AM to 2 PM",
    cta: "Book Now",
    img: spaTherapyRoom,
    accent: "#B8956A",
  },
  {
    tag: "Women's Special",
    title: "Haircut at ₹799",
    subtitle: "Includes wash, conditioning, serum & blow dry",
    cta: "Grab Offer",
    img: stylingArea,
    accent: "#FFD700",
  },
];

const galleryImages = [
  { src: hairWashBasin, label: "Color & Balayage" },
  { src: stylingArea, label: "Precision Cut" },
  { src: singleSpaRoom, label: "Skin Glow Facial" },
  { src: receptionDesk, label: "Beard Grooming" },
  { src: salonEntrance, label: "Nail Art" },
  { src: spaTherapyRoom, label: "Hair Treatment" },
];

export default function HomePage({ navigate }) {
  const [activeOffer, setActiveOffer] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredGallery, setHoveredGallery] = useState(null);

  // Blue Spa & Salon Database
  const salons = [
    {
      name: "Blue Spa & Salon",
      address: "Raichandani Square, Golden Mile Rd, Kokapet, Hyderabad, Telangana 500075, India",
      lat: 17.3941,
      lon: 78.3242,
      phone: "+91 81215 00912"
    }
  ];

  const [selectedSalon, setSelectedSalon] = useState(salons[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [userDistance, setUserDistance] = useState(null);
  const [isLocated, setIsLocated] = useState(false);

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  function findNearestSalon() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    setIsLocated(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        let closest = salons[0];
        let minDistance = Infinity;

        salons.forEach((salon) => {
          const dist = calculateDistance(userLat, userLon, salon.lat, salon.lon);
          if (dist < minDistance) {
            minDistance = dist;
            closest = salon;
          }
        });

        setSelectedSalon(closest);
        setUserDistance(minDistance);
        setIsLocating(false);
        setIsLocated(true);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "Could not access your location. Showing default salon.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Showing default salon.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable. Showing default salon.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out. Showing default salon.";
        }
        setLocationError(errorMsg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const scrollToServices = () => {
    document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ paddingTop: "0" }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .marquee-track {
            animation: marquee 35s linear infinite;
          }
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
        `}
      </style>
      {/* ── PREMIUM HERO SECTION ── */}
      <section style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        paddingTop: "80px",
      }}>
        {/* Background image with improved overlay */}
        <img
          src={receptionWaitingArea}
          alt="Salon hero"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
          }}
        />
        {/* Sophisticated gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.72) 40%, rgba(10,10,10,0.35) 100%)",
        }} />

        <div style={{
          position: "relative", zIndex: 2,
          margin: "0 auto",
          alignItems: "center", width: "100%",
        }}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-[1200px] px-6 py-12 md:py-20"
        >
          <div style={{ animation: "fadeInUp 1s ease-out" }}>
            <span style={{
              display: "inline-block", fontSize: "11px", letterSpacing: "4px",
              textTransform: "uppercase", color: "#B8956A",
              background: "rgba(184,149,106,0.2)", border: "1px solid rgba(184,149,106,0.4)",
              padding: "10px 18px", borderRadius: "999px", marginBottom: "28px",
              fontWeight: "600",
            }}>
              ✨ Premium Salon • Hyderabad
            </span>
            <h1 style={{
              fontSize: "clamp(36px, 7vw, 76px)", fontWeight: "900",
              color: "white", lineHeight: "1.08", margin: "0 0 28px 0",
              letterSpacing: "-1.5px",
            }}>
              Redefine<br /><span style={{ color: "#D4A574", backgroundImage: "linear-gradient(135deg, #D4A574, #B8956A)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Your</span><br />Beauty.
            </h1>
            <p style={{ color: "#D0C8C0", fontSize: "16px", md: "18px", lineHeight: "1.8", marginBottom: "40px", maxWidth: "480px", fontWeight: "300" }} className="text-sm md:text-lg">
              Professional styling, skincare & rejuvenation all in one place.
            </p>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <button onClick={() => navigate("booking")} style={{
                background: "linear-gradient(135deg, #D4A574, #B8956A)", color: "white", border: "none",
                borderRadius: "12px", fontSize: "15px",
                fontWeight: "700", cursor: "pointer",
                boxShadow: "0 12px 40px rgba(184,149,106,0.35)",
                transition: "all 0.3s",
              }}
                className="px-6 py-4 sm:px-8 sm:py-4.5"
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 50px rgba(184,149,106,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(184,149,106,0.35)"; }}>
                Book Appointment
              </button>
              <button
                onClick={scrollToServices}
                style={{
                  background: "transparent", color: "white",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer",
                  transition: "all 0.3s",
                }}
                className="px-6 py-4 sm:px-8 sm:py-4.5"
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent"; }}
              >
                Explore Services
              </button>
            </div>
          </div>

          {/* Enhanced stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {stats.map((s, idx) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(20px)",
                borderRadius: "20px",
                transition: "all 0.3s",
                animation: `slideInUp ${0.5 + idx * 0.1}s ease-out`,
              }}
                className="p-4 sm:p-8"
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ fontSize: "28px", sm: "36px", fontWeight: "900", color: "#D4A574", marginBottom: "8px" }} className="text-2xl sm:text-4xl">{s.value}</div>
                <div style={{ fontSize: "12px", sm: "14px", color: "#B8B0A8", fontWeight: "500" }} className="text-xs sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator (raised slightly to clear marquee) */}
        <div style={{
          position: "absolute", bottom: "75px", left: "50%", transform: "translateX(-50%)",
          zIndex: 3, animation: "bounce 2s infinite",
        }}>
          <div style={{
            width: "30px", height: "50px", border: "2px solid rgba(255,255,255,0.4)",
            borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "4px", height: "8px", background: "rgba(255,255,255,0.6)",
              borderRadius: "2px", animation: "moveDown 1.5s infinite",
            }} />
          </div>
        </div>

        {/* ── CONTINUOUS RECURSIVE TICKER LINE ── */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          background: "linear-gradient(135deg, #D4A574, #B8956A)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          padding: "16px 0",
          overflow: "hidden",
          zIndex: 4,
          display: "flex",
          alignItems: "center"
        }}>
          <div className="marquee-track" style={{
            display: "flex",
            width: "max-content",
            whiteSpace: "nowrap"
          }}>
            {/* Part 1 */}
            <div style={{ display: "inline-flex", gap: "60px", paddingRight: "60px" }}>
              {Array(4).fill([
                "BLUE SPA & SALON",
                "PREMIUM SALON EXPERIENCE",
                "HAIR & SKIN BEAUTY",
                "WHERE BEAUTY MEETS CARE"
              ]).flat().map((text, idx) => (
                <span key={idx} style={{
                  fontSize: "13px",
                  fontWeight: "900",
                  letterSpacing: "4px",
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center"
                }}>
                  {text} <span style={{ marginLeft: "60px", color: "rgba(255, 255, 255, 0.25)" }}>✦</span>
                </span>
              ))}
            </div>
            {/* Part 2 (Seamless loop replica) */}
            <div style={{ display: "inline-flex", gap: "60px", paddingRight: "60px" }}>
              {Array(4).fill([
                "BLUE SPA & SALON",
                "PREMIUM SALON EXPERIENCE",
                "HAIR & SKIN BEAUTY",
                "WHERE BEAUTY MEETS CARE"
              ]).flat().map((text, idx) => (
                <span key={`dup-${idx}`} style={{
                  fontSize: "13px",
                  fontWeight: "900",
                  letterSpacing: "4px",
                  color: "#D4A574",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center"
                }}>
                  {text} <span style={{ marginLeft: "60px", color: "rgba(255,255,255,0.7)" }}>✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ── AI AGENTS SECTION ── */}
      <section style={{ background: "#FFFBF7", position: "relative", overflow: "hidden" }} className="py-16 md:py-28 px-4 sm:px-8">
        <div style={{
          position: "absolute", top: "-100px", left: "-100px", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(212,165,116,0.1) 0%, transparent 70%)",
          borderRadius: "50%", zIndex: 0,
        }} />
        <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#B8956A", marginBottom: "12px", fontWeight: "700" }}>🤖 AI Powered</div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "900", color: "#1C1C1C", margin: "0", letterSpacing: "-1px" }} className="font-display">Get Expert Beauty Advice</h2>
            <p style={{ color: "#7A7A7A", marginTop: "16px", fontSize: "16px", maxWidth: "600px", margin: "16px auto 0" }}>Chat with our AI assistant or speak directly with Priya, our virtual beauty expert. Get personalized recommendations anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Voice Agent Card */}
            <div style={{
              background: "white", borderRadius: "24px", padding: "40px 24px", boxShadow: "0 8px 24px rgba(212,165,116,0.18)",
              border: "1px solid #E8E0D8", transition: "all 0.3s", textAlign: "center",
              animation: "slideInUp 0.6s ease-out",
            }}
              className="sm:p-8 md:p-10"
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 50px rgba(212,165,116,0.35)"; e.currentTarget.style.transform = "translateY(-6px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.18)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ fontSize: "60px", marginBottom: "16px" }}>🎙️</div>
              <h3 style={{ fontSize: "24px", fontWeight: "900", color: "#1C1C1C", margin: "0 0 12px 0" }}>Voice Call</h3>
              <p style={{ color: "#7A7A7A", fontSize: "15px", lineHeight: "1.6", marginBottom: "28px" }}>Speak with Priya, our AI beauty consultant. Get instant advice on haircuts, treatments, and styling tips.</p>
              <button
                onClick={() => {
                  const event = new CustomEvent("open-voice-agent");
                  window.dispatchEvent(event);
                }}
                style={{
                  width: "100%", background: "linear-gradient(135deg, #D4A574, #B8956A)",
                  color: "white", border: "none", padding: "14px 28px", borderRadius: "12px",
                  fontWeight: "700", fontSize: "15px", cursor: "pointer",
                  transition: "all 0.3s", boxShadow: "0 8px 20px rgba(184,149,106,0.25)",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(184,149,106,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(184,149,106,0.25)"; }}>
                Start Voice Call →
              </button>
            </div>

            {/* Chat Agent Card */}
            <div style={{
              background: "white", borderRadius: "24px", padding: "40px 24px", boxShadow: "0 8px 24px rgba(212,165,116,0.18)",
              border: "1px solid #E8E0D8", transition: "all 0.3s", textAlign: "center",
              animation: "slideInUp 0.7s ease-out",
            }}
              className="sm:p-8 md:p-10"
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 50px rgba(212,165,116,0.35)"; e.currentTarget.style.transform = "translateY(-6px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,165,116,0.18)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ fontSize: "60px", marginBottom: "16px" }}>💬</div>
              <h3 style={{ fontSize: "24px", fontWeight: "900", color: "#1C1C1C", margin: "0 0 12px 0" }}>Chat with AI</h3>
              <p style={{ color: "#7A7A7A", fontSize: "15px", lineHeight: "1.6", marginBottom: "28px" }}>Text our AI assistant for beauty tips, product recommendations, and salon information. Available 24/7.</p>
              <button
                onClick={() => {
                  const event = new CustomEvent("open-ai-chat");
                  window.dispatchEvent(event);
                }}
                style={{
                  width: "100%", background: "transparent", color: "#D4A574",
                  border: "2px solid #D4A574", padding: "12px 28px", borderRadius: "12px",
                  fontWeight: "700", fontSize: "15px", cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#D4A574"; e.currentTarget.style.color = "white"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#D4A574"; }}>
                Open Chat →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PREMIUM SERVICES SECTION ── */}
      <section id="services-section" style={{ background: "white", position: "relative", overflow: "hidden" }} className="py-16 md:py-28 px-4 sm:px-8">
        {/* Decorative elements */}
        <div style={{
          position: "absolute", top: "0", left: "-100px", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(212,165,116,0.08) 0%, transparent 70%)",
          borderRadius: "50%", zIndex: 0,
        }} />
        <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#B8956A", marginBottom: "12px", fontWeight: "700" }}>Our Expertise</div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "900", color: "#1C1C1C", margin: "0", letterSpacing: "-1px" }} className="font-display">Premium Services</h2>
            <p style={{ color: "#7A7A7A", marginTop: "20px", fontSize: "17px", maxWidth: "600px", margin: "20px auto 0" }}>Expertly crafted treatments tailored to enhance your natural beauty and boost your confidence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((s, i) => (
              <div
                key={s.title}
                style={{
                  background: "white", borderRadius: "20px", overflow: "hidden",
                  border: hoveredCard === i ? "2px solid #B8956A" : "1px solid #E8E0D8",
                  boxShadow: hoveredCard === i ? "0 20px 50px rgba(184,149,106,0.2)" : "0 4px 12px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: hoveredCard === i ? "translateY(-8px)" : "translateY(0)",
                }}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Card image */}
                <div style={{ height: "200px", overflow: "hidden", position: "relative" }}>
                  <img
                    src={s.img}
                    alt={s.title}
                    style={{
                      width: "100%", height: "100%", objectFit: "cover",
                      transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: hoveredCard === i ? "scale(1.08)" : "scale(1)",
                    }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
                  }} />
                  <span style={{
                    position: "absolute", top: "16px", right: "16px",
                    fontSize: "28px", background: "rgba(255,255,255,0.95)",
                    borderRadius: "12px", width: "48px", height: "48px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}>{s.icon}</span>
                </div>
                {/* Card body */}
                <div className="p-6 sm:p-7">
                  <h3 style={{ fontSize: "19px", fontWeight: "700", color: "#1C1C1C", margin: "0 0 10px 0", letterSpacing: "-0.3px" }}>{s.title}</h3>
                  <p style={{ fontSize: "15px", color: "#7A7A7A", lineHeight: "1.7", marginBottom: "20px" }}>{s.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#B8956A", fontWeight: "800", fontSize: "16px" }}>{s.price}</span>
                    <button onClick={() => navigate("booking")} style={{
                      fontSize: "13px", color: "white",
                      border: "none", padding: "9px 22px", borderRadius: "8px",
                      background: "#B8956A", cursor: "pointer",
                      fontWeight: "700",
                      transition: "all 0.3s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#A07850"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#B8956A"; e.currentTarget.style.transform = "translateY(0)"; }}>
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREMIUM OFFERS SECTION ── */}
      <section style={{ background: "linear-gradient(135deg, #F5F0EA 0%, #FFFBF7 100%)", position: "relative", overflow: "hidden" }} className="py-16 md:py-24 px-4 sm:px-8">
        {/* Decorative elements */}
        <div style={{
          position: "absolute", top: "-50px", right: "-50px", width: "300px", height: "300px",
          background: "radial-gradient(circle, rgba(212,165,116,0.1) 0%, transparent 70%)",
          borderRadius: "50%", zIndex: 0,
        }} />
        <div style={{
          maxWidth: "900px", margin: "0 auto",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#B8956A", marginBottom: "12px", fontWeight: "700" }}>⏰ Time-Limited Offers</div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 42px)", fontWeight: "900", color: "#1C1C1C", margin: "0", letterSpacing: "-1px" }} className="font-display">Exclusive Deals Today</h2>
            <p style={{ color: "#7A7A7A", marginTop: "16px", fontSize: "16px" }}>Limited-time offers designed to give you premium beauty at exceptional value.</p>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "40px", flexWrap: "wrap" }}>
            {offers.map((o, i) => (
              <button key={i} onClick={() => setActiveOffer(i)} style={{
                padding: "10px 24px", borderRadius: "999px", fontSize: "14px",
                fontWeight: "600", cursor: "pointer", border: "none",
                background: activeOffer === i ? "#B8956A" : "#FFFFFF",
                color: activeOffer === i ? "white" : "#4A4A4A",
                transition: "all 0.3s",
                boxShadow: activeOffer === i ? "0 8px 24px rgba(184,149,106,0.25)" : "0 2px 8px rgba(0,0,0,0.08)",
              }}
                onMouseEnter={e => { if (activeOffer !== i) e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { if (activeOffer !== i) e.currentTarget.style.transform = "translateY(0)"; }}>
                {o.tag}
              </button>
            ))}
          </div>

          {/* Offer card with enhanced design */}
          <div style={{
            position: "relative", borderRadius: "28px", overflow: "hidden",
            minHeight: "350px", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)", transition: "all 0.4s",
          }}>
            <img
              src={offers[activeOffer].img}
              alt={offers[activeOffer].tag}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%", objectFit: "cover",
                transition: "transform 0.6s",
              }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 100%)",
            }} />
            <div style={{ position: "relative", zIndex: 2, textAlign: "center", color: "white" }} className="px-5 py-12 sm:px-12 sm:py-16">
              <div style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", opacity: 0.8, marginBottom: "16px", fontWeight: "700" }}>
                {offers[activeOffer].tag}
              </div>
              <h3 style={{
                fontSize: "clamp(28px, 6vw, 52px)", fontWeight: "900",
                color: offers[activeOffer].accent, margin: "0 0 16px 0", letterSpacing: "-1px",
              }} className="font-display">
                {offers[activeOffer].title}
              </h3>
              <p style={{ opacity: 0.85, marginBottom: "36px", fontSize: "16px", sm: "17px", maxWidth: "500px", margin: "0 auto 36px" }}>{offers[activeOffer].subtitle}</p>
              <button onClick={() => navigate("booking")} style={{
                background: offers[activeOffer].accent, color: "#1C1C1C",
                border: "none", padding: "16px 40px", borderRadius: "12px",
                fontWeight: "800", cursor: "pointer", fontSize: "16px",
                transition: "all 0.3s",
                boxShadow: `0 8px 24px ${offers[activeOffer].accent}40`,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${offers[activeOffer].accent}60`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 24px ${offers[activeOffer].accent}40`; }}>
                {offers[activeOffer].cta} →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY SECTION ── */}
      <section id="gallery-section" style={{ background: "#F5F0EA", position: "relative", overflow: "hidden" }} className="py-16 md:py-28 px-4 sm:px-8">
        <div style={{
          position: "absolute", bottom: "-100px", right: "-100px", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(212,165,116,0.08) 0%, transparent 70%)",
          borderRadius: "50%", zIndex: 0,
        }} />
        <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#B8956A", marginBottom: "12px", fontWeight: "700" }}>Our Portfolio</div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "900", color: "#1C1C1C", margin: "0", letterSpacing: "-1px" }} className="font-display">Transformation Gallery</h2>
            <p style={{ color: "#7A7A7A", marginTop: "20px", fontSize: "17px" }}>A showcase of beautiful transformations and expert craftsmanship.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[240px]">
            {galleryImages.map((g, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  transition: "all 0.4s",
                }}
                className={`rounded-2xl overflow-hidden ${i === 0 ? "col-span-1 md:col-span-2" : "col-span-1"}`}
                onMouseEnter={() => setHoveredGallery(i)}
                onMouseLeave={() => setHoveredGallery(null)}
              >
                <img
                  src={g.src}
                  alt={g.label}
                  style={{
                    width: "100%", height: "100%", objectFit: "cover",
                    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: hoveredGallery === i ? "scale(1.08)" : "scale(1)",
                  }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: hoveredGallery === i
                    ? "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.15))"
                    : "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
                  transition: "background 0.3s",
                }} />
                <div style={{
                  position: "absolute", bottom: "20px", left: "20px",
                  color: "white", fontWeight: "800", fontSize: "15px",
                  letterSpacing: "0.05em",
                  opacity: hoveredGallery === i ? 1 : 0.85,
                  transition: "opacity 0.3s",
                }}>
                  {g.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREMIUM CTA BANNER ── */}
      <section style={{ background: "linear-gradient(135deg, #1C1C1C 0%, #2D2D2D 100%)", textAlign: "center", position: "relative", overflow: "hidden" }} className="py-16 md:py-24 px-4 sm:px-8">
        {/* Decorative elements */}
        <div style={{
          position: "absolute", top: "-150px", left: "-150px", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(212,165,116,0.1) 0%, transparent 70%)",
          borderRadius: "50%", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", bottom: "-150px", right: "-150px", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(212,165,116,0.1) 0%, transparent 70%)",
          borderRadius: "50%", zIndex: 0,
        }} />
        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: "900", color: "white", margin: "0 0 20px 0", letterSpacing: "-1px" }} className="font-display">
            Ready for a <span style={{ color: "#D4A574" }}>Premium Transformation?</span>
          </h2>
          <p style={{ color: "#B8B0A8", fontSize: "16px", md: "18px", marginBottom: "40px", lineHeight: "1.7", maxWidth: "600px", margin: "0 auto 40px" }} className="text-sm md:text-lg">
            Book your appointment today and experience luxury beauty crafted just for you. Limited slots available.
          </p>
          <button onClick={() => navigate("booking")} style={{
            background: "linear-gradient(135deg, #D4A574, #B8956A)", color: "white", border: "none",
            borderRadius: "12px", fontSize: "16px",
            fontWeight: "800", cursor: "pointer",
            boxShadow: "0 12px 40px rgba(212,165,116,0.35)",
            transition: "all 0.3s",
            letterSpacing: "-0.3px",
          }}
            className="px-8 py-5 sm:px-12"
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 50px rgba(212,165,116,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(212,165,116,0.35)"; }}>
            Reserve Your Spot Now →
          </button>
        </div>
      </section>

      {/* ── PREMIUM REVIEWS SECTION ── */}
      <section style={{ background: "#F5F0EA", position: "relative", overflow: "hidden" }} className="py-16 md:py-28 px-4 sm:px-8">
        <div style={{
          position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(212,165,116,0.1) 0%, transparent 70%)",
          borderRadius: "50%", zIndex: 0,
        }} />
        <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "56px", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#B8956A", marginBottom: "12px", fontWeight: "700" }}>Client Testimonials</div>
              <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "900", color: "#1C1C1C", margin: "0", letterSpacing: "-1px" }} className="font-display">Loved by Hundreds</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "14px 24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <span style={{ color: "#D4A574", fontSize: "22px", letterSpacing: "2px" }}>★★★★★</span>
              <div>
                <div style={{ color: "#1C1C1C", fontWeight: "800", fontSize: "15px" }}>4.9 out of 5</div>
                <div style={{ color: "#9A9A9A", fontSize: "13px" }}>949+ Google Reviews</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {reviews.map((r, idx) => (
              <div key={r.name} style={{
                background: "white", borderRadius: "20px", padding: "36px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                border: "1px solid #E8E0D8", transition: "all 0.3s",
                animation: `slideInUp ${0.5 + idx * 0.1}s ease-out`,
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ color: "#D4A574", fontSize: "20px", marginBottom: "16px", letterSpacing: "1px" }}>{"★".repeat(r.rating)}</div>
                <p style={{ color: "#4A4A4A", lineHeight: "1.8", marginBottom: "24px", fontSize: "15px" }}>&ldquo;{r.text}&rdquo;</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #F0EBE5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #D4A574, #B8956A)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "16px" }}>{r.name[0]}</div>
                    <div>
                      <span style={{ fontWeight: "700", color: "#1C1C1C", fontSize: "15px", display: "block" }}>{r.name}</span>
                      <span style={{ fontSize: "13px", color: "#9A9A9A" }}>Verified Customer</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "13px", color: "#9A9A9A" }}>{r.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREMIUM FOOTER ── */}
      <footer id="contact-section" style={{ background: "linear-gradient(135deg, #1C1C1C 0%, #252525 100%)", color: "white" }} className="pt-16 pb-8 px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 max-w-[1400px] mx-auto mb-16">

          {/* Map Integration (Left Side) */}
          <div className="lg:col-span-7">
            <div style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#D4A574", marginBottom: "8px", fontWeight: "700" }}>
              📍 Salon Locator
            </div>
            <h3 style={{ fontSize: "28px", fontWeight: "900", color: "white", margin: "0 0 24px 0", letterSpacing: "-0.5px" }} className="font-display">
              Find Nearest Blue Spa & Salon
            </h3>

            {/* Styled Map Card with Glassmorphic design */}
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(12px)",
              borderRadius: "24px",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)"
            }}
              className="p-5 sm:p-7"
            >
              {/* Map Iframe */}
              <iframe
                title="Blue Spa & Salon Map"
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: "16px", marginBottom: "20px", background: "#1a1a1a" }}
                loading="lazy"
                allowFullScreen
                src="https://maps.google.com/maps?q=Raichandani%20Square%20Kokapet%20Hyderabad&z=15&output=embed"
              ></iframe>

              {/* Active Salon details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#D4A574" }}>
                    {selectedSalon.name}
                  </span>
                  {userDistance !== null && (
                    <span style={{
                      fontSize: "12px",
                      background: "rgba(212, 165, 116, 0.2)",
                      border: "1px solid rgba(212, 165, 116, 0.4)",
                      color: "#D4A574",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      🏃 {userDistance < 1 ? `${(userDistance * 1000).toFixed(0)}m` : `${userDistance.toFixed(1)} km`} away
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#B8B0A8", fontSize: "14px", lineHeight: "1.5" }}>
                  <span style={{ fontSize: "16px" }}>📍</span>
                  <span>{selectedSalon.address}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#B8B0A8", fontSize: "14px" }}>
                  <span style={{ fontSize: "16px" }}>📞</span>
                  <a href={`tel:${selectedSalon.phone.replace(/\s+/g, '')}`} style={{ color: "#D4A574", textDecoration: "none", fontWeight: "600" }}>
                    {selectedSalon.phone}
                  </a>
                </div>

                {locationError && (
                  <div style={{
                    fontSize: "13px",
                    color: "#ffc107",
                    background: "rgba(255, 193, 7, 0.1)",
                    border: "1px solid rgba(255, 193, 7, 0.2)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    marginTop: "4px"
                  }}>
                    💡 {locationError}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={findNearestSalon}
                  disabled={isLocating}
                  style={{
                    background: "linear-gradient(135deg, #D4A574, #B8956A)",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.3s",
                    boxShadow: "0 4px 12px rgba(184,149,106,0.2)"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(184,149,106,0.35)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(184,149,106,0.2)";
                  }}
                >
                  {isLocating ? (
                    <>
                      <span style={{
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        border: "2px solid white",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite"
                      }}></span>
                      Finding Nearest...
                    </>
                  ) : "📍 Locate Blue Spa & Salon"}
                </button>

                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Raichandani+Square+Golden+Mile+Rd+Kokapet+Hyderabad+Telangana+500075"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "white",
                    textDecoration: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontWeight: "700",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)"; }}
                >
                  🗺️ Get Directions
                </a>
              </div>

            </div>
          </div>

          {/* Left Parts moved to Right Side (Brand & Touch Info stacked vertically) */}
          <div className="lg:col-span-5 flex flex-col gap-10 justify-center">

            {/* Brand Logo & Description */}
            <div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.5px", color: "white", fontFamily: "'Playfair Display', serif" }}>
                  Blue Spa
                </span>
                <span style={{ fontSize: "32px", fontWeight: "300", color: "#D4A574", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                  & Salon
                </span>
              </div>
              <p style={{ color: "#D4A574", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", fontWeight: "700", marginTop: "2px", marginBottom: "16px" }}>
                Where beauty meets care 💙
              </p>
              <p style={{ color: "#B8B0A8", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                Professional styling, skincare & rejuvenation all in one place.
              </p>
            </div>

            {/* Get in Touch Info */}
            <div>
              <h4 style={{ fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase", color: "#D4A574", marginBottom: "22px", fontWeight: "800" }}>Get in Touch</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "#B8B0A8", fontSize: "14px" }}>
                
                {/* Phone */}
                <a href="tel:+918121500912" style={{ display: "flex", alignItems: "center", gap: "12px", color: "#B8B0A8", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#B8B0A8"; }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(212,165,116,0.1)", color: "#D4A574" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/></svg>
                  </div>
                  <span style={{ fontWeight: "600" }}>+91 81215 00912</span>
                </a>

                {/* Email */}
                <a href="mailto:bluespasaloon@gmail.com" style={{ display: "flex", alignItems: "center", gap: "12px", color: "#B8B0A8", textDecoration: "none", transition: "all 0.2s", wordBreak: "break-all" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#B8B0A8"; }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(212,165,116,0.1)", color: "#D4A574" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  </div>
                  <span style={{ fontWeight: "600" }}>bluespasaloon@gmail.com</span>
                </a>

                {/* Address */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", lineHeight: "1.5" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(212,165,116,0.1)", color: "#D4A574", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  </div>
                  <span>Shop No. 302, 3rd Floor, Raichandani Square, Golden Mile Rd, Kokapet, Hyderabad, Telangana 500075, India</span>
                </div>

                {/* Hours */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(212,165,116,0.1)", color: "#D4A574" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                  </div>
                  <span>Daily: 10:00 AM - 9:00 PM</span>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Divider */}
        <div className="max-w-[1400px] mx-auto border-t border-white/10 pt-10 flex flex-col sm:flex-row justify-between items-center gap-5 text-center sm:text-left">
          <div style={{ color: "#7A7A7A", fontSize: "14px" }}>
            © 2026 Blue Spa & Salon. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: "20px", color: "#7A7A7A", fontSize: "14px" }}>
            <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#7A7A7A"; }}>
              Privacy Policy
            </button>
            <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#D4A574"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#7A7A7A"; }}>
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* ── Floating Call button — bottom left ── */}
      <div
        onClick={() => window.open("tel:+918121500912")}
        title="Call us"
        style={{
          position: "fixed", bottom: "28px", left: "24px", zIndex: 999,
          background: "#25D366", color: "white",
          width: "56px", height: "56px", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z" />
        </svg>
      </div>
      {/* ── Floating WhatsApp button — bottom right ── */}
      <div
        onClick={() => window.open("https://wa.me/918121500912", "_blank")}
        title="WhatsApp us"
        style={{
          position: "fixed", bottom: "28px", right: "24px", zIndex: 999,
          background: "#25D366", color: "white",
          width: "56px", height: "56px", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.849L.057 23.571a.75.75 0 00.918.918l5.797-1.488A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 01-4.953-1.355l-.355-.212-3.683.945.981-3.586-.232-.369A9.712 9.712 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
        </svg>
      </div>

      <GeminiChatSidebar navigate={navigate} />
      <VirtualAssistantCard popupOnly={true} />
    </div>
  );
}

import { useState, useEffect } from "react";

const API = `${import.meta.env.VITE_API_URL}/api`;

export default function BillingPage({ navigate }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null); // plan ID currently subscribing to
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("gg_token");
      const res = await fetch(`${API}/billing/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load billing status");
      setStatus(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (planId) => {
    setError("");
    setSubmitting(planId);
    try {
      const token = localStorage.getItem("gg_token");
      const userStr = localStorage.getItem("gg_user") || "{}";
      const user = JSON.parse(userStr);

      const res = await fetch(`${API}/billing/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create subscription");

      if (data.isMock) {
        // Direct mock verification
        const verifyRes = await fetch(`${API}/billing/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_subscription_id: data.subscriptionId,
            razorpay_signature: "mock_signature"
          })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.error || "Failed to verify mock payment");
        alert("Subscription activated successfully (Mock Mode)!");
        fetchStatus();
        return;
      }

      // Real Razorpay subscription flow
      const options = {
        key: data.key,
        subscription_id: data.subscriptionId,
        name: "Blue Spa & Salon",
        description: "Vendor Platform Subscription",
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyRes = await fetch(`${API}/billing/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
            alert("Subscription activated successfully!");
            fetchStatus();
          } catch (vErr) {
            alert(vErr.message);
            setLoading(false);
          }
        },
        prefill: {
          name: user.fullName || "Salon Vendor",
          email: user.email || "",
          contact: user.phone || ""
        },
        theme: {
          color: "#2563EB"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your active subscription? You will lose access to the AI Voice Assistant immediately.")) return;
    setError("");
    setCancelling(true);
    try {
      const token = localStorage.getItem("gg_token");
      const res = await fetch(`${API}/billing/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel subscription");
      alert("Subscription cancelled successfully.");
      fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8F5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #E8E0D8", borderTop: "3px solid #2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#9A9A9A", fontSize: "14px", fontWeight: "600" }}>Loading billing information...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const statusColors = {
    active: { text: "#B8956A", bg: "rgba(184, 149, 106, 0.1)", border: "rgba(184, 149, 106, 0.3)" },
    trial: { text: "#B8956A", bg: "rgba(184, 149, 106, 0.1)", border: "rgba(184, 149, 106, 0.3)" },
    pending: { text: "#F57F17", bg: "#FFF8E1", border: "#FFE082" },
    cancelled: { text: "#C62828", bg: "#FFEBEE", border: "#EF9A9A" },
    expired: { text: "#7A7A7A", bg: "#F5F5F5", border: "#E0E0E0" }
  };

  const currentStatusStyle = statusColors[status?.subscriptionStatus] || statusColors.expired;

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "#FAF8F5" }}>
      <style>{`
        .plan-card {
          background: white;
          border-radius: 24px;
          border: 1px solid #E8E0D8;
          padding: 40px 32px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.005);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        .plan-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(184, 149, 106, 0.1), 0 10px 10px -5px rgba(184, 149, 106, 0.04);
          border-color: #B8956A;
        }
        .plan-card.active-plan {
          border: 2px solid #B8956A;
          box-shadow: 0 20px 25px -5px rgba(184, 149, 106, 0.08), 0 10px 10px -5px rgba(184, 149, 106, 0.03);
        }
        .plan-card.active-plan:hover {
          box-shadow: 0 25px 30px -5px rgba(184, 149, 106, 0.15), 0 15px 15px -5px rgba(184, 149, 106, 0.06);
        }
        .subscribe-btn {
          width: 100%;
          background: linear-gradient(135deg, #D4A574 0%, #B8956A 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          box-shadow: 0 4px 14px 0 rgba(184, 149, 106, 0.35);
          transition: all 0.3s ease;
          text-transform: uppercase;
        }
        .subscribe-btn:hover {
          background: linear-gradient(135deg, #B8956A 0%, #A37E55 100%);
          box-shadow: 0 6px 20px 0 rgba(184, 149, 106, 0.45);
          transform: translateY(-1px);
        }
        .subscribe-btn:disabled {
          background: #E8E0D8 !important;
          color: #9A9A9A !important;
          box-shadow: none !important;
          cursor: not-allowed;
          transform: none !important;
        }
        .back-btn {
          padding: 10px 24px;
          border-radius: 999px;
          border: 1px solid #E8E0D8;
          background: white;
          color: #4A4A4A;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .back-btn:hover {
          border-color: #B8956A;
          color: #B8956A;
          box-shadow: 0 4px 12px rgba(184, 149, 106, 0.08);
          transform: translateX(-3px);
        }
        .cancel-btn {
          background: #FEE2E2;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          border-radius: 999px;
          padding: 12px 28px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        .cancel-btn:hover {
          background: #FCA5A5;
          color: #991B1B;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
        }
        .history-table th {
          padding: 18px 24px;
          background: #FAF8F5;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #9A9A9A;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          border-bottom: 1px solid #E8E0D8;
        }
        .history-table td {
          padding: 18px 24px;
          border-bottom: 1px solid #E8E0D8;
          font-size: 14px;
          color: #4A4A4A;
        }
        .history-table tr:last-child td {
          border-bottom: none;
        }
        .history-table tr:hover td {
          background: #FAF8F5;
        }
      `}</style>

      <div style={{ maxWidth: "1000px", margin: "0 auto" }} className="px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <div>
            <div style={{ fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", color: "#B8956A", marginBottom: "8px", fontWeight: "800" }}>Administration</div>
            <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#1C1C1C", margin: 0, fontFamily: "'Playfair Display', serif" }}>Subscriptions & Billing</h1>
          </div>
          <button onClick={() => navigate("admin")} className="back-btn">
            <span>←</span> Back to Dashboard
          </button>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", borderRadius: "16px", padding: "16px 20px", marginBottom: "28px", fontSize: "14px", fontWeight: "600" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Current Plan Overview Card */}
        <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E8E0D8", borderLeft: `6px solid ${currentStatusStyle.text}`, padding: "32px", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.02)", marginBottom: "48px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#9A9A9A", fontWeight: "700" }}>Current Status</span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#1C1C1C", margin: 0 }}>
                  {status?.currentPlan ? `${status.currentPlan.name} Plan` : "No Plan"}
                </h2>
                <span style={{ fontSize: "12px", padding: "4px 14px", borderRadius: "999px", fontWeight: "700", textTransform: "uppercase", background: currentStatusStyle.bg, color: currentStatusStyle.text, border: `1px solid ${currentStatusStyle.border}` }}>
                  {status?.subscriptionStatus}
                </span>
              </div>
              
              <div style={{ marginTop: "16px", fontSize: "14px", color: "#4A4A4A", lineHeight: "1.6" }}>
                {status?.subscriptionStatus === "trial" && (
                  <p style={{ margin: 0 }}>
                    💡 You are currently on the trial plan. You have <strong>{status?.trialCallsRemaining}</strong> free AI Voice Calls remaining.
                  </p>
                )}
                {status?.subscriptionStatus === "active" && status?.renewalDate && (
                  <p style={{ margin: 0 }}>
                    📅 Your subscription renews on <strong>{new Date(status.renewalDate).toLocaleDateString("en-IN", { dateStyle: "long" })}</strong>.
                  </p>
                )}
                {status?.subscriptionStatus === "cancelled" && (
                  <p style={{ margin: 0, color: "#DC2626" }}>
                    ❌ Your subscription has been cancelled. Subscribe below to re-enable the AI Voice Assistant.
                  </p>
                )}
              </div>
            </div>

            {status?.subscriptionStatus === "active" && (
              <button 
                onClick={handleCancel}
                disabled={cancelling}
                className="cancel-btn"
              >
                {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            )}
          </div>
        </div>

        {/* Pricing Table Section */}
        <div style={{ marginBottom: "56px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1C1C1C", marginBottom: "8px", fontFamily: "'Playfair Display', serif" }}>Choose a Plan</h2>
          <p style={{ color: "#7A7A7A", fontSize: "15px", marginBottom: "36px" }}>Unlock unlimited AI voice consultations and advanced booking automation.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            {status?.plans && status.plans.map((p) => {
              const isCurrent = status?.currentPlan && status.currentPlan._id === p._id && status?.subscriptionStatus === "active";
              return (
                <div key={p._id} className={`plan-card ${isCurrent ? 'active-plan' : ''}`}>
                  {isCurrent && (
                    <span style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(184, 149, 106, 0.1)", color: "#B8956A", padding: "6px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", border: "1px solid rgba(184, 149, 106, 0.3)" }}>
                      Active Plan
                    </span>
                  )}
                  <div>
                    <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#1C1C1C", margin: "0 0 16px 0" }}>{p.name}</h3>
                    <div style={{ display: "flex", alignItems: "baseline", marginBottom: "28px" }}>
                      <span style={{ fontSize: "38px", fontWeight: "900", color: "#1C1C1C" }}>₹{p.price}</span>
                      <span style={{ fontSize: "14px", color: "#9A9A9A", marginLeft: "4px" }}>/{p.billingCycle}</span>
                    </div>

                    <ul style={{ padding: 0, margin: "0 0 32px 0", listStyle: "none" }}>
                      {p.features.map((f, idx) => (
                        <li key={idx} style={{ fontSize: "14px", color: "#4A4A4A", marginBottom: "14px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8956A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSubscribe(p._id)}
                    disabled={isCurrent || submitting !== null}
                    className="subscribe-btn"
                  >
                    {submitting === p._id ? "Processing..." : isCurrent ? "Active Plan" : "Subscribe Now"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment History Section — Only displayed when there is at least one transaction */}
        {status?.payments && status.payments.length > 0 && (
          <div style={{ animation: "fadeInUp 0.6s ease-out" }}>
            <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1C1C1C", marginBottom: "8px", fontFamily: "'Playfair Display', serif" }}>Payment History</h2>
            <p style={{ color: "#7A7A7A", fontSize: "15px", marginBottom: "28px" }}>Review invoices and transaction logs below.</p>

            <div style={{ background: "white", borderRadius: "24px", border: "1px solid #E8E0D8", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: "32px" }}>Date</th>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th style={{ paddingRight: "32px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {status.payments.map((p) => (
                    <tr key={p._id}>
                      <td style={{ paddingLeft: "32px" }}>{new Date(p.paidAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "13px", color: "#9A9A9A" }}>{p.paymentId}</td>
                      <td style={{ fontWeight: "700", color: "#1C1C1C" }}>₹{p.amount}</td>
                      <td style={{ paddingRight: "32px" }}>
                        <span style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "999px", fontWeight: "700", textTransform: "uppercase", background: p.status === "captured" ? "#DCFCE7" : "#FEE2E2", color: p.status === "captured" ? "#166534" : "#991B1B", border: p.status === "captured" ? "1px solid #BBF7D0" : "1px solid #FECACA" }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

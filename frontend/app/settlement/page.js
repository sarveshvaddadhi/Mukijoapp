"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import MobileShell, { T } from "@/components/MobileShell";

export default function SettlementPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    if (u.phone) setPhone(u.phone);
    loadPendingPayments(u.id);
  }, [router]);

  async function loadPendingPayments(userId) {
    try {
      const res = await fetch(`/api/payments?userId=${userId}&status=PENDING`);
      const data = await res.json();
      setPendingPayments(data.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const totalAmount = pendingPayments.reduce((sum, item) => sum + item.amount, 0);
  const paymentIds = pendingPayments.map((p) => p.id);

  // Phase 1: Click Settle -> Show OTP Modal
  const handleInitiateSettlement = () => {
    if (pendingPayments.length === 0) return;
    setShowOtpModal(true);
  };

  // Phase 2: Send OTP
  const handleSendOtp = async () => {
    if (!phone) { alert("Please enter your mobile number"); return; }
    setSendingOtp(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        setOtpSent(true);
      } else {
        alert("Failed to send OTP. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error sending OTP");
    }
    setSendingOtp(false);
  };

  // Phase 3: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode) { alert("Please enter the OTP"); return; }
    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const data = await res.json();
      
      if (data.verified) {
        setShowOtpModal(false);
        launchRazorpay();
      } else {
        alert("Invalid OTP! Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error verifying OTP");
    }
    setVerifyingOtp(false);
  };

  // Phase 4: Launch Razorpay
  const launchRazorpay = async () => {
    setProcessing(true);
    try {
      // 1. Create order on the backend
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount, paymentIds, userId: user.id }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        alert("Failed to create order");
        setProcessing(false);
        return;
      }

      // 2. Initialize Razorpay Checkout (or bypass if mock)
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key";
      if (rzpKey === "rzp_test_placeholder_key") {
        alert("Mock Mode: Simulating successful payment without opening Razorpay...");
        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderData.order.id,
            razorpay_payment_id: "mock_payment_" + Date.now(),
            razorpay_signature: "mock_signature",
            paymentIds,
          }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.verified || verifyData.message === "Payment verified successfully") {
          alert("Payment successful!");
          loadPendingPayments(user.id);
        }
        setProcessing(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key",
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Mukijo Sports App",
        description: "Fee Settlement",
        order_id: orderData.order.id,
        handler: async function (response) {
          // 3. Verify payment signature on backend
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentIds,
            }),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.verified) {
            alert("Payment successful!");
            loadPendingPayments(user.id);
          } else {
            alert("Payment verification failed. Please contact support.");
          }
          setProcessing(false);
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: phone,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
        setProcessing(false);
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      alert("Error processing payment");
      setProcessing(false);
    }
  };

  const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");

  if (!user) return null;

  return (
    <MobileShell title="Fee Settlement">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: T.sub }}>Loading your dues...</div>
      ) : pendingPayments.length === 0 ? (
        <div style={{ background: T.card, borderRadius: 16, padding: "60px 20px", textAlign: "center", boxShadow: T.shadow }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>You&apos;re all caught up!</h2>
          <p style={{ color: T.sub, fontSize: 14 }}>No pending payments at this time.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Cart Section */}
          <div style={{ background: T.card, borderRadius: 16, boxShadow: T.shadow, overflow: "hidden" }}>
            <div style={{ padding: "14px 14px", borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Pending Dues ({pendingPayments.length})</h2>
            </div>
            
            <div style={{ padding: "12px 14px" }}>
              {pendingPayments.map((item, idx) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: idx < pendingPayments.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.primaryL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {item.type === "MEMBERSHIP" ? "🎟️" : item.type === "EVENT" ? "📅" : "🎁"}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.type}{item.description ? ` – ${item.description}` : ""}</h3>
                      {item.user && item.user.id !== user.id && (
                        <p style={{ fontSize: 11, color: T.primary, fontWeight: 600 }}>🧒 {item.user.name}</p>
                      )}
                      <p style={{ fontSize: 11, color: T.sub }}>Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-IN") : "Anytime"}</p>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{fmt(item.amount)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ background: T.card, borderRadius: 16, boxShadow: T.shadow, padding: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 14 }}>Order Summary</h2>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: T.sub }}>
              <span>Items ({pendingPayments.length}):</span>
              <span>{fmt(totalAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 13, color: T.sub }}>
              <span>Platform Fee:</span>
              <span>₹0</span>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Total:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: T.red }}>{fmt(totalAmount)}</span>
            </div>

            <button onClick={handleInitiateSettlement} disabled={processing} style={{
              width: "100%", padding: "13px", borderRadius: 12,
              background: processing ? T.border : T.primary,
              color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
              cursor: processing ? "not-allowed" : "pointer",
            }}>
              {processing ? "Processing..." : `Settle ${fmt(totalAmount)}`}
            </button>
            <p style={{ textAlign: "center", fontSize: 11, color: T.sub, marginTop: 10 }}>🔒 Secure payments via Razorpay</p>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}>
          <div style={{ background: T.card, width: "min(480px,100vw)", borderRadius: "20px 20px 0 0", padding: "28px 20px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 6 }}>Security Verification</h2>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 20, lineHeight: 1.5 }}>Verify your mobile number to proceed to payment.</p>
            {!otpSent ? (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Mobile Number</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210"
                  style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box" }}/>
                <button onClick={handleSendOtp} disabled={sendingOtp || !phone} style={{ width: "100%", padding: "12px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {sendingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#00AA55", fontWeight: 600, marginBottom: 12 }}>✓ OTP Sent to {phone}</p>
                <input type="text" maxLength="6" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="• • • • • •"
                  style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 22, outline: "none", marginBottom: 14, textAlign: "center", letterSpacing: 8, boxSizing: "border-box" }}/>
                <button onClick={handleVerifyOtp} disabled={verifyingOtp || otpCode.length < 4} style={{ width: "100%", padding: "12px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {verifyingOtp ? "Verifying..." : "Verify & Pay"}
                </button>
              </div>
            )}
            <button onClick={() => { setShowOtpModal(false); setOtpSent(false); }} style={{ width: "100%", padding: "12px", marginTop: 10, borderRadius: 10, background: "transparent", color: T.sub, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

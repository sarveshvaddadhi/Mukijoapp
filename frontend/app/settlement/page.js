"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import AppShell from "@/components/AppShell";

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
    <AppShell searchPlaceholder="Search dues...">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>Fee Settlement</h1>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading your dues...</div>
      ) : pendingPayments.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "16px", padding: "60px 20px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>You&apos;re all caught up!</h2>
          <p style={{ color: "#64748b", fontSize: "14px" }}>You have no pending payments at this time.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px", alignItems: "start" }}>
          {/* Cart Section */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Pending Dues ({pendingPayments.length})</h2>
            </div>
            
            <div style={{ padding: "12px 24px" }}>
              {pendingPayments.map((item, idx) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: idx < pendingPayments.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#2563eb" }}>
                      {item.type === "MEMBERSHIP" ? "🎟️" : item.type === "EVENT" ? "📅" : "🎁"}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                        {item.type} {item.description ? `- ${item.description}` : ""}
                      </h3>
                      {item.user && item.user.id !== user.id && (
                        <p style={{ fontSize: "12px", color: "#6366f1", fontWeight: 700, margin: "2px 0 4px 0" }}>
                          🧒 For Player: {item.user.name}
                        </p>
                      )}
                      <p style={{ fontSize: "12px", color: "#64748b" }}>
                        Due by: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "Anytime"}
                      </p>
                    </div>
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                    {fmt(item.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "20px" }}>Order Summary</h2>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", color: "#64748b" }}>
              <span>Items ({pendingPayments.length}):</span>
              <span>{fmt(totalAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "14px", color: "#64748b" }}>
              <span>Platform Fee:</span>
              <span>₹0</span>
            </div>
            
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Order Total:</span>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "#b91c1c" }}>{fmt(totalAmount)}</span>
            </div>

            <button 
              onClick={handleInitiateSettlement} 
              disabled={processing}
              style={{ 
                width: "100%", padding: "14px", borderRadius: "12px", background: processing ? "#93c5fd" : "#2563eb", 
                color: "#fff", border: "none", fontSize: "15px", fontWeight: 700, cursor: processing ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)", transition: "all 0.2s"
              }}
            >
              {processing ? "Processing..." : `Settle ${fmt(totalAmount)}`}
            </button>
            <p style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", marginTop: "12px" }}>
              Secure payments powered by Razorpay
            </p>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", width: "400px", borderRadius: "20px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Security Verification</h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px", lineHeight: "1.5" }}>
              For your security, please verify your mobile number before proceeding to the payment gateway.
            </p>

            {!otpSent ? (
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Mobile Number</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none", marginBottom: "20px", boxSizing: "border-box" }}
                />
                <button 
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !phone}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", background: (sendingOtp || !phone) ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", fontSize: "14px", fontWeight: 600, cursor: (sendingOtp || !phone) ? "not-allowed" : "pointer" }}
                >
                  {sendingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600, marginBottom: "16px" }}>✓ OTP Sent to {phone}</p>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Enter 6-Digit OTP</label>
                <input 
                  type="text" 
                  maxLength="6"
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="• • • • • •"
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "20px", outline: "none", marginBottom: "20px", textAlign: "center", letterSpacing: "4px", boxSizing: "border-box" }}
                />
                <button 
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length < 4}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", background: (verifyingOtp || otpCode.length < 4) ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", fontSize: "14px", fontWeight: 600, cursor: (verifyingOtp || otpCode.length < 4) ? "not-allowed" : "pointer" }}
                >
                  {verifyingOtp ? "Verifying..." : "Verify & Pay"}
                </button>
              </div>
            )}
            
            <button 
              onClick={() => { setShowOtpModal(false); setOtpSent(false); }}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "transparent", color: "#64748b", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginTop: "8px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

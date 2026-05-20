"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "PLAYER" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const [aadhaarNo, setAadhaarNo] = useState("");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarSendingOtp, setAadhaarSendingOtp] = useState(false);
  const [aadhaarVerifyingOtp, setAadhaarVerifyingOtp] = useState(false);
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarDetails, setAadhaarDetails] = useState(null);
  const [aadhaarError, setAadhaarError] = useState("");
  const [aadhaarTimer, setAadhaarTimer] = useState(0);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let cap = "";
    for (let i = 0; i < 5; i++) cap += chars.charAt(Math.floor(Math.random() * chars.length));
    setCaptchaText(cap);
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Aadhaar OTP countdown timer
  useEffect(() => {
    let t;
    if (aadhaarTimer > 0) {
      t = setTimeout(() => setAadhaarTimer(prev => prev - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [aadhaarTimer]);

  const update = (f) => (e) => {
    setForm(prev => ({ ...prev, [f]: f === "phone" ? e.target.value.replace(/[^0-9 ]/g, "") : e.target.value }));
    setError("");
  };

  const formatAadhaar = (val) => {
    const clean = val.replace(/\D/g, "");
    const parts = [];
    for (let i = 0; i < clean.length && i < 12; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    return parts.join(" ");
  };

  const handleSendAadhaarOtp = async () => {
    setAadhaarError("");
    const cleanNo = aadhaarNo.replace(/\s/g, "");
    if (cleanNo.length !== 12) {
      setAadhaarError("Aadhaar number must be exactly 12 digits.");
      return;
    }

    setAadhaarSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-aadhaar-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaarNo: cleanNo, phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAadhaarError(data.message || "Failed to send Aadhaar OTP.");
        setAadhaarSendingOtp(false);
        return;
      }
      setAadhaarOtpSent(true);
      setAadhaarTimer(59);
    } catch {
      setAadhaarError("Network error. Please try again.");
    } finally {
      setAadhaarSendingOtp(false);
    }
  };

  const handleVerifyAadhaarOtp = async () => {
    setAadhaarError("");
    if (aadhaarOtp.length !== 6) {
      setAadhaarError("OTP must be exactly 6 digits.");
      return;
    }

    setAadhaarVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/verify-aadhaar-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarNo: aadhaarNo.replace(/\s/g, ""),
          code: aadhaarOtp,
          name: form.name
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAadhaarError(data.message || "Invalid OTP code.");
        setAadhaarVerifyingOtp(false);
        return;
      }
      setAadhaarVerified(true);
      setAadhaarDetails(data.details);
      if (data.details.name) {
        setForm(prev => ({ ...prev, name: data.details.name }));
      }
    } catch {
      setAadhaarError("Verification error. Please try again.");
    } finally {
      setAadhaarVerifyingOtp(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return { score: 0, label: "", color: "#e2e8f0" };
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const levels = [
      { label: "Very weak", color: "#dc2626" },
      { label: "Weak", color: "#f97316" },
      { label: "Fair", color: "#d97706" },
      { label: "Good", color: "#16a34a" },
      { label: "Strong", color: "#059669" },
    ];
    return { score: s, ...levels[Math.min(s, levels.length) - 1] || levels[0] };
  })();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) { setError("Please fill in all required fields."); return; }
    if (form.phone.length < 10) { setError("Please enter a valid phone number."); return; }
    if (!aadhaarVerified) { setError("Aadhaar authentication is required to register."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (captchaInput !== captchaText) { setError("Invalid CAPTCHA. Please try again."); generateCaptcha(); return; }
    if (!agreed) { setError("Please agree to the Terms & Conditions."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
          role: form.role,
          aadhaarNo: aadhaarNo.replace(/\s/g, ""),
          aadhaarVerified: true
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Registration failed."); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    alert("Google Sign Up will be available soon! Use email/phone registration for now.");
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#0f172a",
    background: "#fff", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "380px" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "32px" }}>✅</div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>Account Created!</h2>
          <p style={{ color: "#64748b", marginTop: "8px", fontSize: "14px" }}>Welcome to Mukijo. Redirecting to login...</p>
          <div style={{ width: "100%", height: "4px", background: "#e2e8f0", borderRadius: "2px", marginTop: "24px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "100%", background: "#2563eb", borderRadius: "2px", animation: "shrink 2s linear forwards" }} />
          </div>
          <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f1f5f9", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Left Panel */}
      <div style={{
        width: "42%", background: "linear-gradient(145deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 52px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(37,99,235,0.15)" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(37,99,235,0.1)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>Mukijo</div>
            <div style={{ fontSize: "13px", color: "#8c949dff", fontWeight: 500, marginTop: "4px", letterSpacing: "1px" }}>SPORTS MANAGEMENT</div>
          </Link>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", marginBottom: "28px", border: "1px solid rgba(255,255,255,0.2)" }}>🏆</div>
          <h2 style={{ fontSize: "30px", fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: "16px" }}>Join the<br />winning team</h2>
          <p style={{ color: "#7c8288ff", fontSize: "15px", lineHeight: 1.6, maxWidth: "300px" }}>
            Create your free account and start managing your sports team like a pro.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "36px" }}>
            {[
              { num: "1", label: "Create your account" },
              { num: "2", label: "Set up your first team" },
              { num: "3", label: "Invite players & parents" },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(37,99,235,0.3)", border: "1px solid rgba(96,165,250,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#93c5fd" }}>{step.num}</div>
                <span style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 500 }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: "#475569", fontSize: "12px", position: "relative", zIndex: 1 }}>© 2026 Mukijo Sports Management</div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>Create Account</h1>
          <p style={{ color: "#64748b", fontSize: "15px", marginBottom: "24px" }}>Get started with Mukijo Sports</p>

          {/* Google */}
          <button onClick={handleGoogleSignup} style={{
            width: "100%", padding: "12px", borderRadius: "10px",
            border: "1.5px solid #e2e8f0", background: "#fff",
            fontSize: "14px", fontWeight: 600, color: "#374151",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            transition: "background 0.2s", marginBottom: "18px",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>or fill in your details</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "13px", fontWeight: 500, marginBottom: "14px" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Role Selection */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>I am signing up as a *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[
                  { id: "COACH", icon: "👨‍🏫", label: "Coach" },
                  { id: "PLAYER", icon: "🏃‍♂️", label: "Player" },
                  { id: "PARENT", icon: "👨‍👩‍👦", label: "Parent" },
                ].map((r) => (
                  <div key={r.id} onClick={() => setForm(prev => ({ ...prev, role: r.id }))} style={{
                    border: form.role === r.id ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                    background: form.role === r.id ? "#eff6ff" : "#fff",
                    borderRadius: "10px", padding: "12px 6px", textAlign: "center", cursor: "pointer", transition: "all 0.2s"
                  }}>
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>{r.icon}</div>
                    <div style={{ fontSize: "12px", fontWeight: form.role === r.id ? 700 : 500, color: form.role === r.id ? "#1d4ed8" : "#64748b" }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Name */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Full Name *</label>
              <input id="reg-name" value={form.name} onChange={update("name")} placeholder="John Doe" style={inputStyle} required
                onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email Address *</label>
              <input id="reg-email" type="email" value={form.email} onChange={update("email")} placeholder="john@example.com" style={inputStyle} required
                onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Phone Number *</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ ...inputStyle, width: "72px", padding: "12px 10px", textAlign: "center", background: "#f8fafc", color: "#64748b", flexShrink: 0 }}>+91</div>
                <input id="reg-phone" type="tel" value={form.phone} onChange={update("phone")} placeholder="98765 43210" maxLength={12} required
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
              </div>
            </div>

            {/* Aadhaar Verification */}
            <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>Aadhaar Verification *</label>
                {aadhaarVerified && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "3px 8px", borderRadius: "20px" }}>
                    Verified ✓
                  </span>
                )}
              </div>

              {!aadhaarOtpSent && !aadhaarVerified && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    id="reg-aadhaar"
                    type="text"
                    value={aadhaarNo}
                    onChange={(e) => setAadhaarNo(formatAadhaar(e.target.value))}
                    placeholder="12-digit Aadhaar Number"
                    maxLength={14}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                  <button
                    type="button"
                    onClick={handleSendAadhaarOtp}
                    disabled={aadhaarSendingOtp || aadhaarNo.replace(/\s/g, "").length !== 12}
                    style={{
                      padding: "0 18px",
                      background: aadhaarNo.replace(/\s/g, "").length === 12 && !aadhaarSendingOtp ? "#2563eb" : "#e2e8f0",
                      color: aadhaarNo.replace(/\s/g, "").length === 12 && !aadhaarSendingOtp ? "#fff" : "#94a3b8",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: aadhaarNo.replace(/\s/g, "").length === 12 && !aadhaarSendingOtp ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      flexShrink: 0
                    }}
                  >
                    {aadhaarSendingOtp ? "..." : "Send OTP"}
                  </button>
                </div>
              )}

              {aadhaarOtpSent && !aadhaarVerified && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#475569" }}>
                    Enter OTP sent to registered mobile ending in <strong>{form.phone ? form.phone.slice(-4) : "XXXX"}</strong>.
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      id="aadhaar-otp-input"
                      type="text"
                      value={aadhaarOtp}
                      onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      style={{ ...inputStyle, flex: 1, letterSpacing: "4px", textAlign: "center", fontSize: "16px", fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      id="aadhaar-otp-submit"
                      onClick={handleVerifyAadhaarOtp}
                      disabled={aadhaarVerifyingOtp || aadhaarOtp.length !== 6}
                      style={{
                        padding: "0 18px",
                        background: aadhaarOtp.length === 6 && !aadhaarVerifyingOtp ? "#16a34a" : "#e2e8f0",
                        color: aadhaarOtp.length === 6 && !aadhaarVerifyingOtp ? "#fff" : "#94a3b8",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: aadhaarOtp.length === 6 && !aadhaarVerifyingOtp ? "pointer" : "not-allowed",
                        transition: "all 0.2s"
                      }}
                    >
                      {aadhaarVerifyingOtp ? "..." : "Verify"}
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {aadhaarTimer > 0 ? `Resend OTP in ${aadhaarTimer}s` : (
                        <button
                          type="button"
                          onClick={handleSendAadhaarOtp}
                          style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: "11px", cursor: "pointer", padding: 0 }}
                        >
                          Resend OTP
                        </button>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setAadhaarOtpSent(false); setAadhaarOtp(""); setAadhaarError(""); }}
                      style={{ background: "none", border: "none", color: "#dc2626", fontWeight: 600, fontSize: "11px", cursor: "pointer", padding: 0 }}
                    >
                      Change Aadhaar Number
                    </button>
                  </div>
                </div>
              )}

              {aadhaarVerified && aadhaarDetails && (
                <div style={{ background: "#eff6ff", border: "1px dashed #bfdbfe", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontSize: "11px", color: "#1e3a8a", fontWeight: 600 }}>DEMOGRAPHIC DETAILS RETRIEVED:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "4px", fontSize: "12px" }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Name:</span>
                    <span style={{ color: "#0f172a", fontWeight: 700 }}>{aadhaarDetails.name}</span>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Gender:</span>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{aadhaarDetails.gender}</span>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>DOB:</span>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{aadhaarDetails.dob}</span>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Aadhaar:</span>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{aadhaarDetails.aadhaarNo}</span>
                  </div>
                </div>
              )}

              {aadhaarError && (
                <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: 600, marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                  ⚠️ {aadhaarError}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Password *</label>
              <div style={{ position: "relative" }}>
                <input id="reg-password" type={showPass ? "text" : "password"} value={form.password} onChange={update("password")}
                  placeholder="Minimum 6 characters" style={{ ...inputStyle, paddingRight: "44px" }} required
                  onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "16px",
                }}>{showPass ? "🙈" : "👁️"}</button>
              </div>
              {/* Strength Meter */}
              {form.password && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= strength.score ? strength.color : "#e2e8f0", transition: "background 0.3s" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Confirm Password *</label>
              <input id="reg-confirm" type="password" value={form.confirmPassword} onChange={update("confirmPassword")}
                placeholder="Re-enter your password" style={{
                  ...inputStyle,
                  borderColor: form.confirmPassword ? (form.password === form.confirmPassword ? "#16a34a" : "#dc2626") : "#e2e8f0",
                }} required />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>❌ Passwords don&apos;t match</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p style={{ fontSize: "11px", color: "#16a34a", marginTop: "4px" }}>✅ Passwords match</p>
              )}
            </div>

            {/* Captcha */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Security Verification *</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{
                  background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"100%\"><line x1=\"0\" y1=\"10\" x2=\"100%\" y2=\"30\" stroke=\"%23cbd5e1\" stroke-width=\"2\"/><line x1=\"0\" y1=\"30\" x2=\"100%\" y2=\"10\" stroke=\"%23cbd5e1\" stroke-width=\"2\"/></svg>')",
                  backgroundColor: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "10px", width: "120px", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", fontWeight: 900, color: "#1e293b", letterSpacing: "4px", flexShrink: 0, userSelect: "none", fontStyle: "italic"
                }}>
                  {captchaText}
                </div>
                <input type="text" value={captchaInput} onChange={e => setCaptchaInput(e.target.value.toUpperCase())} placeholder="Enter code" style={{ ...inputStyle, flex: 1, letterSpacing: "2px" }} required />
                <button type="button" onClick={generateCaptcha} style={{ background: "#e2e8f0", border: "none", borderRadius: "10px", padding: "0 14px", cursor: "pointer", fontSize: "16px", color: "#475569" }} title="Refresh Captcha">
                  ↻
                </button>
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "12px", color: "#64748b", cursor: "pointer" }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: "2px", accentColor: "#2563eb", width: "16px", height: "16px", cursor: "pointer" }} />
              <span>I agree to the <a href="#" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>Terms of Service</a> and <a href="#" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</a></span>
            </label>

            {/* Submit */}
            <button id="reg-submit" type="submit" disabled={loading} style={{
              width: "100%", padding: "13px", background: loading ? "#93c5fd" : "#2563eb",
              color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1d4ed8"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#2563eb"; }}
            >
              {loading ? (
                <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Creating account...</>
              ) : "Create Account →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#64748b" }}>
            Already have an account?{" "}
            <Link href="/" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
    </div>
  );
}
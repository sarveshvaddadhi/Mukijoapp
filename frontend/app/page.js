"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState("email"); // email | phone
  const [authMethod, setAuthMethod] = useState("password"); // password | otp
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [teamId, setTeamId] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    // Check for teamId in URL parameters
    const params = new URLSearchParams(window.location.search);
    const tId = params.get("teamId");
    if (tId) {
      setTeamId(tId);
      setIsLoginOpen(true); // Auto-open login if team invitation ID is present
    }

    // If user is already logged in, go to their respective dashboard or join page
    const data = localStorage.getItem("mukijo_user");
    if (data) {
      try {
        const u = JSON.parse(data);
        if (tId) {
          router.replace(`/join?teamId=${tId}`);
        } else {
          if (u.role === "PLAYER") router.replace("/calendar");
          else if (u.role === "PARENT") router.replace("/settlement");
          else router.replace("/dashboard");
        }
      } catch (e) {
        // Safe fallback
      }
    }
  }, [router]);

  const cleanPhone = (value) => value.replace(/[^0-9]/g, "");

  const handleSendOtp = async () => {
    setError("");
    const cleanedPhone = cleanPhone(phone);
    if (loginMode !== "phone") {
      setError("OTP login is only available for phone.");
      return;
    }
    if (cleanedPhone.length !== 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanedPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.message || "Failed to send OTP.");
        setSendingOtp(false);
        return;
      }
      setOtpSent(true);
      setError(data.message || "OTP sent. Enter the code to continue.");
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    setError("");
    const cleanedPhone = cleanPhone(phone);
    if (cleanedPhone.length !== 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    if (otpCode.length !== 6) {
      setError("OTP must be exactly 6 digits.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanedPhone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.message || "Invalid OTP.");
        setVerifyingOtp(false);
        return;
      }
      if (data?.user) {
        localStorage.setItem("mukijo_user", JSON.stringify(data.user));
        const u = data.user;
        const params = new URLSearchParams(window.location.search);
        const tId = params.get("teamId");
        if (tId) {
          router.push(`/join?teamId=${tId}`);
        } else {
          if (u.role === "PLAYER") router.push("/calendar");
          else if (u.role === "PARENT") router.push("/settlement");
          else router.push("/dashboard");
        }
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (loginMode === "phone" && authMethod === "otp") {
      handleVerifyLoginOtp();
      return;
    }

    const identifier = loginMode === "email" ? email : phone;
    if (!identifier || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginMode === "email" ? email : undefined, phone: loginMode === "phone" ? phone : undefined, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Login failed."); setLoading(false); return; }
      if (data?.user) { 
        localStorage.setItem("mukijo_user", JSON.stringify(data.user)); 
        const u = data.user;
        const params = new URLSearchParams(window.location.search);
        const tId = params.get("teamId");
        if (tId) {
          router.push(`/join?teamId=${tId}`);
        } else {
          if (u.role === "PLAYER") router.push("/calendar");
          else if (u.role === "PARENT") router.push("/settlement");
          else router.push("/dashboard");
        }
      }
    } catch {
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert("Google Login will be available soon! Use email/phone login for now.");
  };

  const handleAccessApp = () => {
    const data = localStorage.getItem("mukijo_user");
    if (data) {
      try {
        const u = JSON.parse(data);
        if (u.role === "PLAYER") router.push("/calendar");
        else if (u.role === "PARENT") router.push("/settlement");
        else router.push("/dashboard");
      } catch {
        setIsLoginOpen(true);
      }
    } else {
      setIsLoginOpen(true);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#0f172a",
    background: "#fff", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f19", color: "#f8fafc", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      {/* Sticky Premium Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "70px",
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>⚽</span>
          <span style={{ fontSize: "22px", fontWeight: 900, background: "linear-gradient(to right, #6366f1, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Mukijo
          </span>
        </div>

        <div style={{ display: "flex", gap: "30px", fontSize: "14px", fontWeight: 500, color: "#475569" }} className="nav-links">
          <a href="#features" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = '#0f172a'} onMouseLeave={e => e.target.style.color = 'inherit'}>Features</a>
          <a href="#how-it-works" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = '#0f172a'} onMouseLeave={e => e.target.style.color = 'inherit'}>How It Works</a>
          <Link href="/join" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = '#0f172a'} onMouseLeave={e => e.target.style.color = 'inherit'}>Default Team</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => setIsLoginOpen(true)} style={{
            background: "none", border: "none", color: "#334155", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "color 0.2s"
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
            onMouseLeave={e => e.currentTarget.style.color = '#334155'}
          >
            Sign In
          </button>
          <button onClick={handleAccessApp} style={{
            background: "linear-gradient(to right, #4f46e5, #2563eb)", color: "#fff",
            border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px",
            fontWeight: 700, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s"
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            Access App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        paddingTop: "160px", paddingBottom: "100px", paddingLeft: "20px", paddingRight: "20px",
        background: "radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 60%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.1), transparent 60%)",
        textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", position: "relative"
      }}>
        <div style={{
          background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: "99px", padding: "6px 16px", fontSize: "13px", color: "#818cf8",
          fontWeight: 600, marginBottom: "24px"
        }}>
          ⚡ Professional League & Squad Management Platform
        </div>
        <h1 style={{
          fontSize: "56px", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-1.5px",
          color: "#fff", maxWidth: "800px", margin: "0 0 20px"
        }}>
          The All-in-One Dashboard for <span style={{ background: "linear-gradient(to right, #818cf8, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Modern Sports Teams</span>
        </h1>
        <p style={{
          fontSize: "18px", color: "#94a3b8", lineHeight: 1.6, maxWidth: "600px", margin: "0 0 40px"
        }}>
          Streamline scheduling, track biometric attendances, securely collect parent fees via Razorpay, and stay linked with your entire sports squad.
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={handleAccessApp} style={{
            background: "linear-gradient(to right, #4f46e5, #2563eb)", color: "#fff",
            border: "none", borderRadius: "10px", padding: "14px 28px", fontSize: "15px",
            fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(79, 70, 229, 0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Launch Dashboard Portal
          </button>
          <Link href="/join" style={{
            background: "rgba(255,255,255,0.04)", color: "#fff", textDecoration: "none",
            border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "12px 26px",
            fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "inline-block"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
            Join Default Team (Invites)
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: "80px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 800, textAlign: "center", marginBottom: "50px", color: "#fff" }}>
          Engineered for Complete Squad Operations
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {/* Card 1 */}
          <div className="feature-card" style={featureCardStyle}>
            <div style={{ fontSize: "28px", marginBottom: "14px" }}>📅</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>Smart Scheduling & RSVP</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
              Color-coded match, practice, and meeting timelines with real-time player RSVP coordination.
            </p>
          </div>
          {/* Card 2 */}
          <div className="feature-card" style={featureCardStyle}>
            <div style={{ fontSize: "28px", marginBottom: "14px" }}>💳</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>Razorpay Fee Settlement</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
              Secure payment gateways verifying invoices with cryptographic SHA-256 HMAC backend checks.
            </p>
          </div>
          {/* Card 3 */}
          <div className="feature-card" style={featureCardStyle}>
            <div style={{ fontSize: "28px", marginBottom: "14px" }}>🆔</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>Aadhaar Biometric Check</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
              Legally authenticated player registrations with UIDAI database synchronization to prevent spoofing.
            </p>
          </div>
          {/* Card 4 */}
          <div className="feature-card" style={featureCardStyle}>
            <div style={{ fontSize: "28px", marginBottom: "14px" }}>👥</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>Family Linking Module</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
              Direct mapping of parent accounts to child players to easily manage payment settlements and calendar coordination.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: "80px 40px", background: "#0e1320", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "36px", fontWeight: 800, color: "#fff", marginBottom: "40px" }}>Getting Started In Minutes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "30px", textAlign: "left" }}>
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={stepNumberStyle}>1</div>
              <div>
                <h4 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px", color: "#fff" }}>Click "Default Team" or open Invitation Link</h4>
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>Join the default team directly or ask your coach for a team invitation link.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={stepNumberStyle}>2</div>
              <div>
                <h4 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px", color: "#fff" }}>Authenticate Aadhaar & Set Role</h4>
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>Enter your Aadhaar, receive verification OTP, and configure whether you are a Player, Parent, or Coach.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={stepNumberStyle}>3</div>
              <div>
                <h4 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px", color: "#fff" }}>Access dashboard</h4>
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>Your app is ready. Settle pending dues, RSVP to practice sessions, or send group chat messages instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px", textAlign: "center", fontSize: "14px", color: "#64748b", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p>© 2026 Mukijo Sports Management Platform. Built for optimal performance.</p>
      </footer>

      {/* Glassmorphic Login Modal Overlay */}
      {isLoginOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(3, 7, 18, 0.65)", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "20px"
        }}>
          {/* Modal Content Card */}
          <div style={{
            background: "#ffffff", color: "#0f172a",
            width: "100%", maxWidth: "420px", borderRadius: "20px",
            padding: "36px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            position: "relative", boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.15)",
            animation: "modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            {/* Close Button */}
            <button
              onClick={() => { setIsLoginOpen(false); setError(""); }}
              style={{
                position: "absolute", top: "20px", right: "20px",
                background: "#f1f5f9", border: "none", borderRadius: "50%",
                width: "32px", height: "32px", display: "flex",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#64748b", fontSize: "16px",
                fontWeight: "bold", transition: "all 0.2s"
              }}
              onMouseEnter={e => e.target.style.background = '#e2e8f0'}
              onMouseLeave={e => e.target.style.background = '#f1f5f9'}
            >
              ✕
            </button>

            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "6px", letterSpacing: "-0.5px" }}>Welcome back</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>Sign in to your Mukijo account</p>

            {/* Google Login */}
            <button onClick={handleGoogleLogin} style={{
              width: "100%", padding: "12px", borderRadius: "10px",
              border: "1.5px solid #e2e8f0", background: "#fff",
              fontSize: "14px", fontWeight: 600, color: "#374151",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              transition: "background 0.2s, border-color 0.2s", marginBottom: "16px",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>or continue with</span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            </div>

            {/* Email / Phone Toggle */}
            <div style={{ display: "flex", border: "1.5px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
              {[{ key: "email", label: "📧 Email" }, { key: "phone", label: "📱 Phone" }].map(t => (
                <button key={t.key} type="button" onClick={() => { setLoginMode(t.key); setAuthMethod("password"); setOtpSent(false); setOtpCode(""); setError(""); }} style={{
                  flex: 1, padding: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  background: loginMode === t.key ? "#2563eb" : "#fff",
                  color: loginMode === t.key ? "#fff" : "#64748b",
                  transition: "all 0.15s",
                }}>{t.label}</button>
              ))}
            </div>

            {loginMode === "phone" && (
              <div style={{ display: "flex", border: "1.5px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
                {[{ key: "password", label: "🔒 Password" }, { key: "otp", label: "📩 OTP" }].map(t => (
                  <button key={t.key} type="button" onClick={() => { setAuthMethod(t.key); setError(""); if (t.key === "password") { setOtpSent(false); setOtpCode(""); } }} style={{
                    flex: 1, padding: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    background: authMethod === t.key ? "#2563eb" : "#fff",
                    color: authMethod === t.key ? "#fff" : "#64748b",
                    transition: "all 0.15s",
                  }}>{t.label}</button>
                ))}
              </div>
            )}

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "13px", fontWeight: 500, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Email or Phone */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  {loginMode === "email" ? "Email Address" : "Phone Number"}
                </label>
                {loginMode === "email" ? (
                  <input id="login-email" type="email" placeholder="coach@mukijo.com" value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }} required style={inputStyle} />
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ ...inputStyle, width: "64px", padding: "12px 5px", textAlign: "center", background: "#f8fafc", color: "#64748b", flexShrink: 0 }}>+91</div>
                    <input id="login-phone" type="tel" placeholder="98765 43210" value={phone}
                      onChange={e => { setPhone(e.target.value.replace(/[^0-9 ]/g, "")); setError(""); }}
                      required maxLength={12} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                )}
              </div>

              {authMethod === "password" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Password</label>
                    <Link href="/forgot-password" onClick={() => setIsLoginOpen(false)} style={{ fontSize: "11px", color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input id="login-password" type={showPass ? "text" : "password"} placeholder="••••••••" value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }} required
                      style={{ ...inputStyle, paddingRight: "40px" }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "14px", padding: "4px",
                    }}>{showPass ? "🙈" : "👁️"}</button>
                  </div>
                </div>
              )}

              {authMethod === "otp" && loginMode === "phone" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ ...inputStyle, width: "64px", padding: "12px 5px", textAlign: "center", background: "#f8fafc", color: "#64748b", flexShrink: 0 }}>+91</div>
                    <input id="login-phone-otp" type="tel" placeholder="98765 43210" value={phone}
                      onChange={e => { setPhone(cleanPhone(e.target.value)); setError(""); setOtpSent(false); setOtpCode(""); }}
                      maxLength={10} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                  <button type="button" onClick={handleSendOtp} disabled={sendingOtp || cleanPhone(phone).length !== 10} style={{
                    width: "100%", padding: "12px", background: sendingOtp || cleanPhone(phone).length !== 10 ? "#93c5fd" : "#2563eb",
                    color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
                    cursor: sendingOtp || cleanPhone(phone).length !== 10 ? "not-allowed" : "pointer"
                  }}>
                    {sendingOtp ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                  {otpSent && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input id="otp-code" type="tel" placeholder="6-digit OTP" value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                        maxLength={6} style={{ ...inputStyle, flex: 1 }} />
                      <button type="button" onClick={handleVerifyLoginOtp} disabled={verifyingOtp || otpCode.length !== 6} style={{
                        padding: "12px 14px", borderRadius: "10px", background: verifyingOtp || otpCode.length !== 6 ? "#93c5fd" : "#16a34a",
                        color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: verifyingOtp || otpCode.length !== 6 ? "not-allowed" : "pointer"
                      }}>{verifyingOtp ? "Verifying..." : "Verify"}</button>
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <button id="login-submit" type="submit" disabled={loading} style={{
                width: "100%", padding: "12px", background: loading ? "#93c5fd" : "#2563eb",
                color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "10px"
              }}>
                {loading ? (
                  <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Signing in...</>
                ) : "Sign In →"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#64748b" }}>
              Don&apos;t have an account?{" "}
              <Link href={teamId ? `/register?teamId=${teamId}` : "/register"} onClick={() => setIsLoginOpen(false)} style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
                Create account
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Embedded CSS Animations & Styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        * { box-sizing: border-box; }
        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99,102,241,0.3) !important;
          background: rgba(255,255,255,0.05) !important;
          box-shadow: 0 12px 30px -10px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}

// Reusable styling constants
const featureCardStyle = {
  background: "rgba(255, 255, 255, 0.02)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  borderRadius: "16px",
  padding: "32px",
  textAlign: "left",
  transition: "all 0.25s ease",
};

const stepNumberStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "linear-gradient(to right, #4f46e5, #2563eb)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  fontSize: "16px",
  flexShrink: 0,
};
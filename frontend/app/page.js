"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState("email"); // email | phone
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    // If user is already logged in, go to their respective dashboard
    const data = localStorage.getItem("mukijo_user");
    if (data) {
      try {
        const u = JSON.parse(data);
        if (u.role === "PLAYER") router.replace("/calendar");
        else if (u.role === "PARENT") router.replace("/settlement");
        else router.replace("/dashboard");
      } catch (e) {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
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
      if (!res.ok) { setError(data.detail || data.message || "Login failed."); setLoading(false); return; }
      if (data?.user) { 
        localStorage.setItem("mukijo_user", JSON.stringify(data.user)); 
        const u = data.user;
        if (u.role === "PLAYER") router.push("/calendar");
        else if (u.role === "PARENT") router.push("/settlement");
        else router.push("/dashboard");
      }
    } catch {
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Placeholder — in production, integrate with NextAuth or Google OAuth
    alert("Google Login will be available soon! Use email/phone login for now.");
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#0f172a",
    background: "#fff", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f1f5f9", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Left Panel */}
      <div style={{
        width: "45%", background: "linear-gradient(145deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 52px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(37,99,235,0.15)" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(37,99,235,0.1)" }} />
        <div style={{ position: "absolute", top: "40%", right: "10%", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(99,102,241,0.08)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "32px", fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>Mukijo</div>
          <div style={{ fontSize: "13px", color: "#60a5fa", fontWeight: 500, marginTop: "4px", letterSpacing: "1px" }}>SPORTS MANAGEMENT</div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", marginBottom: "28px", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>⚽</div>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: "16px" }}>
            Manage your<br />team with ease
          </h2>
          <p style={{ color: "#93c5fd", fontSize: "15px", lineHeight: 1.6, maxWidth: "320px" }}>
            Track attendance, schedule events, manage payments, and communicate with your entire squad — all in one place.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "36px" }}>
            {["📅 Smart scheduling & calendar sync", "💬 Real-time team communication", "💳 Automated payment tracking"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 16px" }}>
                <span style={{ fontSize: "14px", color: "#e2e8f0", fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: "#475569", fontSize: "12px", position: "relative", zIndex: 1 }}>© 2026 Mukijo Sports Management</div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>Welcome back</h1>
          <p style={{ color: "#64748b", fontSize: "15px", marginBottom: "28px" }}>Sign in to your Mukijo account</p>

          {/* Google Login */}
          <button onClick={handleGoogleLogin} style={{
            width: "100%", padding: "12px", borderRadius: "10px",
            border: "1.5px solid #e2e8f0", background: "#fff",
            fontSize: "14px", fontWeight: 600, color: "#374151",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            transition: "background 0.2s, border-color 0.2s", marginBottom: "20px",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          {/* Email / Phone Toggle */}
          <div style={{ display: "flex", gap: "0", border: "1.5px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
            {[{ key: "email", label: "📧 Email" }, { key: "phone", label: "📱 Phone" }].map(t => (
              <button key={t.key} onClick={() => { setLoginMode(t.key); setError(""); }} style={{
                flex: 1, padding: "10px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                background: loginMode === t.key ? "#2563eb" : "#fff",
                color: loginMode === t.key ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "13px", fontWeight: 500, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Email or Phone */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>
                {loginMode === "email" ? "Email Address" : "Phone Number"}
              </label>
              {loginMode === "email" ? (
                <input id="login-email" type="email" placeholder="coach@mukijo.com" value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ ...inputStyle, width: "72px", padding: "12px 10px", textAlign: "center", background: "#f8fafc", color: "#64748b", flexShrink: 0 }}>+91</div>
                  <input id="login-phone" type="tel" placeholder="98765 43210" value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/[^0-9 ]/g, "")); setError(""); }}
                    required maxLength={12} style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input id="login-password" type={showPass ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }} required
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "16px", padding: "4px",
                }}>{showPass ? "🙈" : "👁️"}</button>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", cursor: "pointer" }}>
                <input type="checkbox" style={{ width: "16px", height: "16px", accentColor: "#2563eb", cursor: "pointer" }} />
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button id="login-submit" type="submit" disabled={loading} style={{
              width: "100%", padding: "13px", background: loading ? "#93c5fd" : "#2563eb",
              color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1d4ed8"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#2563eb"; }}
            >
              {loading ? (
                <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Signing in...</>
              ) : "Sign In →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#64748b" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>Create account</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
    </div>
  );
}
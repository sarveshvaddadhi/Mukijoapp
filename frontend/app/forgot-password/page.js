"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Something went wrong."); setLoading(false); return; }
      setSent(true);
    } catch {
      setError("Server error. Please try again.");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#0f172a",
    background: "#fff", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", fontFamily: "'Inter', -apple-system, sans-serif", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>Mukijo</div>
            <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: 500, letterSpacing: "1px", marginTop: "2px" }}>SPORTS MANAGEMENT</div>
          </Link>
        </div>

        <div style={{ background: "#fff", borderRadius: "18px", padding: "36px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
          {sent ? (
            /* Success State */
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>📧</div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>Check your email</h2>
              <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
                We&apos;ve sent a password reset link to <strong style={{ color: "#0f172a" }}>{email}</strong>. Please check your inbox and follow the instructions.
              </p>
              <div style={{ background: "#fffbeb", border: "1px solid #fef08a", borderRadius: "10px", padding: "12px 16px", fontSize: "12px", color: "#92400e", marginBottom: "20px" }}>
                💡 Don&apos;t see the email? Check your spam/junk folder.
              </div>
              <Link href="/" style={{
                display: "inline-block", padding: "12px 28px", borderRadius: "10px",
                background: "#2563eb", color: "#fff", textDecoration: "none",
                fontSize: "14px", fontWeight: 600,
              }}>← Back to Login</Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "24px" }}>🔒</div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Forgot Password?</h2>
                <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.5 }}>
                  No worries! Enter your registered email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "13px", fontWeight: 500, marginBottom: "16px" }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "7px" }}>Email Address</label>
                  <input id="forgot-email" type="email" placeholder="coach@mukijo.com" value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#2563eb"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                </div>

                <button id="forgot-submit" type="submit" disabled={loading} style={{
                  width: "100%", padding: "13px", background: loading ? "#93c5fd" : "#2563eb",
                  color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1d4ed8"; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#2563eb"; }}
                >
                  {loading ? (
                    <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Sending...</>
                  ) : "Send Reset Link →"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#64748b" }}>
                Remember your password?{" "}
                <Link href="/" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

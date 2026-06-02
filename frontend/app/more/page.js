"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

const MODULES = [
  { label: "Team Chat",       icon: "💬", href: "/messages",       color: "#0057B8" },
  { label: "Payments",        icon: "💳", href: "/payments",       color: "#00AA55" },
  { label: "Attendance",      icon: "✅", href: "/attendance",     color: "#7C3AED" },
  { label: "Venue Booking",   icon: "🏟️", href: "/venue",         color: "#D97706" },
  { label: "Calendar",        icon: "📅", href: "/calendar",       color: "#2563EB" },
  { label: "Fundraising",     icon: "🎯", href: "/fundraising",    color: "#DC2626" },
  { label: "Communication",   icon: "📢", href: "/communication",  color: "#059669" },
  { label: "Fee Settlement",  icon: "🏦", href: "/settlement",     color: "#DB2777" },
  { label: "Discover Games",  icon: "🔍", href: "/discovery",      color: "#0891B2" },
  { label: "My Bookings",     icon: "📋", href: "/bookings",       color: "#65A30D" },
];

export default function MorePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const d = localStorage.getItem("mukijo_user");
    if (!d) { router.replace("/"); return; }
    setUser(JSON.parse(d));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("mukijo_user");
    router.replace("/");
  };

  if (!user) return null;

  return (
    <MobileShell title="More">
      {/* Profile card */}
      <div style={{
        background: T.card, borderRadius: 16, padding: "20px 16px",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: T.shadow, marginBottom: 20,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28,
          background: T.primary, color: "#fff",
          fontSize: 20, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {user.name?.slice(0, 2).toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{user.name}</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>{user.email}</div>
          <div style={{
            marginTop: 6, display: "inline-block",
            background: T.primaryL, color: T.primary,
            fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99,
          }}>{user.role || "Member"}</div>
        </div>
        <button onClick={handleLogout} style={{
          background: "#FEF2F2", color: "#DC2626",
          border: "none", borderRadius: 10,
          padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Logout</button>
      </div>

      {/* Module grid */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.sub, letterSpacing: 0.8, marginBottom: 10, paddingLeft: 4 }}>
          ALL FEATURES
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {MODULES.map(m => (
            <button key={m.href} onClick={() => router.push(m.href)} style={{
              background: T.card, borderRadius: 14,
              border: `1.5px solid ${T.border}`,
              padding: "18px 8px 14px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              cursor: "pointer", transition: "all 0.15s",
              boxShadow: T.shadow,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = m.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = T.border; }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: m.color + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>{m.icon}</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.text, textAlign: "center", lineHeight: 1.3 }}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* App info */}
      <div style={{
        marginTop: 12, padding: "14px 16px",
        background: T.card, borderRadius: 14, boxShadow: T.shadow,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[
            { label: "Help & Support", href: "#" },
            { label: "Privacy Policy", href: "#" },
            { label: "Terms", href: "#" },
          ].map(l => (
            <button key={l.label} style={{ background: "none", border: "none", fontSize: 12, color: T.sub, cursor: "pointer", fontWeight: 500 }}>
              {l.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: T.sub, textAlign: "center", marginTop: 10 }}>
          Mukijo Sports Management v2.0
        </p>
      </div>
    </MobileShell>
  );
}

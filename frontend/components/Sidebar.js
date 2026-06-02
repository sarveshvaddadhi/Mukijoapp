"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Find Games", href: "/discovery", icon: "🔍" },
  { label: "Groups", href: "/groups", icon: "👥" },
  { label: "Venue Bookings", href: "/bookings", icon: "🏟️" },
  { label: "Venue Portal", href: "/venue", icon: "🏢" },
  { label: "Events", href: "/events", icon: "📋" },
  { label: "Calendar", href: "/calendar", icon: "📅" },
  { label: "Team Chat", href: "/messages", icon: "💬" },
  { label: "Attendance", href: "/attendance", icon: "✅" },
  { label: "Payments", href: "/payments", icon: "💳" },
  { label: "Fee Settlement", href: "/settlement", icon: "🛒" },
  { label: "Fundraising", href: "/fundraising", icon: "🎯" },
];

const bottomItems = [
  { label: "Settings", href: "/settings", icon: "⚙️" },
  { label: "Support", href: "/support", icon: "❓" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "224px",
      minHeight: "100vh",
      background: "#0f172a",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      overflowY: "auto",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 20px 20px" }}>
        <div style={{ color: "#fff", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1 }}>Mukijo</div>
        <div style={{ color: "#818cf8", fontSize: "11px", fontWeight: 500, marginTop: "3px", letterSpacing: "0.5px" }}>Sports Management</div>
      </div>

      {/* New Event Button */}
      <div style={{ padding: "0 16px 24px" }}>
        <Link href="/events?create=true" style={{ textDecoration: "none" }}>
          <button style={{
            width: "100%",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#4338ca"}
            onMouseLeave={e => e.currentTarget.style.background = "#4f46e5"}
          >
            <span style={{ fontSize: "18px", fontWeight: 300 }}>+</span>
            New Event
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 10px" }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "2px",
                color: active ? "#818cf8" : "#94a3b8",
                background: active ? "rgba(79, 70, 229, 0.15)" : "transparent",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
                borderLeft: active ? "2px solid #4f46e5" : "2px solid transparent",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = active ? "#818cf8" : "#94a3b8"; }}
            >
              <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "10px 10px 24px" }}>
        {bottomItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "2px",
                color: active ? "#818cf8" : "#94a3b8",
                background: active ? "rgba(79, 70, 229, 0.15)" : "transparent",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: active ? 600 : 400,
              }}
            >
              <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
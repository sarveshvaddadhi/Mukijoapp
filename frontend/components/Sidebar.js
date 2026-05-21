"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Groups", href: "/groups", icon: "👥" },
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
      background: "#ffffff",
      borderRight: "1px solid #e2e8f0",
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
        <div style={{ color: "#0f172a", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1 }}>Mukijo</div>
        <div style={{ color: "#4f46e5", fontSize: "11px", fontWeight: 600, marginTop: "3px", letterSpacing: "0.5px", textTransform: "uppercase", opacity: 0.9 }}>Sports Management</div>
      </div>

      {/* New Event Button */}
      <div style={{ padding: "0 16px 24px" }}>
        <Link href="/events?create=true" style={{ textDecoration: "none" }}>
          <button style={{
            width: "100%",
            background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, #4338ca 0%, #1d4ed8 100%)";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(79, 70, 229, 0.25)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.15)";
            }}
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
                color: active ? "#4f46e5" : "#475569",
                background: active ? "rgba(79, 70, 229, 0.08)" : "transparent",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: active ? 700 : 500,
                transition: "all 0.15s",
                borderLeft: active ? "3px solid #4f46e5" : "3px solid transparent",
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.color = "#0f172a";
                  e.currentTarget.style.background = "#f8fafc";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.background = "transparent";
                }
              }}
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
                color: active ? "#4f46e5" : "#475569",
                background: active ? "rgba(79, 70, 229, 0.08)" : "transparent",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: active ? 700 : 500,
                transition: "all 0.15s",
                borderLeft: active ? "3px solid #4f46e5" : "3px solid transparent",
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.color = "#0f172a";
                  e.currentTarget.style.background = "#f8fafc";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.color = "#475569";
                  e.currentTarget.style.background = "transparent";
                }
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
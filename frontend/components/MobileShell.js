"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export const T = {
  bg: "#F2F4F7",
  card: "#FFFFFF",
  primary: "#0057B8",
  primaryL: "#E8F0FB",
  green: "#00AA55",
  red: "#E53935",
  text: "#1C1C1E",
  sub: "#6B7280",
  border: "#E5E7EB",
  shadow: "0 1px 3px rgba(0,0,0,0.08)",
  navH: 64,
};

const NAV = [
  { href: "/dashboard", icon: HomeIcon, label: "Home" },
  { href: "/events", icon: CalIcon, label: "Activities" },
  { href: "__create__", icon: PlusIcon, label: "" },
  { href: "/groups", icon: GroupIcon, label: "Groups" },
  { href: "/more", icon: MoreIcon, label: "More" },
];

/* ─── Icons ──────────────────────────────────────────────────────── */
function HomeIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={active ? T.primary : T.sub} strokeWidth={active ? 2.2 : 1.8}
        fill={active ? T.primaryL : "none"} strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="7" rx="1"
        stroke={active ? T.primary : T.sub} strokeWidth={active ? 2.2 : 1.8} />
    </svg>
  );
}
function CalIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="17" rx="2"
        stroke={active ? T.primary : T.sub} strokeWidth={active ? 2.2 : 1.8}
        fill={active ? T.primaryL : "none"} />
      <line x1="3" y1="10" x2="21" y2="10" stroke={active ? T.primary : T.sub} strokeWidth="1.8" />
      <line x1="8" y1="3" x2="8" y2="7" stroke={active ? T.primary : T.sub} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7" stroke={active ? T.primary : T.sub} strokeWidth="2" strokeLinecap="round" />
      <rect x="7" y="14" width="3" height="3" rx="0.5" fill={active ? T.primary : T.sub} />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <line x1="14" y1="6" x2="14" y2="22" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="14" x2="22" y2="14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function GroupIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="4" stroke={active ? T.primary : T.sub} strokeWidth={active ? 2.2 : 1.8}
        fill={active ? T.primaryL : "none"} />
      <path d="M2 21c0-4 3.13-7 7-7" stroke={active ? T.primary : T.sub} strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
      <circle cx="17" cy="9" r="3" stroke={active ? T.primary : T.sub} strokeWidth="1.8" />
      <path d="M15 21c0-3.3 2-5.5 5-5.5" stroke={active ? T.primary : T.sub} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function MoreIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {[6, 12, 18].map(x => (
        <circle key={x} cx={x} cy="12" r="1.8" fill={active ? T.primary : T.sub} />
      ))}
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Create Event Quick Action ──────────────────────────────────── */
function CreateModal({ onClose }) {
  const router = useRouter();
  const actions = [
    { label: "New Event", icon: "📅", href: "/events?create=true" },
    { label: "New Team", icon: "👥", href: "/groups?create=true" },
    { label: "Record Payment", icon: "💳", href: "/payments?create=true" },
    { label: "Mark Attendance", icon: "✅", href: "/attendance" },
    { label: "Book Venue", icon: "🏟️", href: "/venue" },
    { label: "Post Announcement", icon: "📢", href: "/communication" },
  ];
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 200, backdropFilter: "blur(3px)",
      }} />
      <div style={{
        position: "fixed", bottom: T.navH + 16, left: "50%", transform: "translateX(-50%)",
        width: "min(340px, calc(100vw - 32px))",
        background: T.card, borderRadius: 20, padding: "20px 16px",
        zIndex: 201, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <p style={{ textAlign: "center", fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 16 }}>
          Quick Create
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {actions.map(a => (
            <button key={a.href} onClick={() => { router.push(a.href); onClose(); }} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              padding: "14px 8px", borderRadius: 14, border: `1.5px solid ${T.border}`,
              background: T.card, cursor: "pointer", transition: "all 0.15s",
              fontSize: 13, fontWeight: 600, color: T.text,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = T.primaryL; e.currentTarget.style.borderColor = T.primary; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.card; e.currentTarget.style.borderColor = T.border; }}
            >
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── Main Shell ─────────────────────────────────────────────────── */
export default function MobileShell({ children, title, rightAction, noScroll }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState(null);
  const [notifCount] = useState(0);

  useEffect(() => {
    const d = localStorage.getItem("mukijo_user");
    if (d) setUser(JSON.parse(d));
  }, []);

  const pageTitle = title || {
    "/dashboard": "Home",
    "/events": "Activities",
    "/groups": "Groups",
    "/messages": "Chat",
    "/more": "More",
    "/payments": "Payments",
    "/attendance": "Attendance",
    "/venue": "Venues",
    "/settlement": "Settlement",
    "/fundraising": "Fundraising",
    "/communication": "Communication",
    "/calendar": "Calendar",
    "/discovery": "Discover",
    "/bookings": "Bookings",
  }[pathname] || "Mukijo";

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── Top Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: T.card,
        borderBottom: `1px solid ${T.border}`,
        padding: "0 16px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: T.shadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Logo mark */}
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: T.primary, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff",
          }}>M</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{pageTitle}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {rightAction}
          <button onClick={() => router.push("/dashboard")} style={{
            position: "relative", background: "none", border: "none",
            cursor: "pointer", padding: 4, borderRadius: 8,
          }}>
            <BellIcon />
            {notifCount > 0 && (
              <span style={{
                position: "absolute", top: 0, right: 0,
                width: 16, height: 16, borderRadius: 8,
                background: T.red, color: "#fff",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `2px solid ${T.card}`,
              }}>{notifCount}</span>
            )}
          </button>
          {user && (
            <button onClick={() => router.push("/more")} style={{
              width: 32, height: 32, borderRadius: 16,
              background: T.primary, color: "#fff",
              fontSize: 12, fontWeight: 700,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {user.name?.slice(0, 2).toUpperCase() || "U"}
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{
        flex: 1,
        padding: noScroll ? 0 : "16px 16px",
        paddingBottom: noScroll ? T.navH : T.navH + 16,
        overflowY: noScroll ? "hidden" : "auto",
      }}>
        {children}
      </main>

      {/* ── Bottom Nav ── */}
      <nav style={{
        position: "fixed", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "min(480px, 100vw)",
        height: T.navH,
        background: T.card,
        borderTop: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 150,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}>
        {NAV.map(item => {
          if (item.href === "__create__") {
            return (
              <button key="create" onClick={() => setShowCreate(true)} style={{
                width: 52, height: 52, borderRadius: 16,
                background: T.primary,
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(0,87,184,0.4)",
                transform: "translateY(-6px)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-10px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(-6px)"; }}
              >
                <PlusIcon />
              </button>
            );
          }
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <button key={item.href} onClick={() => router.push(item.href)} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, padding: "8px 12px",
              background: "none", border: "none", cursor: "pointer",
              flex: 1,
            }}>
              <Icon active={active} />
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? T.primary : T.sub,
                letterSpacing: 0.2,
              }}>{item.label}</span>
              {active && (
                <div style={{
                  position: "absolute", bottom: 6, width: 20, height: 3,
                  borderRadius: 2, background: T.primary,
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Create Modal ── */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ events: [], teams: 0, pendingPayments: 0, announcements: [], campaigns: [], polls: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    loadDashboard(u.id);
  }, [router]);

  async function loadDashboard(userId) {
    try {
      const [evRes, tmRes, payRes, annRes, campRes] = await Promise.all([
        fetch(`/api/events?userId=${userId}`),
        fetch(`/api/teams?userId=${userId}`),
        fetch("/api/payments"),
        fetch("/api/announcements"),
        fetch("/api/campaigns"),
      ]);
      const evData = await evRes.json();
      const tmData = await tmRes.json();
      const payData = await payRes.json();
      const annData = await annRes.json();
      const campData = await campRes.json();

      setStats({
        events: evData.events || [],
        teams: tmData.teams?.length || 0,
        teamsList: tmData.teams || [],
        pendingPayments: payData.summary?.pendingAmount || 0,
        overduePayments: payData.summary?.overdueAmount || 0,
        totalCollected: payData.summary?.totalCollected || 0,
        announcements: annData.announcements || [],
        campaigns: campData.campaigns || [],
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (!user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f1f5f9" }}>
      <div style={{ color: "#64748b", fontSize: "15px" }}>Loading...</div>
    </div>
  );

  const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const upcomingEvents = stats.events.filter(e => new Date(e.date) >= new Date()).slice(0, 3);
  const nextEvent = upcomingEvents[0];
  const initials = (n) => n?.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase() || "";
  const colors = ["#c2c2d9ff", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

  return (
    <AppShell searchPlaceholder="Search athletes, teams, or events...">
      <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>Dashboard</h1>
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
        Welcome back, {user.name}. {upcomingEvents.length > 0 ? `You have ${upcomingEvents.length} upcoming events.` : "No upcoming events."}
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Loading dashboard...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
              {[
                { label: "Upcoming Events", value: upcomingEvents.length, icon: "📅", color: "#4f46e5", link: "/events" },
                { label: "Active Teams", value: stats.teams, icon: "👥", color: "#16a34a", link: "/groups" },
                { label: "Pending Payments", value: fmt(stats.pendingPayments), icon: "⏳", color: "#d97706", link: "/payments" },
                { label: "Announcements", value: stats.announcements.length, icon: "📢", color: "#7c3aed", link: "/communication" },
              ].map(card => (
                <div key={card.label} onClick={() => router.push(card.link)} style={{
                  background: "#fff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0",
                  cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "8px" }}>{card.icon}</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>{card.value}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px", fontWeight: 500 }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Next Event */}
            {nextEvent ? (
              <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", borderLeft: "4px solid #4f46e5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ background: "#e0e7ff", color: "#989da8ff", fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", textTransform: "uppercase" }}>NEXT {nextEvent.type}</span>
                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "10px" }}>{nextEvent.title}</h2>
                    {nextEvent.location && <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>📍 {nextEvent.location}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#a3abbcff" }}>{new Date(nextEvent.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{new Date(nextEvent.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", margin: "18px 0" }}>
                  {[
                    { val: nextEvent.rsvps?.filter(r => r.status === "GOING").length || 0, label: "GOING", color: "#16a34a" },
                    { val: nextEvent.rsvps?.filter(r => r.status === "NOT_GOING").length || 0, label: "DECLINED", color: "#dc2626" },
                    { val: nextEvent.rsvps?.filter(r => r.status === "MAYBE" || r.status === "PENDING").length || 0, label: "PENDING", color: "#64748b" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, letterSpacing: "0.5px", marginTop: "3px" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/events")} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  View All Events ›
                </button>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: "16px", padding: "40px", border: "1px solid #e2e8f0", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📅</div>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>No upcoming events</p>
                <button onClick={() => router.push("/events?create=true")} style={{ marginTop: "12px", padding: "9px 20px", borderRadius: "10px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  + Create Event
                </button>
              </div>
            )}

            {/* Fundraising Progress */}
            {stats.campaigns.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>🎯 Fundraising Progress</h3>
                  <button onClick={() => router.push("/fundraising")} style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>View All →</button>
                </div>
                {stats.campaigns.slice(0, 2).map(c => {
                  const pct = c.goalAmount > 0 ? Math.min(100, Math.round((c.raised / c.goalAmount) * 100)) : 0;
                  return (
                    <div key={c.id} style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{c.title}</span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{fmt(c.raised)} / {fmt(c.goalAmount)}</span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "3px", background: "#f1f5f9", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "3px", background: pct >= 100 ? "#16a34a" : "#4f46e5", transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Finance Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: stats.overduePayments > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0" }}>
                {stats.overduePayments > 0 && <span style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626" }}>⚠ URGENT</span>}
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{fmt(stats.overduePayments)}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>OVERDUE</div>
              </div>
              <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>{fmt(stats.totalCollected)}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>COLLECTED</div>
              </div>
            </div>

            {/* Recent Announcements */}
            <div style={{ background: "#fff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>📢 Announcements</h3>
                <button onClick={() => router.push("/communication")} style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>View All</button>
              </div>
              {stats.announcements.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#94a3b8" }}>No announcements</p>
              ) : stats.announcements.slice(0, 3).map(a => (
                <div key={a.id} style={{ padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: a.priority === "URGENT" ? "#dc2626" : "#0f172a" }}>
                      {a.priority === "URGENT" ? "⚠️ " : ""}{a.title}
                    </span>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>{new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.content}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ background: "#fff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>⚡ Quick Actions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { label: "Create Event", href: "/events?create=true", icon: "📅" },
                  { label: "Add Team", href: "/groups", icon: "👥" },
                  { label: "Record Payment", href: "/payments", icon: "💳" },
                  { label: "Mark Attendance", href: "/attendance", icon: "✅" },
                  { label: "Start Campaign", href: "/fundraising", icon: "🎯" },
                ].map(a => (
                  <button key={a.label} onClick={() => router.push(a.href)} style={{
                    width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px",
                    background: "#f8fafc", border: "1px solid #f1f5f9",
                    fontSize: "13px", fontWeight: 500, color: "#374151",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#e0e7ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                  >
                    <span>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

const fmt = n => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    events: [], teams: 0, teamsList: [],
    pendingPayments: 0, overduePayments: 0, totalCollected: 0,
    announcements: [], campaigns: [],
  });
  const [loading, setLoading] = useState(true);

  async function loadDashboard(userId) {
    try {
      const [evRes, tmRes, payRes, annRes, campRes] = await Promise.all([
        fetch(`/api/events?userId=${userId}`),
        fetch(`/api/teams?userId=${userId}`),
        fetch("/api/payments"),
        fetch("/api/announcements"),
        fetch("/api/campaigns"),
      ]);
      const [evData, tmData, payData, annData, campData] = await Promise.all([
        evRes.json(), tmRes.json(), payRes.json(), annRes.json(), campRes.json(),
      ]);
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

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    loadDashboard(u.id);
  }, [router]);

  if (!user) return null;

  const upcoming = stats.events.filter(e => new Date(e.date) >= new Date()).slice(0, 5);
  const nextEv = upcoming[0];
  const dayName = d => new Date(d).toLocaleDateString("en-IN", { weekday: "short" });
  const dayNum  = d => new Date(d).getDate();
  const timeStr = d => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const rsvpGoing = ev => ev.rsvps?.filter(r => r.status === "GOING").length || 0;
  const rsvpWait  = ev => ev.rsvps?.filter(r => r.status === "PENDING" || r.status === "MAYBE").length || 0;

  const initials = n => (n || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const avatarColors = ["#0057B8","#00AA55","#D97706","#7C3AED","#DC2626","#0891B2"];

  return (
    <MobileShell title="Home">
      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 80, color: T.sub }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚽</div>
          <p style={{ fontSize: 14 }}>Loading your dashboard...</p>
        </div>
      ) : (
        <>
          {/* Greeting */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: T.sub }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 2 }}>
              Hello, {user.name?.split(" ")[0]} 👋
            </h1>
          </div>

          {/* Quick Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Upcoming Events",  val: upcoming.length,                icon: "📅", color: T.primary,  href: "/events"   },
              { label: "My Teams",         val: stats.teams,                    icon: "👥", color: "#7C3AED",  href: "/groups"   },
              { label: "Pending Fees",     val: fmt(stats.pendingPayments),     icon: "⏳", color: "#D97706",  href: "/payments" },
              { label: "Collected",        val: fmt(stats.totalCollected),      icon: "💰", color: "#00AA55",  href: "/payments" },
            ].map(s => (
              <div key={s.label} onClick={() => router.push(s.href)} style={{
                background: T.card, borderRadius: 14, padding: "14px 14px",
                boxShadow: T.shadow, cursor: "pointer",
                borderLeft: `3px solid ${s.color}`,
                transition: "transform 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginTop: 4 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Urgent Alert */}
          {stats.overduePayments > 0 && (
            <div onClick={() => router.push("/payments")} style={{
              background: "#FEF2F2", borderRadius: 12, padding: "12px 14px",
              border: "1px solid #FECACA", marginBottom: 16, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>Overdue Payments</div>
                <div style={{ fontSize: 12, color: "#B91C1C" }}>{fmt(stats.overduePayments)} overdue — tap to review</div>
              </div>
              <span style={{ color: "#DC2626", fontSize: 16 }}>›</span>
            </div>
          )}

          {nextEv && (
            <div onClick={() => router.push(`/events/${nextEv.id}`)} style={{ background: T.primary, borderRadius: 16, padding: "18px 16px", marginBottom: 20, color: "#fff", cursor: "pointer" }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, letterSpacing: 1, marginBottom: 6 }}>
                NEXT {nextEv.type?.replace("_", " ") || "EVENT"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{nextEv.title}</div>
              {nextEv.location && (
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>📍 {nextEv.location}</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>
                  {dayName(nextEv.date)} · {dayNum(nextEv.date)} · {timeStr(nextEv.date)}
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 12, fontWeight: 600 }}>
                  <span style={{ background: "rgba(255,255,255,0.25)", padding: "4px 10px", borderRadius: 99 }}>
                    ✅ {rsvpGoing(nextEv)} going
                  </span>
                  <span style={{ background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 99 }}>
                    ⏳ {rsvpWait(nextEv)}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={e => { e.stopPropagation(); router.push(`/events/${nextEv.id}`); }} style={{
                  flex: 1, background: "rgba(255,255,255,0.2)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10,
                  padding: "9px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>Details</button>
                <button onClick={e => { e.stopPropagation(); router.push(`/attendance?eventId=${nextEv.id}`); }} style={{
                  flex: 1, background: "#fff", color: T.primary,
                  border: "none", borderRadius: 10,
                  padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>Mark Attendance</button>
              </div>
            </div>
          )}

          {/* Upcoming Events List */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Upcoming Events</h2>
              <button onClick={() => router.push("/events")} style={{
                background: "none", border: "none", color: T.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>See all</button>
            </div>
            {upcoming.length === 0 ? (
              <div style={{
                background: T.card, borderRadius: 14, padding: "28px 16px",
                textAlign: "center", boxShadow: T.shadow,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <p style={{ fontSize: 14, color: T.sub }}>No upcoming events</p>
                <button onClick={() => router.push("/events?create=true")} style={{
                  marginTop: 10, padding: "8px 18px", borderRadius: 10,
                  background: T.primary, color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>+ Create Event</button>
              </div>
            ) : upcoming.slice(0, 3).map(ev => (
              <div key={ev.id} onClick={() => router.push(`/events/${ev.id}`)} style={{
                background: T.card, borderRadius: 14, padding: "14px 14px",
                marginBottom: 8, boxShadow: T.shadow, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                {/* Date block */}
                <div style={{
                  width: 46, flexShrink: 0, textAlign: "center",
                  background: T.primaryL, borderRadius: 10, padding: "6px 4px",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase" }}>
                    {dayName(ev.date)}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.primary, lineHeight: 1.1 }}>
                    {dayNum(ev.date)}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{ev.title}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                    {timeStr(ev.date)}{ev.team?.name ? ` · ${ev.team.name}` : ""}
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: "#00AA55",
                  background: "#E8F9F2", padding: "4px 8px", borderRadius: 8, flexShrink: 0,
                }}>
                  {rsvpGoing(ev)} going
                </div>
              </div>
            ))}
          </div>

          {/* Teams Row */}
          {stats.teamsList.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>My Teams</h2>
                <button onClick={() => router.push("/groups")} style={{
                  background: "none", border: "none", color: T.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Manage</button>
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {stats.teamsList.slice(0, 4).map((t, i) => (
                  <div key={t.id} onClick={() => router.push("/groups")} style={{
                    flexShrink: 0, background: T.card, borderRadius: 14,
                    padding: "14px 14px", width: 140,
                    boxShadow: T.shadow, cursor: "pointer",
                    borderTop: `3px solid ${avatarColors[i % avatarColors.length]}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: avatarColors[i % avatarColors.length],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 8,
                    }}>{initials(t.name)}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                      👥 {t._count?.members || 0} members
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcements */}
          {stats.announcements.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>📢 Announcements</h2>
                <button onClick={() => router.push("/communication")} style={{
                  background: "none", border: "none", color: T.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>See all</button>
              </div>
              {stats.announcements.slice(0, 2).map(a => (
                <div key={a.id} style={{
                  background: T.card, borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                  boxShadow: T.shadow, borderLeft: `3px solid ${a.priority === "URGENT" ? T.red : T.primary}`,
                }}>
                  {a.priority === "URGENT" && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.red }}>⚠ URGENT · </span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{a.title}</span>
                  <p style={{ fontSize: 12, color: T.sub, marginTop: 4, lineHeight: 1.5 }}>{a.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Fundraising */}
          {stats.campaigns.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>🎯 Fundraising</h2>
                <button onClick={() => router.push("/fundraising")} style={{
                  background: "none", border: "none", color: T.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>See all</button>
              </div>
              {stats.campaigns.slice(0, 2).map(c => {
                const pct = c.goalAmount > 0 ? Math.min(100, Math.round((c.raised / c.goalAmount) * 100)) : 0;
                return (
                  <div key={c.id} style={{
                    background: T.card, borderRadius: 12, padding: "14px",
                    boxShadow: T.shadow, marginBottom: 8,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.title}</span>
                      <span style={{ fontSize: 12, color: T.sub }}>{fmt(c.raised)} / {fmt(c.goalAmount)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
                      <div style={{
                        width: `${pct}%`, height: "100%", borderRadius: 3,
                        background: pct >= 100 ? "#00AA55" : T.primary,
                        transition: "width 0.3s",
                      }}/>
                    </div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{pct}% funded</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </MobileShell>
  );
}
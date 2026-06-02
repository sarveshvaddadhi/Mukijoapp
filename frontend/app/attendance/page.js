"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

export default function AttendancePage() {
  return (
    <Suspense fallback={<div style={{ background: T.bg, height: "100vh" }}/>}>
      <AttendanceContent/>
    </Suspense>
  );
}

function AttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState({});
  const [report, setReport] = useState([]);
  const [activeTab, setActiveTab] = useState("mark");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    loadEvents(u.id);
  }, [router]);

  async function loadEvents(userId) {
    try {
      const res = await fetch(`/api/events?userId=${userId}`);
      const d = await res.json();
      const evs = d.events || [];
      setEvents(evs);
      // Auto-select if eventId param passed
      const eventId = searchParams.get("eventId");
      if (eventId) {
        const found = evs.find(e => String(e.id) === eventId);
        if (found) loadEventAttendance(found);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadEventAttendance(event) {
    setSelectedEvent(event);
    try {
      const [memRes, attRes] = await Promise.all([
        fetch(`/api/teams/${event.teamId}/members`),
        fetch(`/api/attendance?eventId=${event.id}`),
      ]);
      const memData = await memRes.json();
      const attData = await attRes.json();
      setMembers(memData.members || []);
      const map = {};
      (attData.records || []).forEach(r => { map[r.userId] = r.status; });
      setRecords(map);
    } catch (e) { console.error(e); }
  }

  async function loadReport(teamId) {
    try {
      const res = await fetch(`/api/attendance/report?teamId=${teamId}`);
      const d = await res.json();
      setReport(d.report || []);
    } catch (e) { console.error(e); }
  }

  const markAttendance = async (userId, status) => {
    setRecords(prev => ({ ...prev, [userId]: status }));
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id, userId, status }),
      });
    } catch (e) { console.error(e); }
  };

  const markAll = async (status) => {
    const newRecords = {};
    members.forEach(m => { newRecords[m.userId] = status; });
    setRecords(newRecords);
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id, records: members.map(m => ({ userId: m.userId, status })) }),
      });
    } catch (e) { console.error(e); }
  };

  if (!user) return null;

  const initials = n => (n || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const avatarColors = ["#0057B8","#00AA55","#D97706","#7C3AED","#DC2626","#0891B2"];
  const statusStyle = {
    PRESENT: { bg: "#E8F9F2", color: "#00AA55", label: "Present", icon: "✅" },
    ABSENT:  { bg: "#FEF2F2", color: "#DC2626", label: "Absent",  icon: "❌" },
    LATE:    { bg: "#FFFBEB", color: "#D97706", label: "Late",    icon: "⏰" },
    EXCUSED: { bg: "#F1F5F9", color: "#6B7280", label: "Excused", icon: "📝" },
  };

  const presentCount = members.filter(m => records[m.userId] === "PRESENT").length;
  const absentCount  = members.filter(m => records[m.userId] === "ABSENT").length;
  const lateCount    = members.filter(m => records[m.userId] === "LATE").length;

  return (
    <MobileShell title="Attendance">
      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0, background: T.card, borderRadius: 12,
        padding: 4, boxShadow: T.shadow, marginBottom: 16,
      }}>
        {[["mark","Mark Attendance"],["report","Reports"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            flex: 1, padding: "9px", borderRadius: 9, border: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: activeTab === key ? T.primary : "transparent",
            color: activeTab === key ? "#fff" : T.sub,
            transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {activeTab === "mark" && (
        <>
          {/* Event selector */}
          <div style={{ background: T.card, borderRadius: 16, boxShadow: T.shadow, marginBottom: 14 }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Select Event</h3>
            </div>
            {loading ? (
              <div style={{ padding: 20, color: T.sub, fontSize: 13 }}>Loading events...</div>
            ) : events.length === 0 ? (
              <div style={{ padding: 20, color: T.sub, fontSize: 13 }}>
                No events yet.{" "}
                <button onClick={() => router.push("/events?create=true")} style={{
                  background: "none", border: "none", color: T.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Create one →</button>
              </div>
            ) : (
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {events.map(ev => (
                  <button key={ev.id} onClick={() => loadEventAttendance(ev)} style={{
                    width: "100%", textAlign: "left", padding: "11px 14px",
                    border: "none", borderBottom: `1px solid ${T.border}`,
                    background: selectedEvent?.id === ev.id ? T.primaryL : "#fff",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: selectedEvent?.id === ev.id ? T.primary : T.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      color: selectedEvent?.id === ev.id ? "#fff" : T.sub,
                    }}>
                      {new Date(ev.date).getDate()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>
                        {new Date(ev.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        {ev.team?.name ? ` · ${ev.team.name}` : ""}
                      </div>
                    </div>
                    {selectedEvent?.id === ev.id && (
                      <span style={{ marginLeft: "auto", color: T.primary, fontSize: 14, fontWeight: 700 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Sheet */}
          {selectedEvent && (
            <div style={{ background: T.card, borderRadius: 16, boxShadow: T.shadow, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "14px 14px", background: T.primaryL }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: T.primary }}>{selectedEvent.title}</h3>
                <p style={{ fontSize: 12, color: T.primary, opacity: 0.75, marginTop: 2 }}>
                  {new Date(selectedEvent.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                {/* Stats */}
                <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#00AA55" }}>✅ {presentCount} Present</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>❌ {absentCount} Absent</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#D97706" }}>⏰ {lateCount} Late</span>
                </div>
              </div>

              {/* Mark All buttons */}
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
                <button onClick={() => markAll("PRESENT")} style={{
                  flex: 1, padding: "7px", borderRadius: 8, border: "none",
                  background: "#E8F9F2", color: "#00AA55", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>✅ All Present</button>
                <button onClick={() => markAll("ABSENT")} style={{
                  flex: 1, padding: "7px", borderRadius: 8, border: "none",
                  background: "#FEF2F2", color: T.red, fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>❌ All Absent</button>
              </div>

              {/* Members */}
              {members.length === 0 ? (
                <div style={{ padding: "30px 20px", textAlign: "center", color: T.sub, fontSize: 13 }}>
                  No members in this team yet.
                </div>
              ) : (
                members.map((m, i) => {
                  const st = records[m.userId];
                  return (
                    <div key={m.userId} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                        background: avatarColors[i % avatarColors.length],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#fff",
                      }}>{initials(m.user.name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.user.name}</div>
                        <div style={{ fontSize: 11, color: T.sub }}>{m.role}{m.jersey ? ` · #${m.jersey}` : ""}</div>
                      </div>
                      {/* Status buttons */}
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        {Object.entries(statusStyle).map(([key, val]) => (
                          <button key={key} onClick={() => markAttendance(m.userId, key)} style={{
                            width: 36, height: 36, borderRadius: 9, border: "none",
                            background: st === key ? val.bg : "#F5F5F5",
                            cursor: "pointer", fontSize: 14,
                            outline: st === key ? `2px solid ${val.color}` : "none",
                            transition: "all 0.1s",
                          }} title={val.label}>{val.icon}</button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {!selectedEvent && !loading && events.length > 0 && (
            <div style={{
              background: T.card, borderRadius: 16, padding: "40px 20px", textAlign: "center",
              boxShadow: T.shadow, color: T.sub,
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <p style={{ fontSize: 14 }}>Select an event above to mark attendance</p>
            </div>
          )}
        </>
      )}

      {activeTab === "report" && (
        <div style={{ background: T.card, borderRadius: 16, boxShadow: T.shadow, overflow: "hidden" }}>
          <div style={{ padding: "14px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Team Report</h3>
            <select onChange={e => { if (e.target.value) loadReport(e.target.value); }} style={{
              padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${T.border}`,
              fontSize: 12, color: T.text, background: "#fff",
            }}>
              <option value="">Select team</option>
              {[...new Set(events.map(e => JSON.stringify({ id: e.teamId, name: e.team?.name })))].map(t => {
                const team = JSON.parse(t);
                return <option key={team.id} value={team.id}>{team.name}</option>;
              })}
            </select>
          </div>
          {report.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: T.sub, fontSize: 13 }}>
              Select a team to view the attendance report
            </div>
          ) : (
            report.map((r, i) => (
              <div key={r.userId} style={{
                padding: "12px 14px", borderBottom: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: avatarColors[i % avatarColors.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                }}>{initials(r.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{r.role} · {r.present}/{r.total} sessions</div>
                  <div style={{ height: 5, borderRadius: 3, background: T.border, overflow: "hidden", marginTop: 5 }}>
                    <div style={{
                      width: `${r.percentage}%`, height: "100%", borderRadius: 3,
                      background: r.percentage >= 80 ? "#00AA55" : r.percentage >= 50 ? "#D97706" : T.red,
                    }}/>
                  </div>
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 800,
                  color: r.percentage >= 80 ? "#00AA55" : r.percentage >= 50 ? "#D97706" : T.red,
                  flexShrink: 0,
                }}>{r.percentage}%</div>
              </div>
            ))
          )}
        </div>
      )}
    </MobileShell>
  );
}

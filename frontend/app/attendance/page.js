"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function AttendancePage() {
  const router = useRouter();
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
      setEvents(d.events || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

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
  };

  async function loadReport(teamId) {
    try {
      const res = await fetch(`/api/attendance/report?teamId=${teamId}`);
      const d = await res.json();
      setReport(d.report || []);
    } catch (e) { console.error(e); }
  };

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
  const initials = (n) => n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
  const statusStyles = {
    PRESENT: { bg: "#dcfce7", color: "#16a34a", label: "Present" },
    ABSENT: { bg: "#fef2f2", color: "#dc2626", label: "Absent" },
    LATE: { bg: "#fefce8", color: "#d97706", label: "Late" },
    EXCUSED: { bg: "#f1f5f9", color: "#64748b", label: "Excused" },
  };

  return (
    <AppShell searchPlaceholder="Search attendance...">
      <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>Attendance</h1>
      <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Track attendance for events and view reports</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "20px", width: "fit-content" }}>
        {[{ key: "mark", label: "Mark Attendance" }, { key: "report", label: "Reports" }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "9px 20px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            background: activeTab === t.key ? "#2563eb" : "#fff",
            color: activeTab === t.key ? "#fff" : "#64748b",
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === "mark" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", alignItems: "start" }}>
          {/* Event List */}
          <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", maxHeight: "600px", overflowY: "auto" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Select Event</span>
            </div>
            {loading ? <div style={{ padding: "20px", color: "#94a3b8", fontSize: "13px" }}>Loading...</div> :
              events.length === 0 ? <div style={{ padding: "20px", color: "#94a3b8", fontSize: "13px" }}>No events. Create one first.</div> :
                events.map(ev => (
                  <button key={ev.id} onClick={() => loadEventAttendance(ev)} style={{
                    width: "100%", textAlign: "left", padding: "12px 16px",
                    background: selectedEvent?.id === ev.id ? "#eff6ff" : "transparent",
                    border: "none", borderBottom: "1px solid #f8fafc",
                    cursor: "pointer", display: "block",
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{ev.title}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>
                      {new Date(ev.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · {ev.team?.name}
                    </div>
                  </button>
                ))}
          </div>

          {/* Attendance Sheet */}
          <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            {!selectedEvent ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>✅</div>
                <p style={{ fontSize: "14px" }}>Select an event to mark attendance</p>
              </div>
            ) : (
              <>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{selectedEvent.title}</h3>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{members.length} members</p>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => markAll("PRESENT")} style={{ padding: "6px 14px", borderRadius: "8px", background: "#dcfce7", color: "#16a34a", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>All Present</button>
                    <button onClick={() => markAll("ABSENT")} style={{ padding: "6px 14px", borderRadius: "8px", background: "#fef2f2", color: "#dc2626", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>All Absent</button>
                  </div>
                </div>
                <div style={{ padding: "8px 0" }}>
                  {members.map((m, i) => {
                    const st = records[m.userId];
                    return (
                      <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px", borderBottom: "1px solid #fafafa" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>{initials(m.user.name)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{m.user.name}</div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{m.role}{m.jersey ? ` · #${m.jersey}` : ""}</div>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {Object.entries(statusStyles).map(([key, val]) => (
                            <button key={key} onClick={() => markAttendance(m.userId, key)} style={{
                              padding: "5px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, cursor: "pointer",
                              border: st === key ? `1.5px solid ${val.color}` : "1.5px solid #e2e8f0",
                              background: st === key ? val.bg : "#fff",
                              color: st === key ? val.color : "#94a3b8",
                            }}>{val.label}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "report" && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Team Attendance Report</h3>
            <select onChange={(e) => { if (e.target.value) loadReport(e.target.value); }} style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px" }}>
              <option value="">Select team</option>
              {[...new Set(events.map(e => JSON.stringify({ id: e.teamId, name: e.team?.name })))].map(t => {
                const team = JSON.parse(t);
                return <option key={team.id} value={team.id}>{team.name}</option>;
              })}
            </select>
          </div>
          {report.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Select a team to view report</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["MEMBER", "ROLE", "SESSIONS", "PRESENT", "ATTENDANCE %"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.map((r, i) => (
                  <tr key={r.userId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff" }}>{initials(r.name)}</div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: "12px", color: "#64748b" }}>{r.role}</td>
                    <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 600 }}>{r.total}</td>
                    <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 600, color: "#16a34a" }}>{r.present}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "#f1f5f9", overflow: "hidden", maxWidth: "100px" }}>
                          <div style={{ width: `${r.percentage}%`, height: "100%", borderRadius: "3px", background: r.percentage >= 80 ? "#16a34a" : r.percentage >= 50 ? "#d97706" : "#dc2626", transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: r.percentage >= 80 ? "#16a34a" : r.percentage >= 50 ? "#d97706" : "#dc2626" }}>{r.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AppShell>
  );
}

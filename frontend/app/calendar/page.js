"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [view, setView] = useState("Month");

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
  }

  const handleRsvp = async (eventId, status) => {
    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, userId: user.id, status })
      });
      if (res.ok) {
        loadEvents(user.id);
      }
    } catch (e) {
      console.error("RSVP error:", e);
    }
  };

  if (!user) return null;

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday start
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Events for selected date
  const getEventsForDay = (day) => {
    if (!day) return [];
    return events.filter(e => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const selectedEvents = getEventsForDay(selectedDate);
  const typeColors = { MATCH: "#4f46e5", TRAINING: "#16a34a", MEETING: "#d97706" };
  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDate(1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDate(1); };

  return (
    <AppShell searchPlaceholder="Search events, players...">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>
        {/* Calendar Panel */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>{MONTHS[month]}</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#64748b" }}>{year}</div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={prevMonth} style={{ width: "32px", height: "32px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: "8px", cursor: "pointer", color: "#64748b", fontSize: "16px" }}>‹</button>
              <button onClick={nextMonth} style={{ width: "32px", height: "32px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: "8px", cursor: "pointer", color: "#64748b", fontSize: "16px" }}>›</button>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: "0", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
              {["Month", "Week"].map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: "8px 18px", border: "none", background: view === v ? "#4f46e5" : "#fff", color: view === v ? "#fff" : "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>{v}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "12px 16px 0" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", padding: "4px" }}>{d}</div>
            ))}
          </div>

          <div style={{ padding: "0 16px 16px" }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                {week.map((day, di) => {
                  const dayEvents = getEventsForDay(day);
                  const isSelected = day === selectedDate;
                  return (
                    <div key={di} onClick={() => day && setSelectedDate(day)} style={{
                      minHeight: "70px", borderRadius: "10px", padding: "6px",
                      cursor: day ? "pointer" : "default",
                      background: isSelected ? "#e0e7ff" : isToday(day) ? "#fefce8" : "transparent",
                      border: isSelected ? "1.5px solid #4f46e5" : "1.5px solid transparent",
                      transition: "all 0.15s",
                    }}>
                      {day && (
                        <>
                          <div style={{ fontSize: "13px", fontWeight: isSelected || isToday(day) ? 700 : 500, color: isSelected ? "#4f46e5" : isToday(day) ? "#d97706" : "#0f172a", marginBottom: "3px" }}>{day}</div>
                          {dayEvents.slice(0, 2).map((ev, ei) => (
                            <div key={ei} style={{ background: (typeColors[ev.type] || "#64748b") + "20", borderLeft: `2px solid ${typeColors[ev.type] || "#64748b"}`, color: typeColors[ev.type] || "#64748b", fontSize: "9px", fontWeight: 600, padding: "1px 4px", borderRadius: "0 3px 3px 0", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.title.substring(0, 12)}...
                            </div>
                          ))}
                          {dayEvents.length > 2 && <div style={{ fontSize: "9px", color: "#94a3b8" }}>+{dayEvents.length - 2} more</div>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              {MONTHS[month]} {selectedDate}, {year}
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>{selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}</p>

            {selectedEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>No events on this day</div>
            ) : selectedEvents.map(ev => {
              const d = new Date(ev.date);
              const goingCount = ev.rsvps?.filter(r => r.status === "GOING").length || 0;
              const myRsvp = ev.rsvps?.find(r => r.userId === user.id)?.status || "PENDING";
              return (
                <div key={ev.id} style={{ padding: "14px", borderRadius: "10px", background: "#f8fafc", borderLeft: `3px solid ${typeColors[ev.type] || "#64748b"}`, marginBottom: "10px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: typeColors[ev.type], textTransform: "uppercase", letterSpacing: "0.5px" }}>{ev.type}</span>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>{ev.title}</h4>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span>🕐 {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}{ev.endTime ? ` – ${new Date(ev.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
                    {ev.location && <span>📍 {ev.location}</span>}
                    <span>👥 {ev.team?.name} · {goingCount} going</span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button onClick={() => handleRsvp(ev.id, "GOING")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: myRsvp === "GOING" ? "1.5px solid #16a34a" : "1px solid #cbd5e1", background: myRsvp === "GOING" ? "#dcfce7" : "#fff", color: myRsvp === "GOING" ? "#16a34a" : "#475569", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>✅ Going</button>
                    <button onClick={() => handleRsvp(ev.id, "NOT_GOING")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: myRsvp === "NOT_GOING" ? "1.5px solid #dc2626" : "1px solid #cbd5e1", background: myRsvp === "NOT_GOING" ? "#fee2e2" : "#fff", color: myRsvp === "NOT_GOING" ? "#dc2626" : "#475569", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>❌ Can&apos;t go</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Google Calendar Placeholder */}
          <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>📅</div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>Sync Calendar</h4>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>Connect your Google Calendar</p>
            <button style={{ padding: "8px 20px", borderRadius: "8px", background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              🔗 Connect Google Calendar
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

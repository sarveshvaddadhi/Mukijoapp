"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

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
    <MobileShell title="Calendar">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Calendar Panel */}
        <div style={{ background: T.card, borderRadius: 16, boxShadow: T.shadow, overflow: "hidden" }}>
          <div style={{ padding: "14px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{MONTHS[month]}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>{year}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={prevMonth} style={{ width: 32, height: 32, border: `1px solid ${T.border}`, background: T.card, borderRadius: 8, cursor: "pointer", color: T.sub, fontSize: 16 }}>‹</button>
              <button onClick={nextMonth} style={{ width: 32, height: 32, border: `1px solid ${T.border}`, background: T.card, borderRadius: 8, cursor: "pointer", color: T.sub, fontSize: 16 }}>›</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "10px 10px 0" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: T.sub, letterSpacing: 0.5, padding: 4 }}>{d}</div>
            ))}
          </div>

          <div style={{ padding: "0 10px 10px" }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {week.map((day, di) => {
                  const dayEvents = getEventsForDay(day);
                  const isSelected = day === selectedDate;
                  return (
                    <div key={di} onClick={() => day && setSelectedDate(day)} style={{
                      minHeight: 54, borderRadius: 8, padding: 4,
                      cursor: day ? "pointer" : "default",
                      background: isSelected ? T.primaryL : isToday(day) ? "#FFFBEB" : "transparent",
                      border: isSelected ? `1.5px solid ${T.primary}` : "1.5px solid transparent",
                    }}>
                      {day && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: isSelected || isToday(day) ? 700 : 500, color: isSelected ? T.primary : isToday(day) ? "#D97706" : T.text, marginBottom: 2 }}>{day}</div>
                          {dayEvents.slice(0, 2).map((ev, ei) => (
                            <div key={ei} style={{ background: (typeColors[ev.type] || T.sub) + "20", borderLeft: `2px solid ${typeColors[ev.type] || T.sub}`, color: typeColors[ev.type] || T.sub, fontSize: 8, fontWeight: 600, padding: "1px 3px", borderRadius: "0 2px 2px 0", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.title.substring(0, 10)}
                            </div>
                          ))}
                          {dayEvents.length > 2 && <div style={{ fontSize: 8, color: T.sub }}>+{dayEvents.length - 2}</div>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Events */}
        <div style={{ background: T.card, borderRadius: 14, boxShadow: T.shadow, padding: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>
            {MONTHS[month]} {selectedDate}, {year}
          </h3>
          <p style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>{selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}</p>

          {selectedEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: T.sub, fontSize: 13 }}>No events on this day</div>
          ) : selectedEvents.map(ev => {
            const d = new Date(ev.date);
            const goingCount = ev.rsvps?.filter(r => r.status === "GOING").length || 0;
            const myRsvp = ev.rsvps?.find(r => r.userId === user.id)?.status || "PENDING";
            return (
              <div key={ev.id} style={{ padding: 12, borderRadius: 10, background: T.bg, borderLeft: `3px solid ${typeColors[ev.type] || T.sub}`, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: typeColors[ev.type], textTransform: "uppercase", letterSpacing: 0.5 }}>{ev.type}</span>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginTop: 4 }}>{ev.title}</h4>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span>🕐 {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                  {ev.location && <span>📍 {ev.location}</span>}
                  <span>👥 {ev.team?.name} · {goingCount} going</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button onClick={() => handleRsvp(ev.id, "GOING")} style={{ flex: 1, padding: 7, borderRadius: 8, border: myRsvp === "GOING" ? `1.5px solid #00AA55` : `1px solid ${T.border}`, background: myRsvp === "GOING" ? "#E8F9F2" : T.card, color: myRsvp === "GOING" ? "#00AA55" : T.sub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✅ Going</button>
                  <button onClick={() => handleRsvp(ev.id, "NOT_GOING")} style={{ flex: 1, padding: 7, borderRadius: 8, border: myRsvp === "NOT_GOING" ? `1.5px solid ${T.red}` : `1px solid ${T.border}`, background: myRsvp === "NOT_GOING" ? "#FEF2F2" : T.card, color: myRsvp === "NOT_GOING" ? T.red : T.sub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>❌ Can&apos;t go</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sync Calendar */}
        <div style={{ background: T.card, borderRadius: 14, boxShadow: T.shadow, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>Sync Calendar</h4>
          <p style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>Connect your Google Calendar</p>
          <button style={{ padding: "8px 20px", borderRadius: 8, background: T.bg, color: T.text, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🔗 Connect Google Calendar</button>
        </div>
      </div>
    </MobileShell>
  );
}

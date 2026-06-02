"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

export default function EventsPage() {
  return (
    <Suspense fallback={<div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background: T.bg }}>Loading...</div>}>
      <EventsContent />
    </Suspense>
  );
}

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("upcoming");
  const [form, setForm] = useState({
    title: "", type: "TRAINING", location: "", date: "", endTime: "",
    teamId: "", recurring: false, recurrence: "", description: "",
  });

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    if (searchParams.get("create") === "true") setShowForm(true);
    loadData(u.id);
  }, [router, searchParams]);

  async function loadData(userId) {
    try {
      const [evRes, tmRes] = await Promise.all([
        fetch(`/api/events?userId=${userId}`),
        fetch(`/api/teams?userId=${userId}`),
      ]);
      const evData = await evRes.json();
      const tmData = await tmRes.json();
      setEvents(evData.events || []);
      setTeams(tmData.teams || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.teamId) { alert("Title, date, and team required"); return; }
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, teamId: parseInt(form.teamId), createdById: user.id }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ title: "", type: "TRAINING", location: "", date: "", endTime: "", teamId: "", recurring: false, recurrence: "", description: "" });
        loadData(user.id);
      } else {
        const d = await res.json();
        alert(d.message || "Error creating event");
      }
    } catch { alert("Server error"); }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status }),
      });
      loadData(user.id);
    } catch { alert("Error"); }
  };

  if (!user) return null;

  const now = new Date();
  const filtered = events.filter(ev => {
    const evDate = new Date(ev.date);
    if (activeFilter === "upcoming") return evDate >= now;
    if (activeFilter === "past") return evDate < now;
    return true;
  }).sort((a, b) => activeFilter === "past"
    ? new Date(b.date) - new Date(a.date)
    : new Date(a.date) - new Date(b.date)
  );

  const myRsvp = ev => ev.rsvps?.find(r => r.userId === user.id)?.status;
  const rsvpCount = (ev, st) => ev.rsvps?.filter(r => r.status === st).length || 0;
  const typeColors = {
    TRAINING: "#0057B8", MATCH: "#DC2626", TOURNAMENT: "#7C3AED",
    MEETING: "#D97706", FRIENDLY: "#059669",
  };
  const inputStyle = {
    width: "100%", padding: "11px 13px", borderRadius: 10,
    border: `1.5px solid ${T.border}`, fontSize: 14, color: T.text,
    background: "#fff", outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <MobileShell title="Activities" rightAction={
      <button onClick={() => setShowForm(v => !v)} style={{
        background: showForm ? "#FEF2F2" : T.primary, color: showForm ? T.red : "#fff",
        border: "none", borderRadius: 10, padding: "6px 14px",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
      }}>
        {showForm ? "✕ Cancel" : "+ Event"}
      </button>
    }>
      {/* Create Form */}
      {showForm && (
        <div style={{
          background: T.card, borderRadius: 16, padding: "18px 16px",
          boxShadow: T.shadow, marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 14 }}>New Event</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Event title *" style={inputStyle} required/>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                {["TRAINING","MATCH","TOURNAMENT","MEETING","FRIENDLY"].map(t =>
                  <option key={t} value={t}>{t}</option>
                )}
              </select>
              <select value={form.teamId} onChange={e => setForm(f => ({ ...f, teamId: e.target.value }))} style={inputStyle} required>
                <option value="">Select team *</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Location / Venue" style={inputStyle}/>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "block", marginBottom: 4 }}>Start Date & Time *</label>
                <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} required/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "block", marginBottom: 4 }}>End Time</label>
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle}/>
              </div>
            </div>

            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)" rows={2}
              style={{ ...inputStyle, resize: "vertical" }}/>

            <button type="submit" style={{
              padding: "12px", borderRadius: 12, background: T.primary,
              color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>Create Event</button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 14,
        background: T.card, borderRadius: 12, padding: 4,
        boxShadow: T.shadow,
      }}>
        {[["upcoming","Upcoming"],["past","Past"],["all","All"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveFilter(key)} style={{
            flex: 1, padding: "8px", borderRadius: 9, border: "none",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: activeFilter === key ? T.primary : "transparent",
            color: activeFilter === key ? "#fff" : T.sub,
            transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: T.sub }}>Loading events...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: T.card, borderRadius: 16, padding: "40px 20px", textAlign: "center", boxShadow: T.shadow }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
          <p style={{ fontSize: 14, color: T.sub }}>No {activeFilter} events</p>
          <button onClick={() => setShowForm(true)} style={{
            marginTop: 12, padding: "9px 20px", borderRadius: 10,
            background: T.primary, color: "#fff", border: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>+ Create Event</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(ev => {
            const myStatus = myRsvp(ev);
            const typeColor = typeColors[ev.type] || T.primary;
            return (
              <div key={ev.id} style={{
                background: T.card, borderRadius: 16, overflow: "hidden",
                boxShadow: T.shadow,
              }}>
                {/* Color strip */}
                <div style={{ height: 4, background: typeColor }}/>
                <div style={{ padding: "14px 14px" }}>
                  <div onClick={() => router.push(`/events/${ev.id}`)} style={{ cursor: "pointer" }}>
                    {/* Header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                            background: typeColor + "18", color: typeColor,
                          }}>{ev.type?.replace("_", " ")}</span>
                          {ev.team?.name && (
                            <span style={{ fontSize: 11, color: T.sub }}>· {ev.team.name}</span>
                          )}
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{ev.title}</h3>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: T.primary }}>
                          {new Date(ev.date).getDate()}
                        </div>
                        <div style={{ fontSize: 10, color: T.sub, textTransform: "uppercase" }}>
                          {new Date(ev.date).toLocaleDateString("en-IN", { month: "short", weekday: "short" }).replace(",", " ")}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: T.sub }}>
                        🕐 {new Date(ev.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {ev.location && <span style={{ fontSize: 12, color: T.sub }}>📍 {ev.location}</span>}
                    </div>
                  </div>

                  {/* RSVP counts */}
                  <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                    {[
                      { st: "GOING",     label: "Going",   color: "#00AA55" },
                      { st: "NOT_GOING", label: "No",      color: T.red     },
                      { st: "PENDING",   label: "Waiting", color: T.sub     },
                    ].map(r => (
                      <span key={r.st} style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>
                        {rsvpCount(ev, r.st)} {r.label}
                      </span>
                    ))}
                  </div>

                  {/* RSVP Buttons */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    {[
                      { st: "GOING",     label: "✓ Going",    bg: "#00AA55", activeBg: "#E8F9F2", activeColor: "#00AA55" },
                      { st: "NOT_GOING", label: "✗ Not Going", bg: T.red,    activeBg: "#FEF2F2", activeColor: T.red },
                      { st: "MAYBE",     label: "? Maybe",    bg: "#8B5CF6", activeBg: "#F5F3FF", activeColor: "#8B5CF6" },
                    ].map(r => {
                      const isActive = myStatus === r.st;
                      return (
                        <button key={r.st} onClick={() => handleRSVP(ev.id, r.st)} style={{
                          flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer",
                          border: `1.5px solid ${isActive ? r.bg : T.border}`,
                          background: isActive ? r.activeBg : "#fff",
                          color: isActive ? r.activeColor : T.sub,
                          transition: "all 0.15s",
                        }}>
                          {r.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cross-module actions */}
                  <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                    <button onClick={() => router.push(`/attendance?eventId=${ev.id}`)} style={{
                      flex: 1, padding: "7px 8px", borderRadius: 8,
                      background: T.primaryL, color: T.primary,
                      border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}>✅ Attendance</button>
                    <button onClick={() => router.push(`/payments?type=EVENT&eventRef=${ev.title}`)} style={{
                      flex: 1, padding: "7px 8px", borderRadius: 8,
                      background: "#F0FDF4", color: "#00AA55",
                      border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}>💳 Collect Fees</button>
                    <button onClick={() => router.push(`/messages`)} style={{
                      flex: 1, padding: "7px 8px", borderRadius: 8,
                      background: "#FFF7ED", color: "#D97706",
                      border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}>💬 Discuss</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MobileShell>
  );
}

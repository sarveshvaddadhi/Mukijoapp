"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function EventsPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Loading...</div>}>
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
  const [form, setForm] = useState({ title: "", type: "TRAINING", location: "", date: "", endTime: "", teamId: "", recurring: false, recurrence: "", description: "" });

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
  };

  const update = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

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

  const handleDelete = async (eventId) => {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    loadData(user.id);
  };

  if (!user) return null;

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box" };

  const typeColors = { MATCH: { bg: "#fef2f2", color: "#dc2626", label: "Match" }, TRAINING: { bg: "#f0fdf4", color: "#16a34a", label: "Training" }, MEETING: { bg: "#e0e7ff", color: "#4f46e5", label: "Meeting" } };

  return (
    <AppShell searchPlaceholder="Search events...">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>Events</h1>
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{events.length} upcoming events</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", borderRadius: "10px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          {showForm ? "Cancel" : "+ Create Event"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>New Event</h2>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Title *</label>
              <input value={form.title} onChange={update("title")} placeholder="e.g. U-19 Training Session" style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Type</label>
              <select value={form.type} onChange={update("type")} style={inputStyle}>
                <option value="TRAINING">Training</option>
                <option value="MATCH">Match</option>
                <option value="MEETING">Meeting</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Team *</label>
              <select value={form.teamId} onChange={update("teamId")} style={inputStyle} required>
                <option value="">Select team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Start Date & Time *</label>
              <input type="datetime-local" value={form.date} onChange={update("date")} style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>End Time</label>
              <input type="datetime-local" value={form.endTime} onChange={update("endTime")} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Location</label>
              <input value={form.location} onChange={update("location")} placeholder="e.g. North Stadium, Pitch 4" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer", marginTop: "20px" }}>
                <input type="checkbox" checked={form.recurring} onChange={update("recurring")} />
                Recurring event
              </label>
              {form.recurring && (
                <select value={form.recurrence} onChange={update("recurrence")} style={{ ...inputStyle, marginTop: "8px" }}>
                  <option value="">Frequency</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              )}
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Description</label>
              <textarea value={form.description} onChange={update("description")} rows={2} placeholder="Event details..." style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <button type="submit" style={{ padding: "11px 28px", borderRadius: "10px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Create Event</button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📅</div>
          <p style={{ fontSize: "15px", fontWeight: 600 }}>No events yet</p>
          <p style={{ fontSize: "13px", marginTop: "4px" }}>Create your first event to get started</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {events.map(ev => {
            const tc = typeColors[ev.type] || typeColors.TRAINING;
            const userRsvp = ev.rsvps?.find(r => r.userId === user.id);
            const goingCount = ev.rsvps?.filter(r => r.status === "GOING").length || 0;
            const d = new Date(ev.date);
            return (
              <div key={ev.id} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", borderLeft: `4px solid ${tc.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ background: tc.bg, color: tc.color, fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px" }}>{tc.label}</span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>{ev.team?.name}</span>
                      {ev.recurring && <span style={{ fontSize: "10px", color: "#d97706", fontWeight: 600 }}>🔄 Recurring</span>}
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>{ev.title}</h3>
                    <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                        📅 {d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} · {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {ev.location && <span style={{ fontSize: "12px", color: "#64748b" }}>📍 {ev.location}</span>}
                      <span style={{ fontSize: "12px", color: "#64748b" }}>✅ {goingCount} going</span>
                    </div>
                    {ev.description && <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>{ev.description}</p>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: tc.color }}>{d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                    <button onClick={() => handleDelete(ev.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "11px" }}>Delete</button>
                  </div>
                </div>
                {/* RSVP Buttons */}
                <div style={{ display: "flex", gap: "8px", marginTop: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                  {["GOING", "MAYBE", "NOT_GOING"].map(s => {
                    const active = userRsvp?.status === s;
                    const colors = { GOING: "#16a34a", MAYBE: "#d97706", NOT_GOING: "#dc2626" };
                    const labels = { GOING: "✓ Going", MAYBE: "? Maybe", NOT_GOING: "✗ Not Going" };
                    return (
                      <button key={s} onClick={() => handleRSVP(ev.id, s)} style={{
                        padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                        border: `1.5px solid ${active ? colors[s] : "#e2e8f0"}`,
                        background: active ? colors[s] + "15" : "#fff",
                        color: active ? colors[s] : "#64748b",
                        transition: "all 0.15s",
                      }}>
                        {labels[s]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

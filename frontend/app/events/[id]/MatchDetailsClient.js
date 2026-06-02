"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import MobileShell, { T } from "@/components/MobileShell";

const fmt = n => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function MatchDetailsClient() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("details"); // details | squad | chat
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);

  // Squad availability state
  const [squadCount, setSquadCount] = useState(9);
  const [alertVisible, setAlertVisible] = useState(true);
  
  // Interactive chat messages state
  const [messages, setMessages] = useState([
    { id: 1, sender: "David M.", time: "14:20", text: "Just confirmed the pitch booking. We are on Pitch 4 tonight!", isSystem: false },
    { id: 2, sender: "You", time: "14:25", text: "Nice. I'm bringing the bibs. Who's got the match ball?", isSystem: false, isMe: true },
    { id: 3, sender: "System", time: "14:27", text: "SYSTEM: CHRIS M. DROPPED OUT OF THE GAME", isSystem: true },
    { id: 4, sender: "Sarah J.", time: "14:32", text: "Noooo! I can't believe Chris bailed again. Should I call my brother to sub?", isSystem: false }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [myStatus, setMyStatus] = useState("PENDING");

  // Load User & Match Data
  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    let currentUser = null;
    if (data) {
      currentUser = JSON.parse(data);
      setUser(currentUser);
    }
    fetchMatchDetails(currentUser?.id);
  }, [id]);

  const fetchMatchDetails = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        
        // Find my RSVP status
        if (userId && data.rsvps) {
          const mine = data.rsvps.find(r => r.userId === userId);
          if (mine) setMyStatus(mine.status);
        }
        
        // Calculate squad count based on confirmed RSVPs
        const confirmed = data.rsvps?.filter(r => r.status === "GOING").length || 0;
        setSquadCount(Math.max(confirmed, 5)); // Keep min 5 for visual quality
      }
    } catch (e) {
      console.error("Failed to fetch match details", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status) => {
    setMyStatus(status);
    if (!user) {
      toast.error("Please login to RSVP");
      return;
    }
    try {
      const res = await fetch(`/api/events/${id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status }),
      });
      if (res.ok) {
        toast.success(`RSVP updated to: ${status.replace("_", " ")}`);
        fetchMatchDetails(user.id);
      } else {
        toast.error("Failed to update RSVP");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      sender: user ? user.name : "You",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputVal,
      isSystem: false,
      isMe: true
    };

    setMessages([...messages, newMsg]);
    setInputVal("");
  };

  const handleFindSub = () => {
    toast.success("Searching for qualified sub players near Pitch 4...");
    setTimeout(() => {
      toast.success("Sub found! Kevin L. (Rating 4.8) has joined the squad.");
      setSquadCount(prev => prev + 1);
      setAlertVisible(false);
      
      const subMsg = {
        id: messages.length + 2,
        sender: "System",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: "SYSTEM: KEVIN L. HAS JOINED THE SQUAD AS A SUB",
        isSystem: true
      };
      setMessages(prev => [...prev, subMsg]);
    }, 1500);
  };

  const timeStr = d => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = d => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  // Fallback / Event display data
  const title = event?.title || "Thursday Night Champions League";
  const dateVal = event?.date ? dateStr(event.date) : "Thursday Night Today";
  const timeVal = event?.date ? `${timeStr(event.date)} — ${event.endTime || "21:00"}` : "20:00 — 21:00";
  const location = event?.location || "Pitch 4, Central Arena";
  const type = event?.type || "MATCH";
  const description = event?.description || "Weekly series. Arrive 15 mins early for warm-up. Bring white bibs.";

  return (
    <MobileShell title="Match Details">
      <Toaster position="top-right" theme="dark" />

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0, background: T.card, borderRadius: 12, padding: 4,
        boxShadow: T.shadow, marginBottom: 16
      }}>
        {[
          { id: "details", label: "ℹ️ Details" },
          { id: "squad", label: `👥 Squad (${squadCount})` },
          { id: "chat", label: "💬 Chat" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "9px", borderRadius: 9, border: "none",
              background: activeTab === tab.id ? T.primary : "transparent",
              color: activeTab === tab.id ? "#fff" : T.sub,
              fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
              outline: "none"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 40, color: T.sub }}>
          <p>Syncing match info...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: DETAILS */}
          {activeTab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              
              {/* Alert block */}
              {alertVisible && (
                <div style={{
                  background: "#FEF2F2", borderRadius: "12px", padding: "12px 14px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: `1.5px solid #FCA5A5`
                }}>
                  <div style={{ minWidth: 0, marginRight: 8 }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: T.red }}>Player Dropped</span>
                    <h4 style={{ fontSize: "13px", fontWeight: 800, margin: "2px 0 0", color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Chris M. bailed</h4>
                  </div>
                  <button
                    onClick={handleFindSub}
                    style={{
                      background: T.red, color: "#fff", border: "none", borderRadius: "8px",
                      padding: "6px 12px", fontSize: "11px", fontWeight: 800, cursor: "pointer", flexShrink: 0
                    }}
                  >
                    FIND SUB
                  </button>
                </div>
              )}

              {/* Event card */}
              <div style={{ background: T.card, borderRadius: 16, padding: 16, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                  background: T.primaryL, color: T.primary
                }}>{type}</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginTop: 8, marginBottom: 4 }}>{title}</h2>
                <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>{description}</p>
              </div>

              {/* Schedule and Pitch Card */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* Time */}
                <div style={{ background: T.card, padding: 14, borderRadius: 12, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" }}>Timing</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginTop: 4 }}>{timeVal}</div>
                  <span style={{ fontSize: 11, color: T.sub, display: "block", marginTop: 2 }}>{dateVal}</span>
                </div>
                {/* Fee */}
                <div style={{ background: T.card, padding: 14, borderRadius: 12, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" }}>Pitch Fee Status</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.primary, marginTop: 4 }}>₹12,000 / ₹15,000</div>
                  <div style={{ marginTop: 6, height: 4, background: T.bg, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(squadCount / 10) * 100}%`, height: "100%", background: T.primary }}/>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div style={{ background: T.card, borderRadius: 14, padding: 14, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" }}>📍 Location</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 4 }}>{location}</div>
              </div>

              {/* RSVP status switcher */}
              <div style={{ background: T.card, borderRadius: 14, padding: 14, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: "block", marginBottom: 10 }}>MY RSVP STATUS</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { st: "GOING", label: "✓ Going", bg: "#00AA55", activeBg: "#E8F9F2", activeColor: "#00AA55" },
                    { st: "NOT_GOING", label: "✗ Decline", bg: T.red, activeBg: "#FEF2F2", activeColor: T.red },
                    { st: "MAYBE", label: "? Maybe", bg: "#8B5CF6", activeBg: "#F5F3FF", activeColor: "#8B5CF6" }
                  ].map(r => {
                    const isActive = myStatus === r.st;
                    return (
                      <button
                        key={r.st}
                        onClick={() => handleRSVP(r.st)}
                        style={{
                          flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer",
                          border: `1.5px solid ${isActive ? r.bg : T.border}`,
                          background: isActive ? r.activeBg : "#fff",
                          color: isActive ? r.activeColor : T.sub,
                          transition: "all 0.15s"
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Organizer tools */}
              <div style={{ background: T.card, borderRadius: 14, padding: 14, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.sub, fontWeight: 700, display: "block", marginBottom: 10 }}>COORDINATION TOOLKIT</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => router.push(`/attendance?eventId=${id}`)} style={{
                    flex: 1, padding: "10px", borderRadius: 10, background: T.primaryL, color: T.primary,
                    border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer"
                  }}>
                    Attendance
                  </button>
                  <button onClick={() => router.push(`/payments?type=EVENT&eventRef=${encodeURIComponent(title)}`)} style={{
                    flex: 1, padding: "10px", borderRadius: 10, background: "#E8F9F2", color: "#00AA55",
                    border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer"
                  }}>
                    Collect Fees
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SQUAD */}
          {activeTab === "squad" && (
            <div style={{ background: T.card, borderRadius: 16, padding: 16, boxShadow: T.shadow, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: 0 }}>Confirmed Lineup</h3>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>{squadCount} / 10 players</span>
              </div>

              {/* Grid of Players */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { name: "Marco R.", initials: "MR", color: "#3B82F6" },
                  { name: "Sarah J.", initials: "SJ", color: "#EF4444" },
                  { name: "Leon W.", initials: "LW", color: "#10B981" },
                  { name: "Elena K.", initials: "EK", color: "#8B5CF6" },
                  { name: "You", initials: user ? user.name.slice(0,2).toUpperCase() : "ME", color: T.primary }
                ].map((p, idx) => (
                  <div key={idx} style={{
                    background: T.bg, padding: 12, borderRadius: 10, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", textAlign: "center"
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: p.color, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700
                    }}>{p.initials}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text, marginTop: 6 }}>{p.name}</span>
                    <span style={{ fontSize: 9, color: T.green, fontWeight: 700, marginTop: 2 }}>Going</span>
                  </div>
                ))}
                
                {/* Dynamically added sub if squadCount increases */}
                {squadCount > 5 && (
                  <div style={{
                    background: T.bg, padding: 12, borderRadius: 10, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", textAlign: "center", border: `1.5px solid ${T.green}`
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: T.green, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700
                    }}>KL</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text, marginTop: 6 }}>Kevin L. (Sub)</span>
                    <span style={{ fontSize: 9, color: T.green, fontWeight: 700, marginTop: 2 }}>Rating 4.8 ★</span>
                  </div>
                )}

                {/* Open Slots representation */}
                {squadCount < 10 && (
                  <div onClick={handleFindSub} style={{
                    background: "#FFFbeb", border: "1.5px dashed #F59E0B", padding: 12, borderRadius: 10,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    textAlign: "center", cursor: "pointer"
                  }}>
                    <span style={{ fontSize: 16 }}>➕</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#D97706", marginTop: 4 }}>Open Slot</span>
                    <span style={{ fontSize: 9, color: "#B45309", marginTop: 2 }}>Invite sub</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WAR ROOM CHAT */}
          {activeTab === "chat" && (
            <div style={{
              background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
              display: "flex", flexDirection: "column", height: 420, overflow: "hidden", boxShadow: T.shadow
            }}>
              {/* Message display area */}
              <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12, background: T.bg }}>
                {messages.map((m) => {
                  if (m.isSystem) {
                    return (
                      <div key={m.id} style={{
                        alignSelf: "center", background: "#FEF2F2", color: T.red, border: `1px solid #FCA5A5`,
                        padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, textAlign: "center", width: "90%"
                      }}>
                        {m.text}
                      </div>
                    );
                  }
                  const isMe = m.isMe || m.sender === "You";
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 2, padding: "0 2px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.sub }}>{m.sender}</span>
                        <span style={{ fontSize: 9, color: T.sub }}>{m.time}</span>
                      </div>
                      <div style={{
                        background: isMe ? T.primary : T.card,
                        color: isMe ? "#fff" : T.text,
                        border: isMe ? "none" : `1px solid ${T.border}`,
                        padding: "8px 12px",
                        borderRadius: isMe ? "12px 12px 0 12px" : "12px 12px 12px 0",
                        fontSize: 12,
                        lineHeight: 1.4,
                        boxShadow: T.shadow
                      }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} style={{ padding: 10, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, background: T.card }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  style={{
                    flex: 1, padding: "10px 12px", border: `1.5px solid ${T.border}`, borderRadius: 10,
                    fontSize: 12, color: T.text, background: "#fff", outline: "none"
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: 36, height: 36, borderRadius: 10, background: T.primary, border: "none",
                    color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14
                  }}
                >
                  ➤
                </button>
              </form>
            </div>
          )}
        </>
      )}

    </MobileShell>
  );
}

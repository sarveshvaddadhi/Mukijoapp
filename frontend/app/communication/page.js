"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function CommunicationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", priority: "NORMAL" });
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const chatRef = useRef(null);

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    loadData(u.id);
  }, [router]);

  async function loadData(userId) {
    try {
      const tRes = await fetch(`/api/teams?userId=${userId}`);
      const tData = await tRes.json();
      setTeams(tData.teams || []);

      // Load channels for first team
      if (tData.teams?.length > 0) {
        const cRes = await fetch(`/api/channels?teamId=${tData.teams[0].id}`);
        const cData = await cRes.json();
        setChannels(cData.channels || []);
        if (cData.channels?.length > 0) {
          setActiveChannel(cData.channels[0]);
          loadMessages(cData.channels[0].id);
        }

        // Load announcements
        const aRes = await fetch(`/api/announcements?teamId=${tData.teams[0].id}`);
        const aData = await aRes.json();
        setAnnouncements(aData.announcements || []);
      }
    } catch (e) { console.error(e); }
  };

  async function loadMessages(channelId) {
    try {
      const res = await fetch(`/api/messages?channelId=${channelId}`);
      const d = await res.json();
      setMessages(d.messages || []);
      setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 100);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !activeChannel) return;
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: activeChannel.id, userId: user.id, content: msgText }),
      });
      setMsgText("");
      loadMessages(activeChannel.id);
    } catch { alert("Error sending message"); }
  };

  const sendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content || !teams[0]) return;
    try {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...announcementForm, teamId: teams[0].id, userId: user.id }),
      });
      setShowAnnounce(false);
      setAnnouncementForm({ title: "", content: "", priority: "NORMAL" });
      const aRes = await fetch(`/api/announcements?teamId=${teams[0].id}`);
      const aData = await aRes.json();
      setAnnouncements(aData.announcements || []);
    } catch { alert("Error"); }
  };

  const createChannel = async () => {
    if (!newChannelName || !teams[0]) return;
    try {
      await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName, type: "GROUP", teamId: teams[0].id }),
      });
      setNewChannelName("");
      setShowNewChannel(false);
      const cRes = await fetch(`/api/channels?teamId=${teams[0].id}`);
      const cData = await cRes.json();
      setChannels(cData.channels || []);
    } catch { alert("Error"); }
  };

  if (!user) return null;
  const initials = (n) => n?.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box" };
  const priorityColors = { URGENT: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" }, NORMAL: { bg: "#fff", color: "#374151", border: "#e2e8f0" }, INFO: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" } };

  return (
    <AppShell searchPlaceholder="Search conversations...">
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "16px", alignItems: "start" }}>
        {/* LEFT: Channels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "0", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
            {["chat", "announcements"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                flex: 1, padding: "9px", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                background: activeTab === t ? "#2563eb" : "#fff", color: activeTab === t ? "#fff" : "#64748b",
              }}>{t}</button>
            ))}
          </div>

          {activeTab === "chat" && (
            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ padding: "14px 14px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px" }}>CHANNELS</span>
                <button onClick={() => setShowNewChannel(!showNewChannel)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", width: "22px", height: "22px", cursor: "pointer", color: "#64748b", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
              {showNewChannel && (
                <div style={{ padding: "0 10px 10px", display: "flex", gap: "6px" }}>
                  <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="Channel name" style={{ ...inputStyle, fontSize: "12px", padding: "6px 8px" }} onKeyDown={e => e.key === "Enter" && createChannel()} />
                </div>
              )}
              <div style={{ padding: "0 8px 10px" }}>
                {channels.length === 0 ? (
                  <div style={{ padding: "16px 8px", color: "#94a3b8", fontSize: "12px", textAlign: "center" }}>No channels yet. Create one!</div>
                ) : channels.map(ch => (
                  <button key={ch.id} onClick={() => { setActiveChannel(ch); loadMessages(ch.id); }} style={{
                    width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: "8px", border: "none",
                    background: activeChannel?.id === ch.id ? "#eff6ff" : "transparent",
                    color: activeChannel?.id === ch.id ? "#2563eb" : "#374151",
                    fontSize: "13px", fontWeight: activeChannel?.id === ch.id ? 600 : 400, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <span style={{ fontSize: "12px", opacity: 0.7 }}>#</span>
                    {ch.name}
                    <span style={{ marginLeft: "auto", fontSize: "10px", color: "#94a3b8" }}>{ch._count?.messages || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Content */}
        {activeTab === "chat" ? (
          <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "600px" }}>
            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px" }}>#</span>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{activeChannel?.name || "Select a channel"}</span>
            </div>

            {/* Messages */}
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "40px", marginBottom: "8px" }}>💬</div>
                  <p style={{ fontSize: "14px" }}>No messages yet. Start the conversation!</p>
                </div>
              ) : messages.map((m, i) => {
                const isMe = m.userId === user.id;
                const showAvatar = i === 0 || messages[i - 1].userId !== m.userId;
                return (
                  <div key={m.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: showAvatar ? "14px" : "4px" }}>
                    {showAvatar ? (
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: colors[m.userId % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(m.user?.name)}</div>
                    ) : <div style={{ width: "32px", flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      {showAvatar && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{m.user?.name}</span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      )}
                      <div style={{ fontSize: "13px", color: "#374151", lineHeight: 1.5, background: isMe ? "#eff6ff" : "#f8fafc", padding: "8px 12px", borderRadius: "0 10px 10px 10px", display: "inline-block" }}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={activeChannel ? `Message #${activeChannel.name}...` : "Select a channel"}
                  disabled={!activeChannel}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={sendMessage} disabled={!activeChannel || !msgText.trim()} style={{
                  padding: "10px 20px", borderRadius: "10px", background: "#2563eb", color: "#fff",
                  border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                  opacity: !activeChannel || !msgText.trim() ? 0.5 : 1,
                }}>Send</button>
              </div>
            </div>
          </div>
        ) : (
          /* Announcements Tab */
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Announcements</h2>
              <button onClick={() => setShowAnnounce(!showAnnounce)} style={{ padding: "8px 16px", borderRadius: "10px", background: "#2563eb", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                {showAnnounce ? "Cancel" : "📢 Post Announcement"}
              </button>
            </div>

            {showAnnounce && (
              <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px" }}>
                <form onSubmit={sendAnnouncement} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input value={announcementForm.title} onChange={e => setAnnouncementForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" style={inputStyle} required />
                  <textarea value={announcementForm.content} onChange={e => setAnnouncementForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement..." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} required />
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <select value={announcementForm.priority} onChange={e => setAnnouncementForm(f => ({ ...f, priority: e.target.value }))} style={{ ...inputStyle, width: "130px" }}>
                      <option value="NORMAL">Normal</option>
                      <option value="URGENT">Urgent</option>
                      <option value="INFO">Info</option>
                    </select>
                    <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", background: "#2563eb", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Post</button>
                  </div>
                </form>
              </div>
            )}

            {announcements.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>📢</div>
                <p>No announcements yet</p>
              </div>
            ) : announcements.map(a => {
              const pc = priorityColors[a.priority] || priorityColors.NORMAL;
              return (
                <div key={a.id} style={{ background: pc.bg, borderRadius: "14px", border: `1px solid ${pc.border}`, padding: "18px 20px", borderLeft: `4px solid ${pc.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      {a.priority === "URGENT" && <span style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", marginRight: "8px" }}>⚠️ URGENT</span>}
                      <span style={{ fontSize: "15px", fontWeight: 700, color: pc.color }}>{a.title}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>{a.content}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: colors[a.userId % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#fff" }}>{initials(a.user?.name)}</div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{a.user?.name} · {a.team?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

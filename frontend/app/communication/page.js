"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

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
    <MobileShell title="Communication">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, background: T.card, borderRadius: 12, padding: 4, boxShadow: T.shadow }}>
          {["chat", "announcements"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: "9px", borderRadius: 9, border: "none",
              fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
              background: activeTab === t ? T.primary : "transparent",
              color: activeTab === t ? "#fff" : T.sub,
              transition: "all 0.15s",
            }}>{t === "chat" ? "💬 Chat" : "📢 Announcements"}</button>
          ))}
        </div>

        {activeTab === "chat" && (
          <div style={{ background: T.card, borderRadius: 14, boxShadow: T.shadow }}>
            <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.sub, letterSpacing: 0.5 }}>CHANNELS</span>
              <button onClick={() => setShowNewChannel(!showNewChannel)} style={{ background: T.primaryL, border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer", color: T.primary, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            {showNewChannel && (
              <div style={{ padding: "0 10px 10px", display: "flex", gap: 6, borderBottom: `1px solid ${T.border}` }}>
                <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="Channel name" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 12, outline: "none" }} onKeyDown={e => e.key === "Enter" && createChannel()} />
              </div>
            )}
            <div style={{ padding: "8px 10px", display: "flex", gap: 6, overflowX: "auto" }}>
              {channels.length === 0 ? (
                <div style={{ padding: "12px 8px", color: T.sub, fontSize: 12 }}>No channels yet. Create one!</div>
              ) : channels.map(ch => (
                <button key={ch.id} onClick={() => { setActiveChannel(ch); loadMessages(ch.id); }} style={{
                  flexShrink: 0, padding: "6px 12px", borderRadius: 99,
                  border: `1.5px solid ${activeChannel?.id === ch.id ? T.primary : T.border}`,
                  background: activeChannel?.id === ch.id ? T.primaryL : "#fff",
                  color: activeChannel?.id === ch.id ? T.primary : T.sub,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>#{ch.name}</button>
              ))}
            </div>
          </div>
        )}

        {/* RIGHT: Content */}
        {activeTab === "chat" ? (
          <div style={{ background: T.card, borderRadius: 14, boxShadow: T.shadow, display: "flex", flexDirection: "column", height: 480 }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: T.sub }}>#</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{activeChannel?.name || "Select a channel"}</span>
            </div>

            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: T.sub }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                  <p style={{ fontSize: 14 }}>No messages yet. Start the conversation!</p>
                </div>
              ) : messages.map((m, i) => {
                const isMe = m.userId === user.id;
                const showAvatar = i === 0 || messages[i - 1].userId !== m.userId;
                return (
                  <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: showAvatar ? 12 : 3 }}>
                    {showAvatar ? (
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: colors[m.userId % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(m.user?.name)}</div>
                    ) : <div style={{ width: 28, flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      {showAvatar && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{m.user?.name}</span>
                          <span style={{ fontSize: 10, color: T.sub }}>{new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5, background: isMe ? T.primaryL : T.bg, padding: "8px 12px", borderRadius: "0 10px 10px 10px", display: "inline-block" }}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={msgText} onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={activeChannel ? `Message #${activeChannel.name}...` : "Select a channel"}
                  disabled={!activeChannel}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 24, border: `1.5px solid ${T.border}`, outline: "none", fontSize: 14, background: T.bg }}
                />
                <button onClick={sendMessage} disabled={!activeChannel || !msgText.trim()} style={{
                  padding: "10px 18px", borderRadius: 24, background: T.primary, color: "#fff",
                  border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  opacity: !activeChannel || !msgText.trim() ? 0.5 : 1,
                }}>Send</button>
              </div>
            </div>
          </div>
        ) : (
          /* Announcements Tab */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Announcements</h2>
              <button onClick={() => setShowAnnounce(!showAnnounce)} style={{ padding: "7px 14px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {showAnnounce ? "Cancel" : "📢 Post"}
              </button>
            </div>

            {showAnnounce && (
              <div style={{ background: T.card, borderRadius: 14, boxShadow: T.shadow, padding: 14 }}>
                <form onSubmit={sendAnnouncement} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={announcementForm.title} onChange={e => setAnnouncementForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: "none", boxSizing: "border-box" }} required />
                  <textarea value={announcementForm.content} onChange={e => setAnnouncementForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement..." rows={3} style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} required />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={announcementForm.priority} onChange={e => setAnnouncementForm(f => ({ ...f, priority: e.target.value }))} style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${T.border}`, fontSize: 13, background: "#fff" }}>
                      <option value="NORMAL">Normal</option>
                      <option value="URGENT">Urgent</option>
                      <option value="INFO">Info</option>
                    </select>
                    <button type="submit" style={{ padding: "10px 18px", borderRadius: 9, background: T.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Post</button>
                  </div>
                </form>
              </div>
            )}

            {announcements.length === 0 ? (
              <div style={{ background: T.card, borderRadius: 14, boxShadow: T.shadow, padding: "40px 20px", textAlign: "center", color: T.sub }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📢</div>
                <p>No announcements yet</p>
              </div>
            ) : announcements.map(a => {
              const priorityColors = { URGENT: { bg: "#FEF2F2", color: T.red, border: "#FECACA" }, NORMAL: { bg: T.card, color: T.text, border: T.border }, INFO: { bg: T.primaryL, color: T.primary, border: "#BFDBFE" } };
              const pc = priorityColors[a.priority] || priorityColors.NORMAL;
              return (
                <div key={a.id} style={{ background: pc.bg, borderRadius: 14, border: `1px solid ${pc.border}`, padding: "14px", borderLeft: `4px solid ${pc.color}`, boxShadow: T.shadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      {a.priority === "URGENT" && <span style={{ fontSize: 10, fontWeight: 700, color: T.red, marginRight: 6 }}>⚠️ URGENT</span>}
                      <span style={{ fontSize: 14, fontWeight: 700, color: pc.color }}>{a.title}</span>
                    </div>
                    <span style={{ fontSize: 11, color: T.sub }}>{new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                  <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{a.content}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: colors[a.userId % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff" }}>{initials(a.user?.name)}</div>
                    <span style={{ fontSize: 12, color: T.sub }}>{a.user?.name} · {a.team?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

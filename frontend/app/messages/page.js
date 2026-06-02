"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showChannels, setShowChannels] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    const d = localStorage.getItem("mukijo_user");
    if (!d) { router.replace("/"); return; }
    const u = JSON.parse(d);
    setUser(u);
    fetch(`/api/teams?userId=${u.id}`)
      .then(r => r.json())
      .then(data => {
        const ts = data.teams || [];
        setTeams(ts);
        if (ts.length > 0) loadChannels(ts[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function loadChannels(teamId) {
    setSelectedTeamId(teamId);
    try {
      const res = await fetch(`/api/channels?teamId=${teamId}`);
      const d = await res.json();
      const chs = d.channels || [];
      setChannels(chs);
      if (chs.length > 0) { setActiveChannel(chs[0]); loadMessages(chs[0].id); }
      else setLoading(false);
    } catch { setLoading(false); }
  }

  async function loadMessages(channelId) {
    try {
      const res = await fetch(`/api/messages?channelId=${channelId}`);
      const d = await res.json();
      setMessages(d.messages || []);
      setLoading(false);
      setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 80);
    } catch { setLoading(false); }
  }

  useEffect(() => {
    if (!activeChannel) return;
    const interval = setInterval(() => loadMessages(activeChannel.id), 5000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  const sendMessage = async () => {
    if (!msgText.trim() || !activeChannel || sending) return;
    setSending(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: activeChannel.id, userId: user.id, content: msgText }),
      });
      setMsgText("");
      loadMessages(activeChannel.id);
    } catch { alert("Error sending message"); }
    setSending(false);
  };

  const createChannel = async () => {
    if (!newChannelName || !selectedTeamId) return;
    try {
      await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName, type: "GROUP", teamId: selectedTeamId }),
      });
      setNewChannelName("");
      setShowChannels(false);
      loadChannels(selectedTeamId);
    } catch { alert("Error"); }
  };

  if (!user) return null;
  const initials = n => (n || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const avatarColors = ["#0057B8","#00AA55","#D97706","#7C3AED","#DC2626","#0891B2"];

  return (
    <MobileShell title="Team Chat" noScroll>
      <div style={{ display: "flex", flexDirection: "column", height: `calc(100vh - 56px - ${T.navH}px)` }}>
        {/* Team/Channel selector */}
        <div style={{
          background: T.card, borderBottom: `1px solid ${T.border}`,
          padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          {/* Team selector */}
          {teams.length > 1 && (
            <select
              value={selectedTeamId || ""}
              onChange={e => loadChannels(Number(e.target.value))}
              style={{
                padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${T.border}`,
                fontSize: 12, color: T.text, background: "#fff",
              }}
            >
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          {/* Channel pills */}
          <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto" }}>
            {channels.map(ch => (
              <button key={ch.id} onClick={() => { setActiveChannel(ch); loadMessages(ch.id); }} style={{
                flexShrink: 0, padding: "5px 12px", borderRadius: 99,
                border: `1.5px solid ${activeChannel?.id === ch.id ? T.primary : T.border}`,
                background: activeChannel?.id === ch.id ? T.primaryL : "#fff",
                color: activeChannel?.id === ch.id ? T.primary : T.sub,
                fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}>#{ch.name}</button>
            ))}
            <button onClick={() => setShowChannels(!showChannels)} style={{
              flexShrink: 0, padding: "5px 10px", borderRadius: 99,
              border: `1.5px solid ${T.border}`,
              background: "#fff", color: T.sub, fontSize: 12, cursor: "pointer",
            }}>+ Channel</button>
          </div>
        </div>

        {/* New channel form */}
        {showChannels && (
          <div style={{
            background: "#FFF9F0", borderBottom: `1px solid ${T.border}`,
            padding: "10px 16px", display: "flex", gap: 8, flexShrink: 0,
          }}>
            <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
              placeholder="New channel name..." onKeyDown={e => e.key === "Enter" && createChannel()}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                border: `1.5px solid ${T.border}`, fontSize: 13, outline: "none",
              }}/>
            <button onClick={createChannel} style={{
              padding: "8px 16px", borderRadius: 8, background: T.primary,
              color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>Create</button>
          </div>
        )}

        {/* No team state */}
        {teams.length === 0 && !loading && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.sub }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <p style={{ fontSize: 14, marginBottom: 12 }}>You're not in any team yet</p>
            <button onClick={() => router.push("/groups?create=true")} style={{
              padding: "9px 20px", borderRadius: 10, background: T.primary,
              color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Create a Team</button>
          </div>
        )}

        {/* Messages */}
        {teams.length > 0 && (
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column" }}>
            {loading ? (
              <div style={{ textAlign: "center", paddingTop: 40, color: T.sub }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.sub }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                <p style={{ fontSize: 14 }}>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.userId === user.id;
                const showHeader = i === 0 || messages[i - 1].userId !== msg.userId;
                return (
                  <div key={msg.id} style={{
                    display: "flex", flexDirection: isMe ? "row-reverse" : "row",
                    gap: 8, marginBottom: showHeader ? 14 : 4, alignItems: "flex-end",
                  }}>
                    {!isMe && showHeader && (
                      <div style={{
                        width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                        background: avatarColors[msg.userId % avatarColors.length],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "#fff",
                      }}>{initials(msg.user?.name)}</div>
                    )}
                    {!isMe && !showHeader && <div style={{ width: 30, flexShrink: 0 }}/>}
                    <div style={{ maxWidth: "75%" }}>
                      {!isMe && showHeader && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 3, paddingLeft: 4 }}>
                          {msg.user?.name}
                        </div>
                      )}
                      <div style={{
                        padding: "10px 14px", borderRadius: isMe ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                        background: isMe ? T.primary : T.card,
                        color: isMe ? "#fff" : T.text,
                        fontSize: 14, lineHeight: 1.5,
                        boxShadow: T.shadow,
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: 10, color: T.sub, marginTop: 3, textAlign: isMe ? "right" : "left", paddingLeft: 4 }}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Input bar */}
        {teams.length > 0 && (
          <div style={{
            background: T.card, borderTop: `1px solid ${T.border}`,
            padding: "10px 16px", flexShrink: 0,
            display: "flex", gap: 10, alignItems: "center",
          }}>
            <input
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={activeChannel ? `Message #${activeChannel.name}...` : "Select a channel"}
              disabled={!activeChannel}
              style={{
                flex: 1, padding: "11px 16px", borderRadius: 24,
                border: `1.5px solid ${T.border}`, fontSize: 14,
                outline: "none", background: T.bg,
              }}
            />
            <button onClick={sendMessage} disabled={sending || !msgText.trim() || !activeChannel} style={{
              width: 44, height: 44, borderRadius: 22,
              background: sending || !msgText.trim() || !activeChannel ? T.border : T.primary,
              color: "#fff", border: "none", cursor: "pointer",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s",
            }}>➤</button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [channelId, setChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // File upload simulation state
  const [selectedFile, setSelectedFile] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);

    // Fetch team for this user (assume they belong to the first team they are a member of)
    fetch(`/api/teams?userId=${u.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.teams && d.teams.length > 0) {
          setTeamId(d.teams[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(console.error);
  }, [router]);

  useEffect(() => {
    if (!teamId) return;
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [teamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages?teamId=${teamId}`);
      const data = await res.json();
      setMessages(data.messages || []);
      if (data.channelId) setChannelId(data.channelId);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setSending(true);

    // Simulate file upload (in a real app, upload to S3/Cloudinary and get URL)
    let fileUrl = null;
    let type = "TEXT";
    if (selectedFile) {
      fileUrl = URL.createObjectURL(selectedFile); // Mock URL for demo
      type = "FILE";
    }

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          userId: user.id,
          content: newMessage || "Shared a file",
          type,
          fileUrl
        })
      });
      if (res.ok) {
        setNewMessage("");
        setSelectedFile(null);
        loadMessages();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
    setSending(false);
  };

  if (!user) return null;

  return (
    <AppShell searchPlaceholder="Search messages...">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>Team Chat 💬</h1>
      </div>

      {!teamId && !loading ? (
        <div style={{ background: "#fff", borderRadius: "16px", padding: "60px 20px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Not assigned to a team</h2>
          <p style={{ color: "#64748b", fontSize: "14px" }}>You need to be assigned to a team to access the team chat.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", overflow: "hidden" }}>

          {/* Chat Header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700 }}>
              T
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>General Chat</h2>
              <p style={{ fontSize: "12px", color: "#64748b" }}>Discuss team schedules, matches, and general updates.</p>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginTop: "40px" }}>No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.userId === user.id;
                const showHeader = i === 0 || messages[i - 1].userId !== msg.userId;

                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginBottom: showHeader ? "8px" : "2px" }}>
                    {showHeader && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", padding: "0 4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>{isMe ? "You" : msg.user?.name}</span>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px" }}>{msg.user?.role}</span>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    <div style={{
                      background: isMe ? "#2563eb" : "#f1f5f9",
                      color: isMe ? "#fff" : "#0f172a",
                      padding: "10px 14px",
                      borderRadius: isMe ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                      maxWidth: "75%",
                      fontSize: "14px",
                      lineHeight: "1.5"
                    }}>
                      {msg.content}
                      {msg.fileUrl && (
                        <div style={{ marginTop: "8px", padding: "8px", background: "rgba(255,255,255,0.2)", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>📎</span>
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ color: isMe ? "#fff" : "#2563eb", textDecoration: "underline", fontSize: "12px", wordBreak: "break-all" }}>View Attachment</a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
            {selectedFile && (
              <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", background: "#f1f5f9", padding: "8px 12px", borderRadius: "8px", width: "fit-content" }}>
                <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 600 }}>📎 {selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#ef4444", fontWeight: "bold" }}>✕</button>
              </div>
            )}
            <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <label style={{ cursor: "pointer", padding: "10px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} title="Attach File">
                <input type="file" style={{ display: "none" }} onChange={(e) => setSelectedFile(e.target.files[0])} />
                <span style={{ fontSize: "18px" }}>📎</span>
              </label>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{ flex: 1, padding: "14px 16px", borderRadius: "24px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px" }}
              />
              <button type="submit" disabled={sending || (!newMessage.trim() && !selectedFile)} style={{ padding: "14px 24px", borderRadius: "24px", background: (sending || (!newMessage.trim() && !selectedFile)) ? "#93c5fd" : "#2563eb", color: "#fff", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

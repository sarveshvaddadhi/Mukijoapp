"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

export default function GroupsPage() {
  return (
    <Suspense fallback={<div style={{ background: T.bg, height: "100vh" }}/>}>
      <GroupsContent/>
    </Suspense>
  );
}

function GroupsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [form, setForm] = useState({ name: "", division: "", description: "" });
  const [memberForm, setMemberForm] = useState({ email: "", role: "PLAYER", jersey: "" });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState("teams"); // teams | members

  const handleCopyJoinLink = () => {
    if (!selectedTeam) return;
    const link = `${window.location.origin}/join?teamId=${selectedTeam.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  async function loadMembers(teamId) {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`);
      const d = await res.json();
      setMembers(d.members || []);
    } catch (e) { console.error(e); }
  }

  async function loadTeams(userId) {
    try {
      const res = await fetch(`/api/teams?userId=${userId}`);
      const d = await res.json();
      setTeams(d.teams || []);
      if (d.teams?.length > 0 && !selectedTeam) {
        setSelectedTeam(d.teams[0]);
        loadMembers(d.teams[0].id);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    if (searchParams.get("create") === "true") setShowCreate(true);
    loadTeams(u.id);
  }, [router, searchParams]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!form.name) { alert("Team name required"); return; }
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: user.id }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: "", division: "", description: "" });
        loadTeams(user.id);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.detail || d.message || "Failed to create team.");
      }
    } catch { alert("Server error"); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberForm.email || !selectedTeam) { alert("Email required"); return; }
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberForm),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || data.message || "Failed to add member."); return; }
      setShowAddMember(false);
      setMemberForm({ email: "", role: "PLAYER", jersey: "" });
      loadMembers(selectedTeam.id);
    } catch { alert("Server error"); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/teams/${selectedTeam.id}/members?userId=${userId}`, { method: "DELETE" });
    loadMembers(selectedTeam.id);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Delete this team?")) return;
    await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    setSelectedTeam(null);
    setMembers([]);
    loadTeams(user.id);
  };

  if (!user) return null;

  const initials = n => (n || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const avatarColors = ["#0057B8","#00AA55","#D97706","#7C3AED","#DC2626","#0891B2"];
  const roleColors = {
    PLAYER: { bg: "#E8F0FB", color: "#0057B8" },
    COACH:  { bg: "#FFF7ED", color: "#D97706" },
    PARENT: { bg: "#E8F9F2", color: "#00AA55" },
    ADMIN:  { bg: "#FEF2F2", color: "#DC2626" },
  };
  const inputStyle = {
    width: "100%", padding: "11px 13px", borderRadius: 10,
    border: `1.5px solid ${T.border}`, fontSize: 14, color: T.text,
    background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <MobileShell title="Groups" rightAction={
      <button onClick={() => setShowCreate(v => !v)} style={{
        background: showCreate ? "#FEF2F2" : T.primary, color: showCreate ? T.red : "#fff",
        border: "none", borderRadius: 10, padding: "6px 14px",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
      }}>
        {showCreate ? "✕ Cancel" : "+ Team"}
      </button>
    }>
      {/* Create Team Form */}
      {showCreate && (
        <div style={{ background: T.card, borderRadius: 16, padding: "18px 16px", boxShadow: T.shadow, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 14 }}>Create New Team</h2>
          <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Team name *" style={inputStyle} required/>
            <input value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))}
              placeholder="Division / Category" style={inputStyle}/>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description" rows={2} style={{ ...inputStyle, resize: "vertical" }}/>
            <button type="submit" style={{
              padding: "12px", borderRadius: 12, background: T.primary,
              color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>Create Team</button>
          </form>
        </div>
      )}

      {/* Teams Grid */}
      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: T.sub }}>Loading teams...</div>
      ) : (
        <>
          {teams.length === 0 && !showCreate && (
            <div style={{ background: T.card, borderRadius: 16, padding: "40px 20px", textAlign: "center", boxShadow: T.shadow, marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
              <p style={{ fontSize: 14, color: T.sub }}>No teams yet. Create your first team!</p>
              <button onClick={() => setShowCreate(true)} style={{
                marginTop: 12, padding: "9px 20px", borderRadius: 10,
                background: T.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>+ Create Team</button>
            </div>
          )}

          {/* Team cards */}
          {teams.map((t, i) => (
            <div key={t.id} style={{
              background: T.card, borderRadius: 16, marginBottom: 10,
              boxShadow: T.shadow, overflow: "hidden",
              border: selectedTeam?.id === t.id ? `2px solid ${T.primary}` : `2px solid transparent`,
            }}>
              {/* Top colour bar */}
              <div style={{ height: 4, background: avatarColors[i % avatarColors.length] }}/>
              <div style={{ padding: "14px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: avatarColors[i % avatarColors.length],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0,
                  }}>{initials(t.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{t.name}</div>
                    {t.division && <div style={{ fontSize: 12, color: T.sub }}>{t.division}</div>}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                    background: t.status === "ACTIVE" ? "#E8F9F2" : "#F1F5F9",
                    color: t.status === "ACTIVE" ? "#00AA55" : T.sub,
                  }}>{t.status}</span>
                </div>

                {/* Member avatars */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                  {t.members?.slice(0, 5).map((m, j) => (
                    <div key={j} style={{
                      width: 28, height: 28, borderRadius: 14,
                      background: avatarColors[j % avatarColors.length],
                      border: "2px solid #fff", marginLeft: j > 0 ? -8 : 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700, color: "#fff",
                    }}>{initials(m.user.name)}</div>
                  ))}
                  {t._count?.members > 5 && (
                    <span style={{ fontSize: 11, color: T.sub, marginLeft: 6 }}>
                      +{t._count.members - 5} more
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: T.sub, marginLeft: "auto" }}>
                    👥 {t._count?.members || 0} members
                  </span>
                </div>

                {/* Quick actions row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                  <button onClick={() => { setSelectedTeam(t); loadMembers(t.id); setActiveView("members"); }} style={{
                    padding: "7px 4px", borderRadius: 8, border: `1.5px solid ${T.border}`,
                    background: "#fff", fontSize: 10, fontWeight: 600, color: T.text, cursor: "pointer",
                  }}>👥 Members</button>
                  <button onClick={() => router.push(`/events?teamId=${t.id}`)} style={{
                    padding: "7px 4px", borderRadius: 8, border: `1.5px solid ${T.border}`,
                    background: "#fff", fontSize: 10, fontWeight: 600, color: T.primary, cursor: "pointer",
                  }}>📅 Events</button>
                  <button onClick={() => router.push(`/payments?teamId=${t.id}`)} style={{
                    padding: "7px 4px", borderRadius: 8, border: `1.5px solid ${T.border}`,
                    background: "#fff", fontSize: 10, fontWeight: 600, color: "#00AA55", cursor: "pointer",
                  }}>💳 Fees</button>
                  <button onClick={() => handleCopyJoinLink(t)} style={{
                    padding: "7px 4px", borderRadius: 8, border: `1.5px solid ${T.border}`,
                    background: "#fff", fontSize: 10, fontWeight: 600, color: "#D97706", cursor: "pointer",
                  }}>🔗 Invite</button>
                </div>
              </div>
            </div>
          ))}

          {/* Member Management Panel */}
          {selectedTeam && (
            <div style={{ background: T.card, borderRadius: 16, boxShadow: T.shadow, marginTop: 10, overflow: "hidden" }}>
              <div style={{ padding: "14px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{selectedTeam.name}</h2>
                  <p style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>Member Management</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleCopyJoinLink} style={{
                    padding: "7px 12px", borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: copied ? "#E8F9F2" : "#fff", color: copied ? "#00AA55" : T.primary,
                    border: `1.5px solid ${copied ? "#00AA55" : T.border}`,
                  }}>{copied ? "✓ Copied!" : "🔗 Join Link"}</button>
                  <button onClick={() => setShowAddMember(!showAddMember)} style={{
                    padding: "7px 12px", borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: T.primary, color: "#fff", border: "none",
                  }}>{showAddMember ? "Cancel" : "+ Member"}</button>
                </div>
              </div>

              {/* Add member form */}
              {showAddMember && (
                <div style={{ padding: "12px 14px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  <form onSubmit={handleAddMember} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="Member email *" style={inputStyle} required type="email"/>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
                        {["PLAYER","COACH","PARENT","ADMIN"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <input value={memberForm.jersey} onChange={e => setMemberForm(f => ({ ...f, jersey: e.target.value }))}
                        placeholder="Jersey # (optional)" style={inputStyle}/>
                    </div>
                    <button type="submit" style={{
                      padding: "10px", borderRadius: 10, background: "#00AA55",
                      color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}>Add Member</button>
                  </form>
                </div>
              )}

              {/* Members list */}
              {members.length === 0 ? (
                <div style={{ padding: "30px 20px", textAlign: "center", color: T.sub, fontSize: 13 }}>
                  No members yet. Add your first member above.
                </div>
              ) : (
                <div>
                  {members.map((m, i) => {
                    const rc = roleColors[m.role] || roleColors.PLAYER;
                    return (
                      <div key={m.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderBottom: `1px solid ${T.border}`,
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 12,
                          background: avatarColors[i % avatarColors.length],
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>{initials(m.user.name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.user.name}</div>
                          <div style={{ fontSize: 11, color: T.sub }}>{m.user.email}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          {m.jersey && <span style={{ fontSize: 11, color: T.sub }}>#{m.jersey}</span>}
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                            background: rc.bg, color: rc.color,
                          }}>{m.role}</span>
                          <button onClick={() => handleRemoveMember(m.userId)} style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: T.red, fontSize: 16, padding: "2px",
                          }}>×</button>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 12, color: T.sub }}>{members.length} members</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </MobileShell>
  );
}

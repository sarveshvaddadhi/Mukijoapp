"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function GroupsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [form, setForm] = useState({ name: "", division: "", description: "" });
  const [memberForm, setMemberForm] = useState({ email: "", role: "PLAYER", jersey: "" });
  const [loading, setLoading] = useState(true);
  const [linkingMemberId, setLinkingMemberId] = useState(null);
  const [linkSelectValue, setLinkSelectValue] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyJoinLink = () => {
    if (!selectedTeam) return;
    const link = `${window.location.origin}/join?teamId=${selectedTeam.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    loadTeams(u.id);
  }, [router]);

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
  };

  async function loadMembers(teamId) {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`);
      const d = await res.json();
      setMembers(d.members || []);
    } catch (e) { console.error(e); }
  };

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
        body: JSON.stringify({
          email: memberForm.email,
          role: memberForm.role,
          jersey: memberForm.jersey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to add member.");
        return;
      }
      setShowAddMember(false);
      setMemberForm({ email: "", role: "PLAYER", jersey: "" });
      loadMembers(selectedTeam.id);
    } catch {
      alert("Server error");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/teams/${selectedTeam.id}/members?userId=${userId}`, { method: "DELETE" });
    loadMembers(selectedTeam.id);
  };

  const handleLink = async (parentId, childId) => {
    try {
      const res = await fetch("/api/parent-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, childId }),
      });
      if (res.ok) {
        setLinkingMemberId(null);
        setLinkSelectValue("");
        loadMembers(selectedTeam.id);
      } else {
        const d = await res.json();
        alert(d.message || "Failed to link");
      }
    } catch {
      alert("Server error");
    }
  };

  const handleUnlink = async (parentId, childId) => {
    if (!confirm("Are you sure you want to unlink this family connection?")) return;
    try {
      const res = await fetch(`/api/parent-links?parentId=${parentId}&childId=${childId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadMembers(selectedTeam.id);
      } else {
        const d = await res.json();
        alert(d.message || "Failed to unlink");
      }
    } catch {
      alert("Server error");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Delete this team?")) return;
    await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    setSelectedTeam(null);
    setMembers([]);
    loadTeams(user.id);
  };

  if (!user) return null;
  const initials = (n) => n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box" };
  const roleColors = { PLAYER: { bg: "#e0e7ff", color: "#4f46e5" }, COACH: { bg: "#fefce8", color: "#d97706" }, PARENT: { bg: "#f0fdf4", color: "#16a34a" }, ADMIN: { bg: "#fef2f2", color: "#dc2626" } };

  return (
    <AppShell searchPlaceholder="Search groups or members...">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>Your Groups</h1>
      </div>

      {/* Group Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {teams.map((t, i) => (
          <div key={t.id}
            onClick={() => { setSelectedTeam(t); loadMembers(t.id); }}
            style={{
              background: "#fff", borderRadius: "14px", padding: "20px",
              border: selectedTeam?.id === t.id ? "2px solid #4f46e5" : "1px solid #e2e8f0",
              cursor: "pointer", transition: "all 0.15s",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{t.name}</div>
                {t.division && <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500, marginTop: "2px" }}>{t.division}</div>}
              </div>
              <span style={{ background: t.status === "ACTIVE" ? "#dcfce7" : "#f1f5f9", color: t.status === "ACTIVE" ? "#16a34a" : "#64748b", fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px" }}>{t.status}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
              {t.members?.slice(0, 3).map((m, j) => (
                <div key={j} style={{ width: "26px", height: "26px", borderRadius: "50%", background: colors[j % colors.length], border: "2px solid #fff", marginLeft: j > 0 ? "-8px" : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#fff" }}>
                  {initials(m.user.name)}
                </div>
              ))}
              {t._count?.members > 3 && <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }}>+{t._count.members - 3}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>👥 {t._count?.members || 0} members</span>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "11px" }}>Delete</button>
            </div>
          </div>
        ))}

        {/* Create New Group */}
        <div onClick={() => setShowCreate(true)} style={{
          background: "#fff", borderRadius: "14px", padding: "20px",
          border: "2px dashed #e2e8f0",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: "pointer", gap: "10px", minHeight: "140px",
          transition: "border-color 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#4f46e5"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#94a3b8" }}>+</div>
          <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Create New Group</span>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreate && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Create Team</h2>
          <form onSubmit={handleCreateTeam} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Team Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Under 15s Blue" style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Division</label>
              <input value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))} placeholder="e.g. Elite Division" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={{ padding: "10px 24px", borderRadius: "10px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Create</button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 24px", borderRadius: "10px", background: "#f1f5f9", color: "#374151", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Member Management */}
      {selectedTeam && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Member Management</h2>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Manage players, staff and families for {selectedTeam.name}</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleCopyJoinLink} style={{ padding: "9px 16px", borderRadius: "10px", background: copied ? "#16a34a" : "#fff", color: copied ? "#fff" : "#4f46e5", border: copied ? "none" : "1.5px solid #cbd5e1", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px" }}>
                {copied ? "✓ Copied!" : "🔗 Copy Join Link"}
              </button>
              <button onClick={() => setShowAddMember(!showAddMember)} style={{ padding: "9px 16px", borderRadius: "10px", background: "#4f46e5", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                {showAddMember ? "Cancel" : "👤 Add Member"}
              </button>
            </div>
          </div>

          {/* Add Member Form */}
          {showAddMember && (
            <div style={{ padding: "16px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <form onSubmit={handleAddMember} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Email *</label>
                  <input value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))} placeholder="member@email.com" style={{ ...inputStyle, width: "200px" }} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Role</label>
                  <select value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, width: "120px" }}>
                    <option value="PLAYER">Player</option>
                    <option value="COACH">Coach</option>
                    <option value="PARENT">Parent</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Jersey #</label>
                  <input value={memberForm.jersey} onChange={e => setMemberForm(f => ({ ...f, jersey: e.target.value }))} placeholder="#10" style={{ ...inputStyle, width: "80px" }} />
                </div>
                <button type="submit" style={{ padding: "10px 18px", borderRadius: "8px", background: "#16a34a", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Add</button>
              </form>
            </div>
          )}

          {/* Members Table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["MEMBER", "ROLE", "CONTACT", "FAMILY", "JERSEY", "ACTIONS"].map(h => (
                  <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "40px 24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>No members yet. Add your first member above.</td></tr>
              ) : members.map((m, i) => {
                const rc = roleColors[m.role] || roleColors.PLAYER;
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>{initials(m.user.name)}</div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{m.user.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <span style={{ background: rc.bg, color: rc.color, fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px" }}>{m.role}</span>
                    </td>
                    <td style={{ padding: "14px 24px", fontSize: "13px", color: "#64748b" }}>{m.user.email}</td>
                    <td style={{ padding: "14px 24px", fontSize: "13px", color: "#64748b" }}>
                      {m.role === "PLAYER" && (
                        <div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {(m.user.childLinks || []).map(link => (
                              <div key={link.id} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                                <span style={{ color: "#374151" }}>👨‍👩‍👦 {link.parent.name}</span>
                                <button onClick={() => handleUnlink(link.parentId, m.userId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "12px", padding: 0 }} title="Remove parent link">×</button>
                              </div>
                            ))}
                          </div>

                          {linkingMemberId === m.id ? (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                              <select
                                value={linkSelectValue}
                                onChange={e => setLinkSelectValue(e.target.value)}
                                style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "11px", background: "#fff", color: "#374151" }}
                              >
                                <option value="">Select Parent</option>
                                {members
                                  .filter(x => x.role === "PARENT" && !(m.user.childLinks || []).some(p => p.parentId === x.userId))
                                  .map(x => <option key={x.userId} value={x.userId}>{x.user.name}</option>)
                                }
                              </select>
                              <button
                                onClick={() => linkSelectValue && handleLink(linkSelectValue, m.userId)}
                                style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setLinkingMemberId(null)}
                                style={{ background: "#cbd5e1", color: "#374151", border: "none", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setLinkingMemberId(m.id); setLinkSelectValue(""); }}
                              style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: 0, marginTop: "4px" }}
                            >
                              + Add Parent
                            </button>
                          )}
                        </div>
                      )}

                      {m.role === "PARENT" && (
                        <div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {(m.user.parentLinks || []).map(link => (
                              <div key={link.id} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                                <span style={{ color: "#374151" }}>🧒 {link.child.name}</span>
                                <button onClick={() => handleUnlink(m.userId, link.childId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "12px", padding: 0 }} title="Remove child link">×</button>
                              </div>
                            ))}
                          </div>

                          {linkingMemberId === m.id ? (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                              <select
                                value={linkSelectValue}
                                onChange={e => setLinkSelectValue(e.target.value)}
                                style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "11px", background: "#fff", color: "#374151" }}
                              >
                                <option value="">Select Player</option>
                                {members
                                  .filter(x => x.role === "PLAYER" && !(m.user.parentLinks || []).some(c => c.childId === x.userId))
                                  .map(x => <option key={x.userId} value={x.userId}>{x.user.name}</option>)
                                }
                              </select>
                              <button
                                onClick={() => linkSelectValue && handleLink(m.userId, linkSelectValue)}
                                style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setLinkingMemberId(null)}
                                style={{ background: "#cbd5e1", color: "#374151", border: "none", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setLinkingMemberId(m.id); setLinkSelectValue(""); }}
                              style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: 0, marginTop: "4px" }}
                            >
                              + Add Child
                            </button>
                          )}
                        </div>
                      )}

                      {m.role !== "PLAYER" && m.role !== "PARENT" && "—"}
                    </td>
                    <td style={{ padding: "14px 24px", fontSize: "13px", color: "#64748b" }}>{m.jersey || "—"}</td>
                    <td style={{ padding: "14px 24px" }}>
                      <button onClick={() => handleRemoveMember(m.userId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "12px" }}>Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Showing {members.length} members</span>
          </div>
        </div>
      )}
    </AppShell>
  );
}

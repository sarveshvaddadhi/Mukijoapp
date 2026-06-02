"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

export default function FundraisingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDonate, setShowDonate] = useState(null);
  const [donateAmount, setDonateAmount] = useState("");
  const [donateMsg, setDonateMsg] = useState("");
  const [form, setForm] = useState({ title: "", description: "", goalAmount: "", teamId: "", endDate: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    loadData(u.id);
  }, [router]);

  async function loadData(userId) {
    try {
      const [cRes, tRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch(`/api/teams?userId=${userId}`),
      ]);
      const cData = await cRes.json();
      const tData = await tRes.json();
      setCampaigns(cData.campaigns || []);
      setTeams(tData.teams || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const update = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.goalAmount || !form.teamId) { alert("Title, goal and team required"); return; }
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, goalAmount: parseFloat(form.goalAmount), teamId: parseInt(form.teamId), createdById: user.id }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ title: "", description: "", goalAmount: "", teamId: "", endDate: "" });
        loadData(user.id);
      }
    } catch { alert("Server error"); }
  };

  const handleDonate = async (campaignId) => {
    if (!donateAmount) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount: parseFloat(donateAmount), message: donateMsg }),
      });
      if (res.ok) {
        setShowDonate(null);
        setDonateAmount("");
        setDonateMsg("");
        loadData(user.id);
      }
    } catch { alert("Server error"); }
  };

  if (!user) return null;
  const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box" };

  return (
    <MobileShell title="Fundraising" rightAction={
      <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? "#FEF2F2" : T.primary, color: showForm ? T.red : "#fff", border: "none", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        {showForm ? "✕ Cancel" : "🎯 Campaign"}
      </button>
    }>
      {/* Create Form */}
      {showForm && (
        <div style={{ background: T.card, borderRadius: 16, boxShadow: T.shadow, padding: "18px 16px", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 14 }}>Create Campaign</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.title} onChange={update("title")} placeholder="Campaign title *" style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, color: T.text, background: "#fff", outline: "none", boxSizing: "border-box" }} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "block", marginBottom: 4 }}>Goal Amount (₹) *</label>
                <input type="number" value={form.goalAmount} onChange={update("goalAmount")} placeholder="50000" style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, color: T.text, background: "#fff", outline: "none", boxSizing: "border-box" }} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "block", marginBottom: 4 }}>Team *</label>
                <select value={form.teamId} onChange={update("teamId")} style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, color: T.text, background: "#fff", outline: "none", boxSizing: "border-box" }} required>
                  <option value="">Select team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <input type="date" value={form.endDate} onChange={update("endDate")} style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, color: T.text, background: "#fff", outline: "none", boxSizing: "border-box" }} />
            <textarea value={form.description} onChange={update("description")} rows={2} placeholder="Campaign details..." style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontSize: 14, color: T.text, background: "#fff", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
            <button type="submit" style={{ padding: "12px", borderRadius: 12, background: T.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Launch Campaign</button>
          </form>
        </div>
      )}

      {/* Campaign Cards */}
      {loading ? <div style={{ textAlign: "center", padding: "60px", color: T.sub }}>Loading...</div> :
        campaigns.length === 0 ? (
          <div style={{ background: T.card, borderRadius: 16, padding: "60px 20px", textAlign: "center", boxShadow: T.shadow }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.sub }}>No campaigns yet</p>
            <button onClick={() => setShowForm(true)} style={{ marginTop: 12, padding: "9px 20px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Start Campaign</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {campaigns.map(c => {
              const pct = c.goalAmount > 0 ? Math.min(100, Math.round((c.raised / c.goalAmount) * 100)) : 0;
              return (
                <div key={c.id} style={{ background: T.card, borderRadius: 16, boxShadow: T.shadow, overflow: "hidden" }}>
                  <div style={{ height: 6, background: `linear-gradient(90deg, ${pct >= 100 ? "#00AA55" : T.primary} ${pct}%, ${T.border} ${pct}%)` }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.title}</h3>
                        <p style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{c.team?.name}</p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        background: c.status === "COMPLETED" ? "#E8F9F2" : c.status === "PAUSED" ? "#FFFBEB" : T.primaryL,
                        color: c.status === "COMPLETED" ? "#00AA55" : c.status === "PAUSED" ? "#D97706" : T.primary,
                      }}>{c.status}</span>
                    </div>
                    {c.description && <p style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>{c.description}</p>}

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fmt(c.raised)}</span>
                        <span style={{ fontSize: 12, color: T.sub }}>of {fmt(c.goalAmount)}</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 4, background: T.border, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: pct >= 100 ? "#00AA55" : T.primary, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 100 ? "#00AA55" : T.primary }}>{pct}% funded</span>
                        <span style={{ fontSize: 11, color: T.sub }}>{c._count?.donations || 0} donors</span>
                      </div>
                    </div>

                    {/* Recent Donations */}
                    {c.donations?.slice(0, 3).map(d => (
                      <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid #f8fafc", fontSize: "12px" }}>
                        <span style={{ color: "#64748b" }}>{d.user.name}</span>
                        <span style={{ fontWeight: 700, color: "#16a34a" }}>{fmt(d.amount)}</span>
                      </div>
                    ))}

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={() => setShowDonate(showDonate === c.id ? null : c.id)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: T.primary, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>💝 Donate</button>
                      <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + "/fundraising?id=" + c.id); alert("Link copied!"); }} style={{ padding: "10px 14px", borderRadius: 10, background: T.bg, color: T.text, border: `1.5px solid ${T.border}`, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🔗</button>
                    </div>
                    {showDonate === c.id && (
                      <div style={{ marginTop: 10, padding: 12, background: T.bg, borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        <input type="number" value={donateAmount} onChange={e => setDonateAmount(e.target.value)} placeholder="Amount (₹)" style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: `1.5px solid ${T.border}`, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                        <input value={donateMsg} onChange={e => setDonateMsg(e.target.value)} placeholder="Message (optional)" style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: `1.5px solid ${T.border}`, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                        <button onClick={() => handleDonate(c.id)} style={{ padding: 10, borderRadius: 9, background: "#00AA55", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Confirm Donation</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </MobileShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

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
    <AppShell searchPlaceholder="Search campaigns...">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>Fundraising</h1>
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", borderRadius: "10px", background: "#2563eb", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          {showForm ? "Cancel" : "🎯 New Campaign"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Create Campaign</h2>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Campaign Title *</label>
              <input value={form.title} onChange={update("title")} placeholder="e.g. New Equipment Fund" style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Goal Amount (₹) *</label>
              <input type="number" value={form.goalAmount} onChange={update("goalAmount")} placeholder="50000" style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Team *</label>
              <select value={form.teamId} onChange={update("teamId")} style={inputStyle} required>
                <option value="">Select team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>End Date</label>
              <input type="date" value={form.endDate} onChange={update("endDate")} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Description</label>
              <textarea value={form.description} onChange={update("description")} rows={2} placeholder="Campaign details..." style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div><button type="submit" style={{ padding: "11px 28px", borderRadius: "10px", background: "#2563eb", color: "#fff", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Launch Campaign</button></div>
          </form>
        </div>
      )}

      {/* Campaign Cards */}
      {loading ? <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Loading...</div> :
        campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎯</div>
            <p style={{ fontSize: "15px", fontWeight: 600 }}>No campaigns yet</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {campaigns.map(c => {
              const pct = c.goalAmount > 0 ? Math.min(100, Math.round((c.raised / c.goalAmount) * 100)) : 0;
              return (
                <div key={c.id} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ height: "8px", background: `linear-gradient(90deg, ${pct >= 100 ? "#16a34a" : "#2563eb"} ${pct}%, #e2e8f0 ${pct}%)` }} />
                  <div style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>{c.title}</h3>
                        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "3px" }}>{c.team?.name} · by {c.createdBy?.name}</p>
                      </div>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px",
                        background: c.status === "COMPLETED" ? "#dcfce7" : c.status === "PAUSED" ? "#fefce8" : "#eff6ff",
                        color: c.status === "COMPLETED" ? "#16a34a" : c.status === "PAUSED" ? "#d97706" : "#2563eb",
                      }}>{c.status}</span>
                    </div>

                    {c.description && <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>{c.description}</p>}

                    {/* Progress */}
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>{fmt(c.raised)}</span>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>of {fmt(c.goalAmount)}</span>
                      </div>
                      <div style={{ height: "8px", borderRadius: "4px", background: "#f1f5f9", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "4px", background: pct >= 100 ? "#16a34a" : "linear-gradient(90deg, #2563eb, #4f46e5)", transition: "width 0.5s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: pct >= 100 ? "#16a34a" : "#2563eb" }}>{pct}% funded</span>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>{c._count?.donations || 0} donors</span>
                      </div>
                    </div>

                    {/* Recent Donations */}
                    {c.donations?.slice(0, 3).map(d => (
                      <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid #f8fafc", fontSize: "12px" }}>
                        <span style={{ color: "#64748b" }}>{d.user.name}</span>
                        <span style={{ fontWeight: 700, color: "#16a34a" }}>{fmt(d.amount)}</span>
                      </div>
                    ))}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                      <button onClick={() => setShowDonate(showDonate === c.id ? null : c.id)} style={{
                        flex: 1, padding: "10px", borderRadius: "10px", background: "#2563eb", color: "#fff",
                        border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                      }}>💝 Donate</button>
                      <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + "/fundraising?id=" + c.id); alert("Link copied!"); }} style={{
                        padding: "10px 16px", borderRadius: "10px", background: "#f1f5f9", color: "#374151",
                        border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                      }}>🔗 Share</button>
                    </div>

                    {/* Donate Form */}
                    {showDonate === c.id && (
                      <div style={{ marginTop: "12px", padding: "12px", background: "#f8fafc", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <input type="number" value={donateAmount} onChange={e => setDonateAmount(e.target.value)} placeholder="Amount (₹)" style={inputStyle} />
                        <input value={donateMsg} onChange={e => setDonateMsg(e.target.value)} placeholder="Message (optional)" style={inputStyle} />
                        <button onClick={() => handleDonate(c.id)} style={{ padding: "10px", borderRadius: "8px", background: "#16a34a", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Confirm Donation</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </AppShell>
  );
}

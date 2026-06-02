"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div style={{ background: T.bg, height: "100vh" }}/>}>
      <PaymentsContent/>
    </Suspense>
  );
}

function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalCollected: 0, pendingAmount: 0, overdueAmount: 0 });
  const [showForm, setShowForm] = useState(false);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    userId: "", amount: "", type: "MEMBERSHIP", method: "UPI",
    description: "", dueDate: "", status: "PENDING",
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) { router.replace("/"); return; }
    const u = JSON.parse(data);
    setUser(u);
    if (searchParams.get("create") === "true") setShowForm(true);
    const evType = searchParams.get("type");
    const evRef  = searchParams.get("eventRef");
    if (evType) setForm(f => ({ ...f, type: evType, description: evRef ? `Fees for: ${evRef}` : "" }));
    loadData(u.id);
  }, [router, searchParams]);

  async function loadData(userId) {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch("/api/payments"),
        fetch(`/api/teams?userId=${userId}`),
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      setPayments(pData.payments || []);
      setSummary(pData.summary || { totalCollected: 0, pendingAmount: 0, overdueAmount: 0 });
      const allMembers = [];
      (tData.teams || []).forEach(t =>
        (t.members || []).forEach(m => {
          if (!allMembers.find(x => x.id === m.user.id)) allMembers.push(m.user);
        })
      );
      setMembers(allMembers);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.amount) { alert("Member and amount required"); return; }
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ userId: "", amount: "", type: "MEMBERSHIP", method: "UPI", description: "", dueDate: "", status: "PENDING" });
        loadData(user.id);
      }
    } catch { alert("Server error"); }
  };

  const updateStatus = async (paymentId, newStatus) => {
    try {
      await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      loadData(user.id);
    } catch { alert("Error"); }
  };

  const handleRemind = async (p) => {
    if (!p.user?.phone) return alert("User has no phone number on record.");
    try {
      await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: p.user.phone,
          message: `Reminder from Mukijo: ₹${p.amount} pending for ${p.type}. Please settle soon.`,
        }),
      });
      alert("Reminder sent!");
    } catch { alert("Error sending reminder."); }
  };

  if (!user) return null;

  const fmt = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const initials = n => (n || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const avatarColors = ["#0057B8","#00AA55","#D97706","#7C3AED","#DC2626","#0891B2"];
  const statusStyle = {
    PAID:     { bg: "#E8F9F2", color: "#00AA55", label: "Paid"     },
    PENDING:  { bg: "#FFFBEB", color: "#D97706", label: "Pending"  },
    OVERDUE:  { bg: "#FEF2F2", color: "#DC2626", label: "Overdue"  },
    REFUNDED: { bg: "#F1F5F9", color: "#6B7280", label: "Refunded" },
  };
  const inputStyle = {
    width: "100%", padding: "11px 13px", borderRadius: 10,
    border: `1.5px solid ${T.border}`, fontSize: 14, color: T.text,
    background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  const filtered = filterStatus === "ALL" ? payments : payments.filter(p => p.status === filterStatus);

  return (
    <MobileShell title="Payments" rightAction={
      <button onClick={() => setShowForm(v => !v)} style={{
        background: showForm ? "#FEF2F2" : T.primary, color: showForm ? T.red : "#fff",
        border: "none", borderRadius: 10, padding: "6px 14px",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
      }}>
        {showForm ? "✕ Cancel" : "+ Payment"}
      </button>
    }>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Collected",   val: fmt(summary.totalCollected), color: "#00AA55", bg: "#E8F9F2", icon: "💰" },
          { label: "Pending",     val: fmt(summary.pendingAmount),  color: "#D97706", bg: "#FFFBEB", icon: "⏳" },
          { label: "Overdue",     val: fmt(summary.overdueAmount),  color: "#DC2626", bg: "#FEF2F2", icon: "⚠️" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 12, padding: "12px 10px",
            border: `1px solid ${s.color}20`,
          }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick action: Settlement */}
      <div onClick={() => router.push("/settlement")} style={{
        background: T.card, borderRadius: 12, padding: "12px 14px",
        boxShadow: T.shadow, marginBottom: 16, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 12,
        border: `1px solid ${T.border}`,
      }}>
        <span style={{ fontSize: 20 }}>🏦</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Fee Settlement</div>
          <div style={{ fontSize: 12, color: T.sub }}>Track and settle outstanding fees</div>
        </div>
        <span style={{ color: T.sub, fontSize: 16 }}>›</span>
      </div>

      {/* Create Payment Form */}
      {showForm && (
        <div style={{ background: T.card, borderRadius: 16, padding: "18px 16px", boxShadow: T.shadow, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 14 }}>Record Payment</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} style={inputStyle} required>
              <option value="">Select member *</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "block", marginBottom: 4 }}>Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0" style={inputStyle} required/>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "block", marginBottom: 4 }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  {["MEMBERSHIP","EVENT","VENUE","OTHER"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "block", marginBottom: 4 }}>Method</label>
                <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} style={inputStyle}>
                  {["UPI","CASH","CARD","BANK_TRANSFER"].map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "block", marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                  {["PENDING","PAID","OVERDUE"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description (e.g. Monthly fee – October)" style={inputStyle}/>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "block", marginBottom: 4 }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={inputStyle}/>
            </div>

            <button type="submit" style={{
              padding: "12px", borderRadius: 12, background: T.primary,
              color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>Save Payment</button>
          </form>
        </div>
      )}

      {/* Filter pills */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 14,
        background: T.card, borderRadius: 12, padding: 4, boxShadow: T.shadow,
      }}>
        {["ALL","PAID","PENDING","OVERDUE"].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} style={{
            flex: 1, padding: "7px 4px", borderRadius: 9, border: "none",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
            background: filterStatus === f ? T.primary : "transparent",
            color: filterStatus === f ? "#fff" : T.sub,
          }}>{f}</button>
        ))}
      </div>

      {/* Payments list */}
      {loading ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: T.sub }}>Loading payments...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: T.card, borderRadius: 16, padding: "40px 20px", textAlign: "center", boxShadow: T.shadow }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
          <p style={{ fontSize: 14, color: T.sub }}>No payments found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((p, i) => {
            const sc = statusStyle[p.status] || statusStyle.PENDING;
            return (
              <div key={p.id} style={{
                background: T.card, borderRadius: 14, padding: "14px 14px",
                boxShadow: T.shadow, display: "flex", alignItems: "center", gap: 12,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: avatarColors[i % avatarColors.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>{initials(p.user?.name)}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{p.user?.name}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                    {p.type}{p.description ? ` · ${p.description}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                    {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {p.method ? ` · ${p.method.replace("_", " ")}` : ""}
                  </div>
                </div>

                {/* Amount & status */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontSize: 16, fontWeight: 800,
                    color: p.status === "PAID" ? "#00AA55" : p.status === "OVERDUE" ? T.red : "#D97706",
                  }}>₹{Number(p.amount).toLocaleString("en-IN")}</div>
                  <select value={p.status} onChange={e => updateStatus(p.id, e.target.value)} style={{
                    marginTop: 4, background: sc.bg, color: sc.color,
                    fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                    border: "none", cursor: "pointer",
                  }}>
                    {["PAID","PENDING","OVERDUE","REFUNDED"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {(p.status === "PENDING" || p.status === "OVERDUE") && (
                    <button onClick={() => handleRemind(p)} style={{
                      display: "block", marginTop: 4, background: T.primaryL, color: T.primary,
                      border: "none", borderRadius: 6, padding: "2px 8px",
                      fontSize: 10, fontWeight: 600, cursor: "pointer",
                    }}>🔔 Remind</button>
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

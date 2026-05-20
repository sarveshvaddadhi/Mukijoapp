"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function PaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalCollected: 0, pendingAmount: 0, overdueAmount: 0 });
  const [showForm, setShowForm] = useState(false);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ userId: "", amount: "", type: "MEMBERSHIP", method: "UPI", description: "", dueDate: "", status: "PENDING" });
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
      const [pRes, tRes] = await Promise.all([
        fetch("/api/payments"),
        fetch(`/api/teams?userId=${userId}`),
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      setPayments(pData.payments || []);
      setSummary(pData.summary || { totalCollected: 0, pendingAmount: 0, overdueAmount: 0 });
      setTeams(tData.teams || []);
      // Collect all unique members
      const allMembers = [];
      (tData.teams || []).forEach(t => {
        (t.members || []).forEach(m => {
          if (!allMembers.find(x => x.id === m.user.id)) allMembers.push(m.user);
        });
      });
      setMembers(allMembers);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const update = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));
  const handleRemind = async (payment) => {
    if (!payment.user?.phone) return alert("User has no phone number on record.");
    try {
      const res = await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: payment.user.phone, 
          message: `Reminder from Mukijo: You have a pending due of Rs.${payment.amount} for ${payment.type}. Please settle it soon.`
        })
      });
      if (res.ok) alert("Reminder SMS sent!");
      else alert("Failed to send reminder.");
    } catch (e) {
      console.error(e);
      alert("Error sending reminder.");
    }
  };

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

  if (!user) return null;
  const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const initials = (n) => n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
  const avatarColors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  const statusColors = { PAID: { bg: "#f0fdf4", color: "#16a34a" }, PENDING: { bg: "#fefce8", color: "#d97706" }, OVERDUE: { bg: "#fef2f2", color: "#dc2626" }, REFUNDED: { bg: "#f1f5f9", color: "#64748b" } };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box" };

  return (
    <AppShell searchPlaceholder="Search payments...">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>Payments</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", borderRadius: "10px", background: "#2563eb", color: "#fff", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          {showForm ? "Cancel" : "+ Record Payment"}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Collected", value: fmt(summary.totalCollected), icon: "💰", changeColor: "#16a34a" },
          { label: "Pending", value: fmt(summary.pendingAmount), icon: "⏳", changeColor: "#d97706" },
          { label: "Overdue", value: fmt(summary.overdueAmount), icon: "⚠️", changeColor: "#dc2626" },
          { label: "Transactions", value: payments.length, icon: "📊", changeColor: "#2563eb" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#fff", borderRadius: "14px", padding: "20px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "22px", marginBottom: "8px" }}>{stat.icon}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Record Payment</h2>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Member *</label>
              <select value={form.userId} onChange={update("userId")} style={inputStyle} required>
                <option value="">Select member</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={update("amount")} placeholder="5000" style={inputStyle} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Type</label>
              <select value={form.type} onChange={update("type")} style={inputStyle}>
                <option value="MEMBERSHIP">Membership</option>
                <option value="EVENT">Event</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Method</label>
              <select value={form.method} onChange={update("method")} style={inputStyle}>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Status</label>
              <select value={form.status} onChange={update("status")} style={inputStyle}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={update("dueDate")} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Description</label>
              <input value={form.description} onChange={update("description")} placeholder="e.g. Monthly fee October 2024" style={inputStyle} />
            </div>
            <div><button type="submit" style={{ padding: "11px 28px", borderRadius: "10px", background: "#2563eb", color: "#fff", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Save Payment</button></div>
          </form>
        </div>
      )}

      {/* Payments Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Transaction History</h2>
        </div>
        {loading ? <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading...</div> :
          payments.length === 0 ? <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No payments recorded yet</div> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["MEMBER", "AMOUNT", "TYPE", "METHOD", "STATUS", "DATE", ""].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => {
                  const sc = statusColors[p.status] || statusColors.PENDING;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: avatarColors[i % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff" }}>{initials(p.user.name)}</div>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{p.user.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: "14px", fontWeight: 700, color: p.status === "PAID" ? "#16a34a" : "#0f172a" }}>{p.status === "PAID" ? "+" : ""}{fmt(p.amount)}</td>
                      <td style={{ padding: "12px 20px", fontSize: "12px", color: "#64748b" }}>{p.type}</td>
                      <td style={{ padding: "12px 20px", fontSize: "12px", color: "#64748b" }}>{p.method || "—"}</td>
                      <td style={{ padding: "12px 20px" }}>
                        <select value={p.status} onChange={e => updateStatus(p.id, e.target.value)} style={{ background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
                          <option value="PAID">Paid</option>
                          <option value="PENDING">Pending</option>
                          <option value="OVERDUE">Overdue</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: "12px", color: "#64748b" }}>{new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td style={{ padding: "12px 20px" }}>
                        {(p.status === "PENDING" || p.status === "OVERDUE") && (
                          <button onClick={() => handleRemind(p)} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} title="Send SMS Reminder">
                            🔔 Remind
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
    </AppShell>
  );
}

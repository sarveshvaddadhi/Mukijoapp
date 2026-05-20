"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Topbar({ title, placeholder, user }) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState("");

  const displayName = user?.name || "Coach Marcus";
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header style={{
      height: "60px",
      background: "#fff",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: "16px",
      position: "sticky",
      top: 0,
      zIndex: 10,
    }}>
      {/* Search */}
      <div style={{
        flex: 1,
        maxWidth: "360px",
        position: "relative",
      }}>
        <span style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#94a3b8",
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        <input
          type="text"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder={placeholder || "Search..."}
          style={{
            width: "100%",
            padding: "8px 12px 8px 36px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            fontSize: "13px",
            color: "#0f172a",
            outline: "none",
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Bell */}
      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "6px" }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Mail */}
      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "6px" }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
        }}>
          {initials}
        </div>
        <button
          onClick={() => {
            if (typeof window !== "undefined") localStorage.removeItem("mukijo_user");
            router.push("/");
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            padding: "6px",
          }}
          title="Logout"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}

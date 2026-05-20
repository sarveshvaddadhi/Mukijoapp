"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useEffect, useState } from "react";

export default function AppShell({ children, searchPlaceholder }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mukijo_user");
      if (stored) setUser(JSON.parse(stored));
    }
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar placeholder={searchPlaceholder} user={user} />
        <main style={{ flex: 1, padding: "28px 28px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

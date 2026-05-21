"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function JoinTeamContent() {
  const router = useRouter();
  const [teamId, setTeamId] = useState(null);
  const [team, setTeam] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinRole, setJoinRole] = useState("PLAYER");
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Safely parse search params
      const params = new URLSearchParams(window.location.search);
      const id = params.get("teamId");
      if (id) {
        setTeamId(id);
        fetchTeam(id);
      } else {
        fetchDefaultTeam();
      }

      // Check user session
      const stored = localStorage.getItem("mukijo_user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setUser(u);
          // Default join role to user's role if it's PLAYER or PARENT
          if (u.role === "PLAYER" || u.role === "PARENT" || u.role === "COACH") {
            setJoinRole(u.role);
          }
        } catch (e) {
          console.error("Session parse error", e);
        }
      }
    }
  }, []);

  const fetchDefaultTeam = async () => {
    try {
      const res = await fetch("/api/teams/default");
      if (!res.ok) {
        setError("Could not load default team. Please ensure a team exists.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.team) {
        setTeamId(data.team.id);
        setTeam(data.team);
      } else {
        setError("No default team found.");
      }
    } catch {
      setError("Server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async (id) => {
    try {
      const res = await fetch(`/api/teams/${id}`);
      if (!res.ok) {
        setError("Team not found or link has expired.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setTeam(data.team);
    } catch {
      setError("Server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!user || !teamId) return;
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          role: joinRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to join team.");
        setJoining(false);
        return;
      }
      setSuccess(true);
      // Wait 1.5s and redirect based on role
      setTimeout(() => {
        if (joinRole === "PLAYER") router.push("/calendar");
        else if (joinRole === "PARENT") router.push("/settlement");
        else router.push("/dashboard");
      }, 1500);
    } catch {
      setError("Connection error. Please try again.");
      setJoining(false);
    }
  };

  const getDashboardLink = (role) => {
    if (role === "PLAYER") return "/calendar";
    if (role === "PARENT") return "/settlement";
    return "/dashboard";
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center" }}>
          <div style={spinnerStyle} />
          <p style={{ color: "#64748b", marginTop: "16px", fontSize: "14px", fontWeight: 500 }}>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>Invitation Error</h2>
          <p style={{ color: "#64748b", marginTop: "8px", fontSize: "14px", lineHeight: 1.5 }}>{error}</p>
          <Link href="/" style={primaryButtonStyle({ mt: "24px" })}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isAlreadyMember = user && team && team.members?.some(m => m.userId === user.id);

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>✅</div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>Joined Successfully!</h2>
          <p style={{ color: "#64748b", marginTop: "8px", fontSize: "14px" }}>
            You are now a member of <strong>{team.name}</strong>.
          </p>
          <p style={{ color: "#94a3b8", marginTop: "4px", fontSize: "12px" }}>Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Decorative Badge */}
        <div style={badgeStyle}>🏆</div>

        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>Join Team Invitation</h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>You have been invited to join a group on Mukijo</p>

        {/* Team Details Box */}
        <div style={teamBoxStyle}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>{team.name}</div>
          {team.division && <div style={{ fontSize: "12px", color: "#4f46e5", fontWeight: 600, marginTop: "2px" }}>{team.division}</div>}
          {team.description && <p style={{ fontSize: "13px", color: "#64748b", marginTop: "8px", lineHeight: 1.4 }}>{team.description}</p>}
          <div style={dividerStyle} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
            <span>👥 {team._count?.members || 0} Members</span>
            <span>📅 Created {new Date(team.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Interface */}
        {user ? (
          // Logged In Flow
          <div>
            {isAlreadyMember ? (
              <div>
                <p style={{ color: "#16a34a", fontSize: "14px", fontWeight: 600, marginBottom: "16px", background: "#f0fdf4", padding: "10px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", display: "inline-block" }}>
                  ✓ You are already a member of this team.
                </p>
                <Link href={getDashboardLink(user.role)} style={primaryButtonStyle()}>
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "14px", color: "#334155", marginBottom: "18px", lineHeight: 1.5 }}>
                  Logged in as <strong>{user.name}</strong> ({user.email}). Select your role to join the team:
                </p>

                {/* Role Selector */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                  {[
                    { role: "PLAYER", label: "🏃‍♂️ Player" },
                    { role: "PARENT", label: "👨‍👩‍👦 Parent" },
                  ].map(r => (
                    <div
                      key={r.role}
                      onClick={() => setJoinRole(r.role)}
                      style={{
                        padding: "12px",
                        border: joinRole === r.role ? "2.5px solid #4f46e5" : "1.5px solid #e2e8f0",
                        background: joinRole === r.role ? "#eff6ff" : "#fff",
                        borderRadius: "10px",
                        fontWeight: joinRole === r.role ? 700 : 500,
                        color: joinRole === r.role ? "#1e40af" : "#64748b",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s"
                      }}
                    >
                      {r.label}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleJoinTeam}
                  disabled={joining}
                  style={primaryButtonStyle({ disabled: joining })}
                >
                  {joining ? "Joining Team..." : "Confirm & Join Team"}
                </button>
              </div>
            )}
          </div>
        ) : (
          // Logged Out Flow
          <div>
            <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.5, marginBottom: "20px" }}>
              To join this team, you must sign in to your Mukijo account or create a new one.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link href={`/?teamId=${teamId}`} style={primaryButtonStyle()}>
                Sign In to Join
              </Link>
              <Link href={`/register?teamId=${teamId}`} style={secondaryButtonStyle}>
                Create Account to Join
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styling Constants
const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  fontFamily: "'Inter', -apple-system, sans-serif",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px"
};

const cardStyle = {
  background: "#fff",
  borderRadius: "20px",
  padding: "40px",
  width: "100%",
  maxWidth: "420px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
  border: "1px solid #e2e8f0",
  textAlign: "center",
  boxSizing: "border-box"
};

const badgeStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "16px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  margin: "0 auto 20px"
};

const teamBoxStyle = {
  background: "#f8fafc",
  border: "1.5px solid #e2e8f0",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "left",
  marginBottom: "24px"
};

const dividerStyle = {
  height: "1px",
  background: "#e2e8f0",
  margin: "14px 0"
};

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "3px solid #e2e8f0",
  borderTopColor: "#4f46e5",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
};

const primaryButtonStyle = (options = {}) => ({
  width: "100%",
  padding: "12px",
  background: options.disabled ? "#93c5fd" : "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: options.disabled ? "not-allowed" : "pointer",
  textDecoration: "none",
  display: "inline-block",
  marginTop: options.mt || "0",
  boxSizing: "border-box",
  textAlign: "center"
});

const secondaryButtonStyle = {
  width: "100%",
  padding: "12px",
  background: "#fff",
  color: "#334155",
  border: "1.5px solid #cbd5e1",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  boxSizing: "border-box",
  textAlign: "center"
};

export default function JoinTeamPage() {
  return (
    <Suspense fallback={
      <div style={containerStyle}>
        <div style={{ textAlign: "center" }}>
          <div style={spinnerStyle} />
          <p style={{ color: "#64748b", marginTop: "16px", fontSize: "14px" }}>Loading invitation...</p>
        </div>
      </div>
    }>
      <JoinTeamContent />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </Suspense>
  );
}

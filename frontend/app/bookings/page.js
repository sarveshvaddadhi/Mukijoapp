"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";

export default function BookingsPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc", color: "#64748b" }}>Loading Page...</div>}>
      <BookingsContent />
    </Suspense>
  );
}

function BookingsContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [venues, setVenues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sports, setSports] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings"); // bookings | facilities
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    venue_id: "",
    team_id: "",
    start_time: "",
    end_time: "",
    purpose: "",
  });

  // Venue CRUD Form State
  const [venueForm, setVenueForm] = useState({
    name: "",
    address: "",
    description: "",
    lat: "",
    lng: "",
    sports: [],
  });

  // Venue Edit State
  const [editingVenueId, setEditingVenueId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    description: "",
    lat: "",
    lng: "",
    sports: [],
  });

  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (!data) {
      router.replace("/");
      return;
    }
    const u = JSON.parse(data);
    setUser(u);
    loadInitialData(u.id);
  }, [router]);

  async function loadInitialData(userId) {
    setLoading(true);
    setError("");
    try {
      const [venueRes, teamRes, bookingRes, sportRes] = await Promise.all([
        fetch("/api/venues"),
        fetch(`/api/teams?userId=${userId}`),
        fetch("/api/venues/bookings"),
        fetch("/api/sports")
      ]);

      if (venueRes.ok && teamRes.ok && bookingRes.ok && sportRes.ok) {
        const venueData = await venueRes.json();
        const teamData = await teamRes.json();
        const bookingData = await bookingRes.json();
        const sportData = await sportRes.json();

        setVenues(venueData || []);
        setTeams(teamData.teams || []);
        setBookings(bookingData || []);
        setSports(sportData || []);
      } else {
        setError("Failed to fetch initial data from backend.");
      }
    } catch (e) {
      console.error(e);
      setError("Server connection error.");
    } finally {
      setLoading(false);
    }
  }

  // --- BOOKING OPERATIONS ---

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!bookingForm.venue_id || !bookingForm.team_id || !bookingForm.start_time || !bookingForm.end_time) {
      setError("Please fill in all required fields.");
      return;
    }

    const start = new Date(bookingForm.start_time);
    const end = new Date(bookingForm.end_time);

    if (start >= end) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/venues/bookings?userId={user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: parseInt(bookingForm.venue_id),
          team_id: parseInt(bookingForm.team_id),
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          purpose: bookingForm.purpose || null,
        }),
        params: { userId: user.id }
      });

      // Append userId parameter manually since NextJS rewrites might strip params
      const fixedUrl = `/api/venues/bookings?userId=${user.id}`;
      const actualRes = await fetch(fixedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: parseInt(bookingForm.venue_id),
          team_id: parseInt(bookingForm.team_id),
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          purpose: bookingForm.purpose || null,
        })
      });

      const data = await actualRes.json();
      if (actualRes.ok) {
        setSuccess("Venue booked successfully!");
        setBookingForm({
          venue_id: "",
          team_id: "",
          start_time: "",
          end_time: "",
          purpose: "",
        });
        // Reload bookings list
        const bookingsRes = await fetch("/api/venues/bookings");
        if (bookingsRes.ok) {
          const bookingData = await bookingsRes.json();
          setBookings(bookingData || []);
        }
      } else {
        setError(data.detail || data.message || "Failed to create booking.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to reach server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this venue booking?")) return;

    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/venues/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Booking cancelled successfully.");
        setBookings(prev => prev.filter(b => b.id !== bookingId));
      } else {
        const data = await res.json();
        setError(data.detail || data.message || "Failed to cancel booking.");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection error.");
    }
  };

  // --- VENUE CRUD OPERATIONS ---

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!venueForm.name || !venueForm.address) {
      setError("Venue Name and Address are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/venues?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: venueForm.name,
          address: venueForm.address,
          description: venueForm.description || null,
          lat: venueForm.lat ? parseFloat(venueForm.lat) : null,
          lng: venueForm.lng ? parseFloat(venueForm.lng) : null,
          sports: venueForm.sports
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Venue "${data.name}" added successfully!`);
        setVenueForm({
          name: "",
          address: "",
          description: "",
          lat: "",
          lng: "",
          sports: []
        });
        // Refresh venues list
        const venueRes = await fetch("/api/venues");
        if (venueRes.ok) {
          const venueData = await venueRes.json();
          setVenues(venueData || []);
        }
      } else {
        setError(data.detail || data.message || "Failed to create venue.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error adding venue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEditVenue = (venue) => {
    setEditingVenueId(venue.id);
    setEditForm({
      name: venue.name,
      address: venue.address,
      description: venue.description || "",
      lat: venue.lat !== null ? String(venue.lat) : "",
      lng: venue.lng !== null ? String(venue.lng) : "",
      sports: venue.sports ? venue.sports.map(s => s.sport_id) : []
    });
  };

  const handleSaveVenueEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editForm.name || !editForm.address) {
      setError("Name and Address are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/venues/${editingVenueId}?userId=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          address: editForm.address,
          description: editForm.description || null,
          lat: editForm.lat ? parseFloat(editForm.lat) : null,
          lng: editForm.lng ? parseFloat(editForm.lng) : null,
          sports: editForm.sports
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Venue details updated!");
        setEditingVenueId(null);
        // Refresh venues
        const venueRes = await fetch("/api/venues");
        if (venueRes.ok) {
          const venueData = await venueRes.json();
          setVenues(venueData || []);
        }
      } else {
        setError(data.detail || data.message || "Failed to update venue.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error updating venue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (!confirm("Are you sure you want to delete this venue? All associated bookings will be cancelled/removed.")) return;

    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/venues/${venueId}?userId=${user.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSuccess("Venue deleted successfully.");
        setVenues(prev => prev.filter(v => v.id !== venueId));
        // Reload bookings too since they are cascade deleted
        const bookingsRes = await fetch("/api/venues/bookings");
        if (bookingsRes.ok) {
          const bookingData = await bookingsRes.json();
          setBookings(bookingData || []);
        }
      } else {
        const data = await res.json();
        setError(data.detail || data.message || "Failed to delete venue.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error deleting venue.");
    }
  };

  // Helper selectors
  const toggleSportInList = (sportId, formType) => {
    if (formType === "create") {
      setVenueForm(prev => {
        const alreadyIn = prev.sports.includes(sportId);
        const sports = alreadyIn
          ? prev.sports.filter(id => id !== sportId)
          : [...prev.sports, sportId];
        return { ...prev, sports };
      });
    } else {
      setEditForm(prev => {
        const alreadyIn = prev.sports.includes(sportId);
        const sports = alreadyIn
          ? prev.sports.filter(id => id !== sportId)
          : [...prev.sports, sportId];
        return { ...prev, sports };
      });
    }
  };

  const updateBookingField = (field) => (e) => {
    setBookingForm(prev => ({ ...prev, [field]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const updateVenueField = (field) => (e) => {
    setVenueForm(prev => ({ ...prev, [field]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const updateEditField = (field) => (e) => {
    setEditForm(prev => ({ ...prev, [field]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const isOrganizer = user && (user.role === "COACH" || user.role === "ADMIN");

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1.5px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <MobileShell title="Venue & Bookings">
      <div style={{ paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: T.sub }}>Create and manage sports facilities, coordinate schedules, and prevent booking overlaps.</p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: 0, background: T.card, borderRadius: 12, padding: 4, boxShadow: T.shadow, marginBottom: 16 }}>
          <button
            onClick={() => { setActiveTab("bookings"); setError(""); setSuccess(""); }}
            style={{
              flex: 1, padding: "9px", borderRadius: 9, border: "none",
              background: activeTab === "bookings" ? T.primary : "transparent",
              color: activeTab === "bookings" ? "#fff" : T.sub,
              fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
              cursor: "pointer",
              transition: "all 0.2s",
              outline: "none",
            }}
          >
            🗓️ Bookings & Schedule
          </button>
          {isOrganizer && (
            <button
              onClick={() => { setActiveTab("facilities"); setError(""); setSuccess(""); }}
              style={{
                padding: "12px 16px",
                background: "none",
                border: "none",
                borderBottom: activeTab === "facilities" ? "3px solid #4f46e5" : "3px solid transparent",
                color: activeTab === "facilities" ? "#4f46e5" : "#64748b",
                fontWeight: activeTab === "facilities" ? 700 : 500,
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s",
                outline: "none",
              }}
            >
              ⚙️ Manage Facilities
            </button>
          )}
        </div>

        {/* Notifications */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "14px 18px", color: "#dc2626", fontSize: "14px", fontWeight: 500, marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px 18px", color: "#16a34a", fontSize: "14px", fontWeight: 500, marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>✅</span> {success}
          </div>
        )}

        {/* TAB 1: BOOKINGS & SCHEDULE */}
        {activeTab === "bookings" && (
          <div style={{ display: "grid", gridTemplateColumns: isOrganizer ? "1fr 1.5fr" : "1fr", gap: "28px", alignItems: "start" }}>
            
            {/* Booking Form (Coaches & Admins Only) */}
            {isOrganizer && (
              <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginBottom: "20px" }}>Book a Facility</h2>
                <form onSubmit={handleCreateBooking} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Select Venue *
                    </label>
                    <select value={bookingForm.venue_id} onChange={updateBookingField("venue_id")} style={inputStyle} required>
                      <option value="">Choose a venue</option>
                      {venues.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.address})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Select Team *
                    </label>
                    <select value={bookingForm.team_id} onChange={updateBookingField("team_id")} style={inputStyle} required>
                      <option value="">Choose a team</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Start Date & Time *
                      </label>
                      <input type="datetime-local" value={bookingForm.start_time} onChange={updateBookingField("start_time")} style={inputStyle} required />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        End Date & Time *
                      </label>
                      <input type="datetime-local" value={bookingForm.end_time} onChange={updateBookingField("end_time")} style={inputStyle} required />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Purpose / Activity
                    </label>
                    <input type="text" value={bookingForm.purpose} onChange={updateBookingField("purpose")} placeholder="e.g. League Match, Friendly" style={inputStyle} />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: "100%",
                      padding: "13px",
                      background: "#4f46e5",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: submitting ? "not-allowed" : "pointer",
                      transition: "background 0.2s",
                      marginTop: "10px",
                    }}
                  >
                    {submitting ? "Processing..." : "Confirm Venue Booking"}
                  </button>
                </form>
              </div>
            )}

            {/* Coordinated Schedule List */}
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Coordinated Schedule</h2>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "4px 10px", borderRadius: "99px" }}>
                  {bookings.length} reservations
                </span>
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "250px", color: "#94a3b8" }}>
                  <div style={{ width: "24px", height: "24px", border: "3px solid #cbd5e1", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "12px" }} />
                  Loading bookings...
                </div>
              ) : bookings.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "250px", color: "#94a3b8", textAlign: "center" }}>
                  <span style={{ fontSize: "36px", marginBottom: "8px" }}>🏟️</span>
                  <p style={{ fontWeight: 600 }}>No venue bookings scheduled</p>
                  <p style={{ fontSize: "13px", color: "#64748b" }}>Select a facility to book your team slot.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {bookings.map(b => {
                    const start = new Date(b.start_time);
                    const end = new Date(b.end_time);
                    return (
                      <div key={b.id} style={{ padding: "16px 20px", borderRadius: "12px", border: "1px solid #f1f5f9", background: "#fafaf9", borderLeft: "4px solid #4f46e5" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{b.venue_name}</span>
                              <span style={{ background: "#e0e7ff", color: "#4f46e5", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px" }}>
                                {b.team_name}
                              </span>
                            </div>
                            
                            <div style={{ fontSize: "12px", color: "#64748b", display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span>📅 {start.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                              <span>⏰ {start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} - {end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                              {b.purpose && <span style={{ color: "#475569", fontWeight: 500, fontStyle: "italic", marginTop: "4px" }}>&ldquo;{b.purpose}&rdquo;</span>}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>Booked by {b.booker_name}</div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                            <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px" }}>✓ Confirmed</span>
                            {isOrganizer && (
                              <button onClick={() => handleCancelBooking(b.id)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: "4px" }}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE FACILITIES (CRUD) */}
        {activeTab === "facilities" && isOrganizer && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "28px", alignItems: "start" }}>
            
            {/* Add Facility Form */}
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginBottom: "20px" }}>Add New Facility</h2>
              <form onSubmit={handleCreateVenue} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Facility Name *</label>
                  <input type="text" value={venueForm.name} onChange={updateVenueField("name")} placeholder="e.g. Sports Arena Noida" style={inputStyle} required />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Street Address *</label>
                  <input type="text" value={venueForm.address} onChange={updateVenueField("address")} placeholder="e.g. Plot 4, Sector 62, Noida" style={inputStyle} required />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Description</label>
                  <textarea value={venueForm.description} onChange={updateVenueField("description")} placeholder="Available courts, configurations, etc..." style={{ ...inputStyle, fontFamily: "inherit" }} rows={2} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Latitude (Optional)</label>
                    <input type="number" step="any" value={venueForm.lat} onChange={updateVenueField("lat")} placeholder="e.g. 28.6139" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Longitude (Optional)</label>
                    <input type="number" step="any" value={venueForm.lng} onChange={updateVenueField("lng")} placeholder="e.g. 77.2090" style={inputStyle} />
                  </div>
                </div>

                {/* Sports Picker */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>Associated Sports</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {sports.map(s => {
                      const selected = venueForm.sports.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSportInList(s.id, "create")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            border: `1.5px solid ${selected ? s.accent_color || "#3b82f6" : "#cbd5e1"}`,
                            background: selected ? (s.accent_color || "#3b82f6") + "15" : "#fff",
                            color: selected ? s.accent_color || "#3b82f6" : "#64748b",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          {selected ? "✓ " : ""}{s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "13px",
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: submitting ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                    marginTop: "10px"
                  }}
                >
                  {submitting ? "Adding..." : "Add Facility"}
                </button>
              </form>
            </div>

            {/* Facilities List & Edit Modals */}
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginBottom: "20px" }}>Facility Listing</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {venues.map(v => {
                  const isEditing = editingVenueId === v.id;
                  return (
                    <div key={v.id} style={{ padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", background: isEditing ? "#f8fafc" : "#fff" }}>
                      
                      {isEditing ? (
                        /* INLINE EDIT FORM */
                        <form onSubmit={handleSaveVenueEdit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#4f46e5" }}>Edit Facility Details</h3>
                          
                          <div>
                            <input type="text" value={editForm.name} onChange={updateEditField("name")} placeholder="Facility Name" style={inputStyle} required />
                          </div>
                          <div>
                            <input type="text" value={editForm.address} onChange={updateEditField("address")} placeholder="Street Address" style={inputStyle} required />
                          </div>
                          <div>
                            <textarea value={editForm.description} onChange={updateEditField("description")} placeholder="Description" style={{ ...inputStyle, fontFamily: "inherit" }} rows={2} />
                          </div>
                          
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <input type="number" step="any" value={editForm.lat} onChange={updateEditField("lat")} placeholder="Latitude" style={inputStyle} />
                            <input type="number" step="any" value={editForm.lng} onChange={updateEditField("lng")} placeholder="Longitude" style={inputStyle} />
                          </div>

                          {/* Sports Picker */}
                          <div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: 600 }}>Associated Sports:</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {sports.map(s => {
                                const selected = editForm.sports.includes(s.id);
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => toggleSportInList(s.id, "edit")}
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: "15px",
                                      border: `1px solid ${selected ? s.accent_color || "#3b82f6" : "#cbd5e1"}`,
                                      background: selected ? (s.accent_color || "#3b82f6") + "10" : "#fff",
                                      color: selected ? s.accent_color || "#3b82f6" : "#64748b",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      cursor: "pointer"
                                    }}
                                  >
                                    {s.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                            <button
                              type="submit"
                              disabled={submitting}
                              style={{ flex: 1, padding: "10px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                            >
                              Save Details
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingVenueId(null)}
                              style={{ padding: "10px 16px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* STANDARD VIEW */
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                          <div>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>{v.name}</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 6px" }}>📍 {v.address}</p>
                            {v.description && <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 10px", fontStyle: "italic" }}>&ldquo;{v.description}&rdquo;</p>}
                            
                            {/* Display linked sports */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                              {v.sports && v.sports.map(vs => (
                                <span key={vs.sport_id} style={{ background: "#f1f5f9", color: "#475569", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px" }}>
                                  {vs.sport?.name || vs.sport_id}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <button
                              onClick={() => handleStartEditVenue(v)}
                              style={{
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                color: "#1d4ed8",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s"
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                              onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteVenue(v.id)}
                              style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#dc2626",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s"
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                              onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                      
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </MobileShell>
  );
}

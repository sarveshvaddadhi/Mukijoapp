"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileShell, { T } from "@/components/MobileShell";


export default function VenueDashboardPage() {
  const router = useRouter();
  
  // Navigation states
  const [activeMenu, setActiveMenu] = useState("dashboard"); // dashboard | facilities | bookings | revenue | settings
  const [user, setUser] = useState(null);
  
  // Data states
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // Loading states
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Booking Modal overlay state
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    court: "Court 01",
    teamId: "",
    date: new Date().toISOString().split("T")[0],
    slot: "08:00",
    purpose: "Practice Session"
  });

  // App Theme Constants
  const pageBg = "#0B1421"; // Deep dark navy-black
  const cardBg = "#0F1E33"; // Slate blue cards
  const textWhite = "#F8FAFC";
  const textGray = "#94A3B8";
  const accentGold = "#FFD700";
  const accentBlue = "#2563EB";
  const borderColor = "#1E293B";

  // 1. Initial Load: Authenticated User, Venues and Teams
  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (data) {
      setUser(JSON.parse(data));
    }
    
    // Fetch all venues
    const loadInitialData = async () => {
      try {
        const venuesRes = await fetch("/api/venues");
        if (venuesRes.ok) {
          const venuesData = await venuesRes.json();
          setVenues(venuesData || []);
          if (venuesData && venuesData.length > 0) {
            setSelectedVenueId(venuesData[0].id);
          }
        }
        
        const teamsRes = await fetch("/api/teams");
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.teams || []);
          if (teamsData.teams && teamsData.teams.length > 0) {
            setBookingForm(prev => ({ ...prev, teamId: teamsData.teams[0].id }));
          }
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
        toast.error("Failed to load venues and squads list.");
      } finally {
        setLoadingVenues(false);
      }
    };

    loadInitialData();
  }, []);

  // 2. Load Bookings whenever selected venue changes
  useEffect(() => {
    if (selectedVenueId) {
      loadBookings(selectedVenueId);
    }
  }, [selectedVenueId]);

  const loadBookings = async (venueId) => {
    setLoadingBookings(true);
    try {
      const res = await fetch(`/api/venues/bookings?venue_id=${venueId}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data || []);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
      toast.error("Failed to sync bookings list.");
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleVenueChange = (venueId) => {
    setSelectedVenueId(venueId);
    toast.success(`Switched venue view`);
  };

  const handleLogout = () => {
    toast.success("Logging out...");
    setTimeout(() => {
      localStorage.removeItem("mukijo_user");
      router.push("/");
    }, 1000);
  };

  // 3. Create a Booking in the database
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedVenueId) {
      toast.error("No venue selected.");
      return;
    }
    if (!bookingForm.teamId) {
      toast.error("Please select a team/squad.");
      return;
    }

    setSubmittingBooking(true);
    try {
      // Calculate start_time and end_time ISO strings
      const startHour = bookingForm.slot.split(":")[0];
      const startMinutes = bookingForm.slot.split(":")[1];
      const start_time = new Date(`${bookingForm.date}T${startHour}:${startMinutes}:00`).toISOString();
      
      const endHour = String(Number(startHour) + 2).padStart(2, '0');
      const end_time = new Date(`${bookingForm.date}T${endHour}:${startMinutes}:00`).toISOString();

      // Encode Court name in purpose field (e.g. "Court 01 - Practice Match")
      const encodedPurpose = `${bookingForm.court} - ${bookingForm.purpose}`;

      const bookerId = user ? user.id : 1; // Fallback to 1

      const res = await fetch(`/api/venues/bookings?userId=${bookerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: selectedVenueId,
          team_id: Number(bookingForm.teamId),
          start_time,
          end_time,
          purpose: encodedPurpose
        })
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.detail || "Booking failed.");
      } else {
        toast.success("Booking created successfully!");
        setShowAddBooking(false);
        loadBookings(selectedVenueId); // Refresh list
      }
    } catch (err) {
      console.error(err);
      toast.error("Conflict or Network Error: slot already allocated.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  // 4. Booking Slot matching helper for Timetable
  const getBookingForSlot = (courtName, slotTime) => {
    return bookings.find(b => {
      const bTime = new Date(b.start_time);
      const bHour = String(bTime.getHours()).padStart(2, '0') + ":00";
      
      let bookingCourt = "Court 01"; // Default
      let bookingPurpose = b.purpose || "";
      if (b.purpose && b.purpose.includes(" - ")) {
        bookingCourt = b.purpose.split(" - ")[0];
      }

      return bookingCourt === courtName && bHour === slotTime;
    });
  };

  // 5. Dynamic Stats Calculation
  const activeVenue = venues.find(v => v.id === selectedVenueId);
  const totalBookings = bookings.length;
  // Calculate Occupancy % (Based on 3 courts, 7 slots today = 21 possible bookings)
  const occupancyPct = Math.min(Math.round((totalBookings / 21) * 100), 100);
  const revenueTotal = totalBookings * 1500;
  // Status of active courts
  const activeCourtsInUse = Math.min(new Set(bookings.map(b => b.purpose?.split(" - ")[0])).size, 3);

  // Time Slots definitions
  const timeSlots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

  return (
    <MobileShell title="Venue Booking" noScroll>

      {/* Venue selector */}
      {!loadingVenues && venues.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "10px 14px", background: T.card, borderRadius: 12, boxShadow: T.shadow }}>
          <span style={{ fontSize: 12, color: T.sub }}>Active Venue:</span>
          <select value={selectedVenueId || ""} onChange={e => handleVenueChange(Number(e.target.value))}
            style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 13, fontWeight: 700, background: "#fff", color: T.text }}>
            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      )}
      {/* SCROLLABLE MAIN APP CONTENT AREA */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 80px", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeMenu === "dashboard" && (
            <>
              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                
                {/* Stats 1: Occupancy */}
                <div style={{ background: cardBg, padding: "16px", borderRadius: "12px", border: `1px solid ${borderColor}` }}>
                  <span style={{ fontSize: "10px", color: textGray, fontWeight: 700, textTransform: "uppercase" }}>Occupancy</span>
                  <div style={{ fontSize: "28px", fontWeight: 900, marginTop: "8px", color: textWhite }}>{occupancyPct}%</div>
                  <span style={{ fontSize: "10px", color: "#10B981", fontWeight: 600, display: "block", marginTop: "4px" }}>Active Allocation</span>
                </div>

                {/* Stats 2: Revenue */}
                <div style={{ background: cardBg, padding: "16px", borderRadius: "12px", border: `1px solid ${accentBlue}` }}>
                  <span style={{ fontSize: "10px", color: textGray, fontWeight: 700, textTransform: "uppercase" }}>Revenue</span>
                  <div style={{ fontSize: "28px", fontWeight: 900, marginTop: "8px", color: accentBlue }}>₹{revenueTotal.toLocaleString()}</div>
                  <span style={{ fontSize: "10px", color: textGray, fontWeight: 500, display: "block", marginTop: "4px" }}>₹1,500/slot rate</span>
                </div>

                {/* Stats 3: Total Bookings */}
                <div style={{ background: cardBg, padding: "16px", borderRadius: "12px", border: `1px solid ${borderColor}` }}>
                  <span style={{ fontSize: "10px", color: textGray, fontWeight: 700, textTransform: "uppercase" }}>Bookings</span>
                  <div style={{ fontSize: "28px", fontWeight: 900, marginTop: "8px", color: textWhite }}>{totalBookings}</div>
                  <span style={{ fontSize: "10px", color: textGray, fontWeight: 500, display: "block", marginTop: "4px" }}>Confirmed slots</span>
                </div>

                {/* Stats 4: Courts Active */}
                <div style={{ background: cardBg, padding: "16px", borderRadius: "12px", border: `1px solid ${accentGold}` }}>
                  <span style={{ fontSize: "10px", color: textGray, fontWeight: 700, textTransform: "uppercase" }}>Courts Active</span>
                  <div style={{ fontSize: "28px", fontWeight: 900, marginTop: "8px", color: accentGold }}>{activeCourtsInUse}/3</div>
                  <span style={{ fontSize: "10px", color: textGray, fontWeight: 600, display: "block", marginTop: "4px" }}>Courts in use</span>
                </div>

              </div>

              {/* Timetable Slot Management */}
              <div style={{ background: cardBg, borderRadius: "16px", border: `1px solid ${borderColor}`, padding: "16px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: textWhite, marginBottom: "2px" }}>Real-time Slot Allocation</h3>
                <p style={{ fontSize: "11px", color: textGray, marginBottom: "16px" }}>Interactive court allocation schedules.</p>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "8px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}></th>
                        <th style={{ fontSize: "10px", fontWeight: 700, color: textGray, textTransform: "uppercase", textAlign: "center" }}>Court 1</th>
                        <th style={{ fontSize: "10px", fontWeight: 700, color: textGray, textTransform: "uppercase", textAlign: "center" }}>Court 2</th>
                        <th style={{ fontSize: "10px", fontWeight: 700, color: textGray, textTransform: "uppercase", textAlign: "center" }}>Court 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map(slot => {
                        const court1Booking = getBookingForSlot("Court 01", slot);
                        const court2Booking = getBookingForSlot("Court 02", slot);
                        const court3Booking = getBookingForSlot("Court 03", slot);

                        return (
                          <tr key={slot}>
                            <td style={{ fontSize: "11px", fontWeight: 700, color: textGray, verticalAlign: "middle" }}>{slot}</td>
                            
                            {/* Court 1 Cell */}
                            <td style={court1Booking ? { background: accentBlue, color: "#fff", borderRadius: "8px", padding: "10px 6px", textAlign: "center", fontSize: "11px" } : { border: `1px dashed ${borderColor}`, borderRadius: "8px", padding: "10px 6px", textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: "11px" }}>
                              {court1Booking ? (
                                <strong>{court1Booking.team_name || "Booked"}</strong>
                              ) : "Empty"}
                            </td>

                            {/* Court 2 Cell */}
                            <td style={court2Booking ? { background: accentGold, color: "#000", borderRadius: "8px", padding: "10px 6px", textAlign: "center", fontSize: "11px" } : { border: `1px dashed ${borderColor}`, borderRadius: "8px", padding: "10px 6px", textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: "11px" }}>
                              {court2Booking ? (
                                <strong>{court2Booking.team_name || "Booked"}</strong>
                              ) : "Empty"}
                            </td>

                            {/* Court 3 Cell */}
                            <td style={court3Booking ? { background: "#10B981", color: "#fff", borderRadius: "8px", padding: "10px 6px", textAlign: "center", fontSize: "11px" } : { border: `1px dashed ${borderColor}`, borderRadius: "8px", padding: "10px 6px", textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: "11px" }}>
                              {court3Booking ? (
                                <strong>{court3Booking.team_name || "Booked"}</strong>
                              ) : "Empty"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upcoming Bookings Table */}
              <div style={{ background: cardBg, borderRadius: "16px", border: `1px solid ${borderColor}`, padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: textWhite, margin: 0 }}>Upcoming Bookings</h3>
                  <span style={{ color: accentGold, fontSize: "11px", fontWeight: 700, cursor: "pointer" }} onClick={() => setActiveMenu("bookings")}>View Logs</span>
                </div>

                {loadingBookings ? (
                  <p style={{ color: textGray, fontSize: "12px", textAlign: "center" }}>Updating bookings data...</p>
                ) : bookings.length === 0 ? (
                  <p style={{ color: textGray, fontSize: "12px", textAlign: "center", padding: "10px 0" }}>No active bookings for this venue.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {bookings.slice(0, 3).map((booking, idx) => {
                      const courtLabel = booking.purpose?.split(" - ")[0] || "Court 01";
                      const purposeLabel = booking.purpose?.split(" - ")[1] || "Training Session";
                      const dateObj = new Date(booking.start_time);
                      const displayTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                      return (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${borderColor}`, paddingBottom: "10px" }}>
                          <div>
                            <strong style={{ fontSize: "12px", color: textWhite, display: "block" }}>{booking.team_name || "Squad Alpha"}</strong>
                            <span style={{ fontSize: "10px", color: textGray }}>{courtLabel} • {purposeLabel}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "11px", color: accentGold, fontWeight: 700, display: "block" }}>{displayTime}</span>
                            <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontSize: "9px", padding: "2px 6px", borderRadius: "8px", fontWeight: 700, textTransform: "uppercase" }}>{booking.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: FACILITIES VIEW */}
          {activeMenu === "facilities" && (
            <div style={{ background: cardBg, borderRadius: "16px", border: `1px solid ${borderColor}`, padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: textWhite }}>Court Facilities</h3>
              <p style={{ fontSize: "12px", color: textGray }}>Details of active courts and amenities at {activeVenue?.name || "Venue"}.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {["Court 01", "Court 02", "Court 03"].map((court, idx) => (
                  <div key={idx} style={{ border: `1px solid ${borderColor}`, padding: "14px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ color: textWhite, fontSize: "14px", display: "block" }}>{court}</strong>
                      <span style={{ color: textGray, fontSize: "11px" }}>Premium synthetic courts with lighting</span>
                    </div>
                    <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontSize: "10px", fontWeight: 700, padding: "4px 8px", borderRadius: "20px" }}>ONLINE</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BOOKINGS VIEW */}
          {activeMenu === "bookings" && (
            <div style={{ background: cardBg, borderRadius: "16px", border: `1px solid ${borderColor}`, padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: textWhite, marginBottom: "14px" }}>Venue Booking Logs</h3>
              
              {bookings.length === 0 ? (
                <p style={{ color: textGray, fontSize: "12px", textAlign: "center" }}>No bookings available.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {bookings.map((booking, idx) => {
                    const courtLabel = booking.purpose?.split(" - ")[0] || "Court 01";
                    const purposeLabel = booking.purpose?.split(" - ")[1] || "Practice Session";
                    const dateObj = new Date(booking.start_time);
                    const dateFormatted = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                    const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={idx} style={{ border: `1px solid ${borderColor}`, borderRadius: "10px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ color: textWhite, fontSize: "13px" }}>{booking.team_name}</strong>
                          <span style={{ color: textGray, fontSize: "11px", display: "block", marginTop: "2px" }}>{courtLabel} • {purposeLabel}</span>
                          <span style={{ color: textGray, fontSize: "10px", display: "block", marginTop: "4px" }}>Booked by: {booking.booker_name || "Manager"}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ color: accentGold, fontSize: "12px", fontWeight: 700, display: "block" }}>{timeFormatted}</span>
                          <span style={{ color: textWhite, fontSize: "10px", display: "block", marginTop: "2px" }}>{dateFormatted}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REVENUE VIEW */}
          {activeMenu === "revenue" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: cardBg, borderRadius: "16px", border: `1px solid ${borderColor}`, padding: "20px", textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: textGray, fontWeight: 700, textTransform: "uppercase" }}>Total Collected Revenue</span>
                <div style={{ fontSize: "36px", fontWeight: 900, color: accentBlue, marginTop: "10px" }}>₹{revenueTotal.toLocaleString()}</div>
                <p style={{ color: textGray, fontSize: "12px", marginTop: "8px" }}>Calculated dynamically based on real database bookings.</p>
              </div>

              <div style={{ background: cardBg, borderRadius: "16px", border: `1px solid ${borderColor}`, padding: "20px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 800, color: textWhite, marginBottom: "14px" }}>Transaction History</h4>
                {bookings.length === 0 ? (
                  <p style={{ color: textGray, fontSize: "12px", textAlign: "center" }}>No billing history available.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {bookings.map((booking, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${borderColor}`, paddingBottom: "10px" }}>
                        <div>
                          <strong style={{ fontSize: "12px", color: textWhite }}>{booking.team_name}</strong>
                          <span style={{ fontSize: "10px", color: textGray, display: "block" }}>Payment method: Razorpay / Cash</span>
                        </div>
                        <span style={{ fontSize: "13px", color: "#10B981", fontWeight: 700 }}>+₹1,500</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS VIEW */}
          {activeMenu === "settings" && (
            <div style={{ background: cardBg, borderRadius: "16px", border: `1px solid ${borderColor}`, padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: textWhite }}>Settings & Profile</h3>
                <p style={{ fontSize: "11px", color: textGray }}>Manage your partner portal configuration.</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: `1px solid ${borderColor}`, paddingBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: accentGold, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px" }}>
                  M
                </div>
                <div>
                  <strong style={{ color: textWhite, fontSize: "14px", display: "block" }}>{user ? user.name : "Manager Account"}</strong>
                  <span style={{ color: textGray, fontSize: "12px" }}>{user ? user.email : "manager@mukijo.com"}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button onClick={() => router.push("/discovery")} style={{ width: "100%", padding: "12px", background: "transparent", border: `1px solid ${accentGold}`, color: accentGold, borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  🔄 Switch to Player View
                </button>
                <button onClick={handleLogout} style={{ width: "100%", padding: "12px", background: "#7F1D1D", border: "none", color: "#fff", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  🚪 Logout Account
                </button>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM FIXED APP NAVIGATION BAR */}
        <nav style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "#080F1A",
          borderTop: `1px solid ${borderColor}`,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 10,
          padding: "0 10px"
        }}>
          {[
            { id: "dashboard", label: "Dashboard", icon: "🔳" },
            { id: "facilities", label: "Facilities", icon: "🏢" },
            { id: "bookings", label: "Bookings", icon: "📅" },
            { id: "revenue", label: "Revenue", icon: "💳" },
            { id: "settings", label: "Settings", icon: "⚙️" }
          ].map(item => {
            const active = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  color: active ? accentGold : textGray,
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: active ? 700 : 500,
                  transition: "all 0.15s",
                  padding: "6px"
                }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* FLOATING ACTION BUTTON FOR CREATING BOOKINGS */}
        {activeMenu === "dashboard" && selectedVenueId && (
          <div
            onClick={() => setShowAddBooking(true)}
            style={{
              position: "absolute",
              bottom: "80px",
              right: "20px",
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: accentGold,
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
              zIndex: 9,
              transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1.00)"}
          >
            +
          </div>
        )}

        {/* CREATE BOOKING MODAL DRAWER OVERLAY */}
        {showAddBooking && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 100,
          }}>
            <div style={{
              width: "100%",
              background: cardBg,
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              borderTop: `1px solid ${borderColor}`,
              padding: "24px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              animation: "slideUp 0.3s ease"
            }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: textWhite, margin: 0 }}>Create Booking</h3>
                <span 
                  onClick={() => setShowAddBooking(false)}
                  style={{ fontSize: "20px", cursor: "pointer", color: textGray }}
                >
                  ✕
                </span>
              </div>

              <form onSubmit={handleCreateBooking} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                
                {/* Court selection */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: textGray, marginBottom: "6px", textTransform: "uppercase" }}>Select Court</label>
                  <select
                    value={bookingForm.court}
                    onChange={e => setBookingForm({ ...bookingForm, court: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: pageBg, border: `1px solid ${borderColor}`, borderRadius: "8px", color: textWhite, fontSize: "13px", outline: "none" }}
                  >
                    <option value="Court 01">Court 01</option>
                    <option value="Court 02">Court 02</option>
                    <option value="Court 03">Court 03</option>
                  </select>
                </div>

                {/* Team selection */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: textGray, marginBottom: "6px", textTransform: "uppercase" }}>Select Team / Squad</label>
                  <select
                    value={bookingForm.teamId}
                    onChange={e => setBookingForm({ ...bookingForm, teamId: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: pageBg, border: `1px solid ${borderColor}`, borderRadius: "8px", color: textWhite, fontSize: "13px", outline: "none" }}
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date selection */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: textGray, marginBottom: "6px", textTransform: "uppercase" }}>Date</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: pageBg, border: `1px solid ${borderColor}`, borderRadius: "8px", color: textWhite, fontSize: "13px", outline: "none", colorScheme: "dark" }}
                  />
                </div>

                {/* Time slot selection */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: textGray, marginBottom: "6px", textTransform: "uppercase" }}>Time Slot (2 Hours)</label>
                  <select
                    value={bookingForm.slot}
                    onChange={e => setBookingForm({ ...bookingForm, slot: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: pageBg, border: `1px solid ${borderColor}`, borderRadius: "8px", color: textWhite, fontSize: "13px", outline: "none" }}
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot} — {String(Number(slot.split(":")[0]) + 2).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>

                {/* Purpose text */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: textGray, marginBottom: "6px", textTransform: "uppercase" }}>Booking Purpose</label>
                  <input
                    type="text"
                    value={bookingForm.purpose}
                    onChange={e => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: pageBg, border: `1px solid ${borderColor}`, borderRadius: "8px", color: textWhite, fontSize: "13px", outline: "none" }}
                    placeholder="Practice, Tournament, Training..."
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submittingBooking}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginTop: "10px",
                    background: accentGold,
                    color: "#000",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 800,
                    cursor: submittingBooking ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {submittingBooking ? "CREATING BOOKING..." : "CONFIRM BOOKING (₹1,500)"}
                </button>

              </form>

            </div>
          </div>
        )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </MobileShell>
  );
}

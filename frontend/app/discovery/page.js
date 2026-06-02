"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import MobileShell, { T } from "@/components/MobileShell";

export default function DiscoveryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Geolocation states
  const [coords, setCoords] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [askingLocation, setAskingLocation] = useState(true);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [selectedCity, setSelectedCity] = useState("delhi");
  
  // DB data states
  const [sports, setSports] = useState([]);
  const [venues, setVenues] = useState([]);
  const [squads, setSquads] = useState([]);
  
  // Interaction/Filter states
  const [selectedSport, setSelectedSport] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Authenticate user on mount
  useEffect(() => {
    const data = localStorage.getItem("mukijo_user");
    if (data) {
      setUser(JSON.parse(data));
    }
  }, []);

  const citiesConfig = {
    delhi: { lat: 28.5522, lng: 77.2198, label: "New Delhi" },
    mumbai: { lat: 19.0596, lng: 72.8727, label: "Mumbai" },
    bangalore: { lat: 12.9698, lng: 77.5978, label: "Bangalore" },
  };

  const handleUseManualLocation = (cityKey) => {
    setLoading(true);
    const city = citiesConfig[cityKey || selectedCity];
    setCoords({ lat: city.lat, lng: city.lng });
    setLocationLabel(city.label);
    setAskingLocation(false);
    fetchData(city.lat, city.lng);
  };

  // Request HTML5 Geolocation coords
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      handleUseManualLocation("delhi");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(userCoords);
        setLocationLabel("Current Location");
        setAskingLocation(false);
        fetchData(userCoords.lat, userCoords.lng);
      },
      (error) => {
        console.error("Location error:", error);
        toast.error("Location access denied or unavailable. Using default location.");
        handleUseManualLocation("delhi");
      }
    );
  };

  // Fetch data based on coordinates
  const fetchData = async (lat, lng) => {
    setLoading(true);
    try {
      // 1. Fetch Sports
      const sportsRes = await fetch("/api/sports");
      const sportsData = await sportsRes.json();
      setSports(sportsData || []);

      // 2. Fetch Venues (sorted by backend Haversine formula)
      const venuesRes = await fetch(`/api/venues?lat=${lat}&lng=${lng}&radius_km=50`);
      const venuesData = await venuesRes.json();
      setVenues(venuesData || []);

      // 3. Fetch User's Squads if logged in
      const stored = localStorage.getItem("mukijo_user");
      if (stored) {
        const u = JSON.parse(stored);
        const teamsRes = await fetch(`/api/teams?userId=${u.id}`);
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setSquads(teamsData.teams || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync latest venue or sports data.");
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  };

  // Filter venues based on selected sport & search query
  const filteredVenues = venues.filter((venue) => {
    const matchesSport =
      selectedSport === "all" ||
      (venue.sports && venue.sports.some((s) => s.sport_id === Number(selectedSport)));
    const matchesSearch =
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  // Mock public games matching the theme of Spond
  const mockPublicGames = [
    {
      id: 1,
      title: "Elite 7x7 Match",
      sport: "football",
      sportLabel: "Football",
      price: "₹1,200",
      time: "20:00 • Today",
      tag: "LIVE",
      tagColor: "#EF4444",
      spotsLeft: 5,
      bg: "linear-gradient(135deg, #10B981 0%, #064E3B 100%)",
      icon: "⚽",
    },
    {
      id: 2,
      title: "Hoops Night Out",
      sport: "basketball",
      sportLabel: "Basketball",
      price: "₹1,500",
      time: "21:30 • Tomorrow",
      tag: "2 spots left",
      tagColor: "#F97316",
      spotsLeft: 2,
      bg: "linear-gradient(135deg, #F97316 0%, #7C2D12 100%)",
      icon: "🏀",
    },
    {
      id: 3,
      title: "Padel Pro Masters",
      sport: "padel",
      sportLabel: "Padel",
      price: "₹2,000",
      time: "18:00 • Wed",
      tag: "FULL",
      tagColor: "#64748B",
      spotsLeft: 0,
      bg: "linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)",
      icon: "🎾",
    },
  ];

  // Resolve sport object from selection
  const selectedSportObj = sports.find(s => s.id === Number(selectedSport));
  const filteredGames = mockPublicGames.filter(g => 
    selectedSport === "all" || 
    (selectedSportObj && g.sportLabel.toLowerCase() === selectedSportObj.name.toLowerCase())
  );

  // --- RENDER 1: LOCATION PROMPT PANEL ---
  if (askingLocation) {
    return (
      <MobileShell title="Discover">
        <Toaster position="top-right" theme="dark" />
        <div style={{
          textAlign: "center",
          padding: "32px 16px",
          background: T.card,
          borderRadius: "20px",
          boxShadow: T.shadow,
          border: `1.5px solid ${T.border}`,
          marginTop: 20
        }}>
          <div style={{ width: "72px", height: "72px", background: T.primaryL, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ fontSize: "32px" }}>📍</span>
          </div>

          {!showManualSelection ? (
            <>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: T.text, marginBottom: "8px" }}>Find Courts Near You</h2>
              <p style={{ color: T.sub, fontSize: "14px", lineHeight: 1.5, marginBottom: "24px" }}>
                We use your location to show available sports venues and public game matches closest to you.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button onClick={handleRequestLocation} disabled={locationLoading} style={{
                  padding: "12px", background: T.primary, color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer"
                }}>
                  {locationLoading ? "Locating..." : "Share Location Access"}
                </button>
                <button onClick={() => setShowManualSelection(true)} style={{
                  padding: "12px", background: "transparent", color: T.sub, border: `1.5px solid ${T.border}`, borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer"
                }}>
                  Enter Location Manually
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: T.text, marginBottom: "8px" }}>Select Your Location</h2>
              <p style={{ color: T.sub, fontSize: "14px", lineHeight: 1.5, marginBottom: "20px" }}>
                Choose your city to discover the closest sports venues and courts.
              </p>
              <div style={{ marginBottom: "20px" }}>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "#fff",
                    color: T.text,
                    border: `1.5px solid ${T.border}`,
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 600,
                    outline: "none"
                  }}
                >
                  <option value="delhi">New Delhi</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="bangalore">Bangalore</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button onClick={() => handleUseManualLocation(selectedCity)} style={{
                  padding: "12px", background: T.primary, color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer"
                }}>
                  Search in {citiesConfig[selectedCity].label}
                </button>
                <button onClick={() => setShowManualSelection(false)} style={{
                  padding: "12px", background: "transparent", color: T.sub, border: `1.5px solid ${T.border}`, borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer"
                }}>
                  ← Back to GPS
                </button>
              </div>
            </>
          )}
        </div>
      </MobileShell>
    );
  }

  // --- RENDER 2: MAIN PREMIUM DISCOVERY FEED ---
  return (
    <MobileShell title="Discover">
      <Toaster position="top-right" theme="dark" />

      {/* Location selector status card */}
      <div style={{
        background: T.card,
        borderRadius: "14px",
        padding: "12px 14px",
        boxShadow: T.shadow,
        border: `1px solid ${T.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Showing games near {locationLabel}</span>
        </div>
        <button onClick={() => setAskingLocation(true)} style={{
          background: T.primaryL,
          color: T.primary,
          border: "none",
          borderRadius: 8,
          padding: "5px 10px",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer"
        }}>
          Change
        </button>
      </div>

      {/* Search Input bar */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search venues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            paddingLeft: "38px",
            background: T.card,
            border: `1.5px solid ${T.border}`,
            borderRadius: "10px",
            color: T.text,
            fontSize: "13px",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: T.shadow
          }}
        />
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: T.sub, fontSize: "14px" }}>🔍</span>
      </div>

      {/* Sports Horizontal Filter Scroll */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "16px" }}>
        <button
          onClick={() => setSelectedSport("all")}
          style={{
            flexShrink: 0,
            padding: "8px 16px",
            borderRadius: "20px",
            border: `1.5px solid ${selectedSport === "all" ? T.primary : T.border}`,
            background: selectedSport === "all" ? T.primary : T.card,
            color: selectedSport === "all" ? "#fff" : T.sub,
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s"
          }}
        >
          All Sports
        </button>
        {sports.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSport(s.id)}
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              borderRadius: "20px",
              border: `1.5px solid ${selectedSport === s.id ? T.primary : T.border}`,
              background: selectedSport === s.id ? T.primary : T.card,
              color: selectedSport === s.id ? "#fff" : T.sub,
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Section 1: Public Games */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: T.text, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            Public Games Near You
            <span style={{ background: T.green, color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "99px" }}>LIVE</span>
          </h2>
        </div>

        {loading ? (
          <p style={{ color: T.sub, fontSize: "13px" }}>Syncing matches...</p>
        ) : filteredGames.length === 0 ? (
          <p style={{ color: T.sub, fontSize: "13px" }}>No public games found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredGames.map((game) => (
              <div
                key={game.id}
                onClick={() => router.push(`/events/${game.id}`)}
                style={{
                  background: T.card,
                  borderRadius: "14px",
                  border: `1.5px solid ${T.border}`,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  boxShadow: T.shadow
                }}
              >
                {/* Header title area */}
                <div style={{ padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: game.bg + "0C", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: T.primary, background: T.primaryL, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>{game.sportLabel}</span>
                    <h4 style={{ fontSize: "14px", fontWeight: 800, color: T.text, margin: "4px 0 0" }}>{game.title}</h4>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: T.primary }}>{game.price}</span>
                </div>
                {/* Details area */}
                <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: "12px", color: T.sub }}>⏰ {game.time}</span>
                    <span style={{ fontSize: "11px", color: game.spotsLeft > 0 ? T.green : T.red, fontWeight: 700 }}>
                      {game.spotsLeft > 0 ? `● ${game.spotsLeft} spot(s) left` : "FULL"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (game.spotsLeft > 0) {
                        toast.success(`Successfully joined "${game.title}"!`);
                      }
                    }}
                    disabled={game.spotsLeft === 0}
                    style={{
                      padding: "6px 12px",
                      background: game.spotsLeft > 0 ? T.primary : T.border,
                      color: game.spotsLeft > 0 ? "#fff" : T.sub,
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: game.spotsLeft > 0 ? "pointer" : "not-allowed"
                    }}
                  >
                    {game.spotsLeft > 0 ? "JOIN" : "Full"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Featured Venues */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 800, color: T.text, marginBottom: "12px" }}>Featured Venues</h2>

        {loading ? (
          <p style={{ color: T.sub, fontSize: "13px" }}>Locating complexes...</p>
        ) : filteredVenues.length === 0 ? (
          <div style={{ padding: "20px", background: T.card, borderRadius: "14px", border: `1.5px dashed ${T.border}`, textAlign: "center" }}>
            <p style={{ color: T.sub, fontSize: "13px", margin: 0 }}>No matching venues found nearby.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredVenues.map((v) => (
              <div
                key={v.id}
                onClick={() => router.push(`/bookings`)}
                style={{
                  background: T.card,
                  borderRadius: "14px",
                  border: `1.5px solid ${T.border}`,
                  padding: "14px",
                  display: "flex",
                  gap: "12px",
                  cursor: "pointer",
                  boxShadow: T.shadow
                }}
              >
                <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: T.primaryL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
                  🏟️
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</h4>
                    <p style={{ fontSize: "12px", color: T.sub, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.address}</p>
                    {v.distance_km !== undefined && (
                      <span style={{ fontSize: "11px", color: T.primary, fontWeight: 700, display: "block", marginTop: "4px" }}>
                        📍 {v.distance_km} km away
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {v.sports && v.sports.slice(0, 2).map((vs) => (
                        <span key={vs.sport_id} style={{ background: T.bg, color: T.sub, fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                          {vs.sport_id === 1 ? "Football" : vs.sport_id === 2 ? "Badminton" : "Tennis"}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: "12px", color: "#D97706", fontWeight: 700 }}>★ {v.rating || "4.5"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Your Squads */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 800, color: T.text, margin: 0 }}>Your Squads</h3>
          <button
            onClick={() => router.push("/groups")}
            style={{ border: "none", background: "none", color: T.primary, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
          >
            Manage
          </button>
        </div>

        <div style={{ background: T.card, borderRadius: "14px", border: `1.5px solid ${T.border}`, padding: "14px", boxShadow: T.shadow }}>
          {squads.length === 0 ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: T.sub, fontSize: "13px", margin: "0 0 10px" }}>You are not in any squads yet.</p>
              <button onClick={() => router.push("/groups")} style={{ padding: "8px 16px", background: T.primary, color: "#fff", border: "none", borderRadius: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                Create or Join Squad
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {squads.slice(0, 3).map((team) => (
                <div key={team.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h5 style={{ fontSize: "13px", fontWeight: 700, margin: 0, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{team.name}</h5>
                    <span style={{ fontSize: "11px", color: T.sub }}>{team.members_count || 5} Members</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pro Switch Card */}
      <div style={{ background: "linear-gradient(135deg, #0057B8 0%, #002D62 100%)", borderRadius: "14px", padding: "16px", color: "#fff", boxShadow: T.shadow, marginBottom: 16 }}>
        <h3 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 6px", color: "#fff" }}>Go Pro for Elite Perks</h3>
        <p style={{ fontSize: "12px", margin: "0 0 12px", color: "rgba(255,255,255,0.8)" }}>Priority slots, zero booking fees, and advanced game stats.</p>
        <button
          onClick={() => toast.success("Pro Subscription coming soon!")}
          style={{ width: "100%", padding: "8px", background: "#FFD700", color: "#000", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
        >
          UPGRADE NOW
        </button>
      </div>

      {/* Venue Partner Switcher */}
      <div style={{ background: T.card, borderRadius: "14px", border: `1.5px solid ${T.border}`, padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: T.shadow }}>
        <div>
          <span style={{ fontSize: "12px", color: T.sub, display: "block" }}>Own a sports facility?</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>Venue Partner Dashboard</span>
        </div>
        <button onClick={() => router.push("/venue")} style={{
          background: T.green, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer"
        }}>
          Switch
        </button>
      </div>

    </MobileShell>
  );
}

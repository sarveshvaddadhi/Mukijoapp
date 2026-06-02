import React, { useState } from 'react';

export default function LocationPrompt({ onRequest, onSkip, loading, error }) {
  const [showCities, setShowCities] = useState(false);
  const [selectedCity, setSelectedCity] = useState("delhi");

  const citiesConfig = {
    delhi: { lat: 28.5522, lng: 77.2198, label: "New Delhi" },
    mumbai: { lat: 19.0596, lng: 72.8727, label: "Mumbai" },
    bangalore: { lat: 12.9698, lng: 77.5978, label: "Bangalore" },
  };

  const handleConfirmCity = () => {
    const city = citiesConfig[selectedCity];
    onSkip({ lat: city.lat, lng: city.lng }, city.label);
  };

  return (
    <div style={{
      maxWidth: '480px',
      width: '100%',
      margin: '0 auto',
      textAlign: 'center',
      padding: '40px 24px',
      background: '#0F1E33',
      borderRadius: '24px',
      border: '1px solid #1E293B',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        animation: 'pulse 2s infinite'
      }}>
        <span style={{ fontSize: '32px' }}>📍</span>
      </div>
      
      {!showCities ? (
        <>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC', marginBottom: '12px' }}>
            Find venues near you
          </h2>
          
          <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: 1.5, marginBottom: '32px' }}>
            Mukijo uses your location to show sports venues, fields, and courts close to you. We never store your location without consent.
          </p>
          
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
              {error}
            </div>
          )}
          
          <button 
            onClick={onRequest}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Locating...' : 'Allow Location'}
          </button>
          
          <button 
            onClick={() => setShowCities(true)}
            style={{
              width: '100%',
              padding: '16px',
              background: 'transparent',
              color: '#94A3B8',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Enter location manually
          </button>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC', marginBottom: '12px' }}>
            Select your location
          </h2>
          
          <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: 1.5, marginBottom: '24px' }}>
            Choose your city to discover the closest sports venues and courts.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#0B1421',
                color: '#fff',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="delhi">New Delhi</option>
              <option value="mumbai">Mumbai</option>
              <option value="bangalore">Bangalore</option>
            </select>
          </div>

          <button 
            onClick={handleConfirmCity}
            style={{
              width: '100%',
              padding: '16px',
              background: '#FFD700',
              color: '#000',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'background 0.2s'
            }}
          >
            Search near selected city
          </button>

          <button 
            onClick={() => setShowCities(false)}
            style={{
              width: '100%',
              padding: '16px',
              background: 'transparent',
              color: '#94A3B8',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Back to GPS
          </button>
        </>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  );
}

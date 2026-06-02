"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDiscoveryFlow } from '@/hooks/useDiscoveryFlow';
import { useVenues } from '@/hooks/useVenues';
import VenueCard from '@/components/discovery/VenueCard';

// Dynamically import map to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/discovery/MapComponent'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1E293B', borderRadius: '12px' }}><p style={{ color: '#94A3B8' }}>Loading map...</p></div>
});

export default function SelectVenuePage() {
  const router = useRouter();
  const { sport, location, venue: selectedVenue, setVenue } = useDiscoveryFlow();
  const [radius, setRadius] = useState(20);
  
  // Use user location if available, otherwise fallback
  const lat = location?.lat || 28.6139; // Default fallback e.g. New Delhi
  const lng = location?.lng || 77.2090;

  const { venues, loading, error } = useVenues(sport?.id, lat, lng, radius);

  const handleNext = () => {
    if (selectedVenue) {
      router.push('/discovery/build-team');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)' }}>
      {/* Top Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #1E293B' }}>
        <h1 style={{ fontSize: '28px', color: '#F8FAFC', fontWeight: 800, marginBottom: '8px' }}>Select a Venue</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#94A3B8', fontSize: '14px' }}>
            Showing venues for <strong style={{ color: sport?.color || '#fff' }}>{sport?.name || 'Sport'}</strong> near you
          </span>
          <select 
            value={radius} 
            onChange={e => setRadius(Number(e.target.value))}
            style={{ background: '#1E293B', color: '#fff', border: '1px solid #334155', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
          >
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={20}>Within 20 km</option>
            <option value={50}>Within 50 km</option>
          </select>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left List Panel */}
        <div style={{ width: '40%', minWidth: '350px', borderRight: '1px solid #1E293B', overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>Loading venues...</p>
          ) : error ? (
            <p style={{ color: '#EF4444', textAlign: 'center', marginTop: '40px' }}>Error: {error}</p>
          ) : venues.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>No venues found in this area.</p>
          ) : (
            venues.map(v => (
              <VenueCard 
                key={v.id} 
                venue={v} 
                isSelected={selectedVenue?.id === v.id} 
                onSelect={setVenue} 
              />
            ))
          )}
        </div>

        {/* Right Map Panel */}
        <div style={{ flex: 1, padding: '24px' }}>
          <MapComponent 
            venues={venues} 
            selectedVenue={selectedVenue} 
            center={location ? [location.lat, location.lng] : null}
            onSelect={setVenue}
          />
        </div>
      </div>

      {/* Footer CTA */}
      {selectedVenue && (
        <div style={{ padding: '16px 32px', background: '#0D1B2A', borderTop: '1px solid #1E293B', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ marginRight: '24px' }}>
            <span style={{ color: '#94A3B8', fontSize: '13px', display: 'block' }}>Selected Venue</span>
            <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{selectedVenue.name}</span>
          </div>
          <button 
            onClick={handleNext}
            style={{ 
              padding: '12px 32px', 
              background: '#3B82F6', 
              color: '#fff', 
              borderRadius: '8px', 
              border: 'none', 
              fontSize: '16px', 
              fontWeight: 600, 
              cursor: 'pointer'
            }}
          >
            Use this venue →
          </button>
        </div>
      )}
    </div>
  );
}

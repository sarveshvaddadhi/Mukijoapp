import React from 'react';

export default function VenueCard({ venue, isSelected, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(venue)}
      style={{
        padding: '16px',
        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#1E293B',
        border: `2px solid ${isSelected ? '#3B82F6' : '#334155'}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ color: '#F8FAFC', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            {venue.name}
          </h4>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '8px' }}>
            {venue.address}
          </p>
        </div>
        
        {venue.distance_km !== undefined && (
          <div style={{ 
            background: '#0F172A', 
            color: '#CBD5E1', 
            padding: '4px 8px', 
            borderRadius: '6px', 
            fontSize: '12px',
            fontWeight: 500 
          }}>
            {venue.distance_km} km
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ 
          background: venue.is_available ? 'rgba(0, 230, 118, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          color: venue.is_available ? '#00E676' : '#EF4444', 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontSize: '12px',
          fontWeight: 600
        }}>
          {venue.is_available ? 'Available' : 'Busy'}
        </span>
        
        {venue.rating > 0 && (
          <span style={{ color: '#F59E0B', fontSize: '13px', fontWeight: 500 }}>
            ★ {venue.rating}
          </span>
        )}
      </div>
    </div>
  );
}

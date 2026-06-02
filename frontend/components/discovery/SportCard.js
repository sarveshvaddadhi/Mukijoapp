import React from 'react';

export default function SportCard({ sport, isSelected, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(sport)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: isSelected ? 'rgba(255, 255, 255, 0.1)' : '#1E293B',
        border: `2px solid ${isSelected ? sport.color || sport.accent_color : '#334155'}`,
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = '#475569';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = '#334155';
        }
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: sport.color || sport.accent_color,
          color: '#fff',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ✓
        </div>
      )}
      
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        {sport.emoji || sport.icon_url}
      </div>
      
      <h3 style={{ 
        color: '#F8FAFC', 
        fontSize: '18px', 
        fontWeight: 600, 
        fontFamily: "'Barlow Condensed', sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {sport.name}
      </h3>
    </div>
  );
}

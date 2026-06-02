"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDiscoveryFlow } from '@/hooks/useDiscoveryFlow';
import { SPORTS } from '@/lib/sports';
import SportCard from '@/components/discovery/SportCard';

export default function SelectSportPage() {
  const router = useRouter();
  const { sport, setSport } = useDiscoveryFlow();
  const [search, setSearch] = useState('');

  const filteredSports = SPORTS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleNext = () => {
    if (sport) {
      router.push('/discovery/location');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '36px', color: '#F8FAFC', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Select Your Sport</h1>
        <p style={{ color: '#94A3B8', textAlign: 'center', marginBottom: '32px' }}>Choose the primary sport for your team.</p>
        
        <div style={{ marginBottom: '32px' }}>
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sports..."
            style={{ 
              width: '100%', 
              padding: '16px 24px', 
              background: '#1E293B', 
              border: '2px solid #334155', 
              borderRadius: '30px', 
              color: '#fff', 
              fontSize: '16px', 
              outline: 'none',
              textAlign: 'center'
            }}
          />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          {filteredSports.map(s => (
            <SportCard 
              key={s.id} 
              sport={s} 
              isSelected={sport?.id === s.id} 
              onSelect={() => setSport(s)} 
            />
          ))}
        </div>

        {sport && (
          <div style={{ position: 'sticky', bottom: '24px', zIndex: 10 }}>
            <button 
              onClick={handleNext}
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: sport.color || sport.accent_color, 
                color: '#0F172A', 
                borderRadius: '12px', 
                border: 'none', 
                fontSize: '18px', 
                fontWeight: 800, 
                cursor: 'pointer',
                boxShadow: `0 8px 32px ${sport.color}40`
              }}
            >
              Next: Location & Venue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

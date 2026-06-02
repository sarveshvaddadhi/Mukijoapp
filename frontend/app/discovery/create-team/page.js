"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDiscoveryFlow } from '@/hooks/useDiscoveryFlow';

export default function CreateTeamPage() {
  const router = useRouter();
  const { team, setTeam } = useDiscoveryFlow();
  
  const [name, setName] = useState(team.name || '');
  const [type, setType] = useState(team.type || null);
  const [ageGroup, setAgeGroup] = useState(team.age_group || null);
  const [visibility, setVisibility] = useState(team.visibility || 'public');

  const teamTypes = [
    { id: 'club', label: 'Club' },
    { id: 'school', label: 'School' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'recreational', label: 'Recreational' }
  ];

  const ageGroups = [
    { id: 'u10', label: 'Under 10' },
    { id: 'u14', label: 'Under 14' },
    { id: 'u18', label: 'Under 18' },
    { id: 'adult', label: 'Adult' },
    { id: 'mixed', label: 'Mixed' }
  ];

  const handleNext = () => {
    if (!name || !type || !ageGroup) return;
    
    setTeam({
      name,
      type,
      age_group: ageGroup,
      visibility
    });
    
    router.push('/discovery/select-sport');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }} />
      
      <div style={{ width: '100%', maxWidth: '600px', zIndex: 1 }}>
        <h1 style={{ fontSize: '36px', color: '#F8FAFC', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Create Your Team</h1>
        <p style={{ color: '#94A3B8', textAlign: 'center', marginBottom: '40px' }}>Let's set up the basics for your new squad.</p>
        
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ color: '#E2E8F0', fontWeight: 600 }}>Team Name</label>
            <span style={{ color: '#64748B', fontSize: '12px' }}>{name.length}/40</span>
          </div>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="e.g. Manchester United U18"
            style={{ width: '100%', padding: '16px', background: '#1E293B', border: '2px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '18px', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ color: '#E2E8F0', fontWeight: 600, display: 'block', marginBottom: '12px' }}>Team Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {teamTypes.map(t => (
              <button 
                key={t.id}
                onClick={() => setType(t.id)}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: '30px', 
                  background: type === t.id ? '#3B82F6' : '#1E293B',
                  color: type === t.id ? '#fff' : '#94A3B8',
                  border: type === t.id ? 'none' : '1px solid #334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ color: '#E2E8F0', fontWeight: 600, display: 'block', marginBottom: '12px' }}>Age Group</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {ageGroups.map(a => (
              <button 
                key={a.id}
                onClick={() => setAgeGroup(a.id)}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: '30px', 
                  background: ageGroup === a.id ? '#3B82F6' : '#1E293B',
                  color: ageGroup === a.id ? '#fff' : '#94A3B8',
                  border: ageGroup === a.id ? 'none' : '1px solid #334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#1E293B', borderRadius: '12px' }}>
          <div>
            <div style={{ color: '#F8FAFC', fontWeight: 600, marginBottom: '4px' }}>Public Team</div>
            <div style={{ color: '#64748B', fontSize: '13px' }}>Allow players to discover and join your team.</div>
          </div>
          <div 
            onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
            style={{ width: '48px', height: '24px', background: visibility === 'public' ? '#3B82F6' : '#334155', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}
          >
            <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: visibility === 'public' ? '26px' : '2px', transition: 'left 0.2s' }} />
          </div>
        </div>

        <button 
          onClick={handleNext}
          disabled={!name || !type || !ageGroup}
          style={{ width: '100%', padding: '16px', background: '#00E676', color: '#0F172A', borderRadius: '12px', border: 'none', fontSize: '18px', fontWeight: 800, cursor: (!name || !type || !ageGroup) ? 'not-allowed' : 'pointer', opacity: (!name || !type || !ageGroup) ? 0.5 : 1 }}
        >
          Next: Choose Sport →
        </button>
      </div>
    </div>
  );
}

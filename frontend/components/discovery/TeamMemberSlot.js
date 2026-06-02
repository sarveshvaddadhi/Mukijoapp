import React from 'react';

export default function TeamMemberSlot({ member, onRemove, onRoleChange }) {
  const roles = [
    { value: 'PLAYER', label: 'Player', icon: '🏃' },
    { value: 'COACH', label: 'Coach', icon: '📋' },
    { value: 'ADMIN', label: 'Admin', icon: '⚙️' },
    { value: 'GUARDIAN', label: 'Guardian', icon: '👪' }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      background: '#1E293B',
      border: '1px solid #334155',
      borderRadius: '12px',
      marginBottom: '8px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#3B82F6',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        marginRight: '12px',
        fontSize: '14px'
      }}>
        {member.email_or_phone.charAt(0).toUpperCase()}
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ 
          color: '#F8FAFC', 
          fontSize: '14px', 
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {member.email_or_phone}
        </p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <select 
          value={member.role}
          onChange={(e) => onRoleChange(member.email_or_phone, e.target.value)}
          style={{
            background: '#0F172A',
            color: '#CBD5E1',
            border: '1px solid #334155',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {roles.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        
        <button 
          onClick={() => onRemove(member.email_or_phone)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

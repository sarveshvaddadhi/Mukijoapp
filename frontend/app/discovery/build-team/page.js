"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';
import { useDiscoveryFlow } from '@/hooks/useDiscoveryFlow';
import TeamMemberSlot from '@/components/discovery/TeamMemberSlot';

export default function BuildTeamPage() {
  const router = useRouter();
  const { user, team, sport, venue, members, addMember, removeMember, setTeam, reset } = useDiscoveryFlow();
  
  const [inviteInput, setInviteInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    
    // basic email/phone validation
    if (!inviteInput.includes('@') && !/^\d+$/.test(inviteInput)) {
      toast.error('Please enter a valid email or phone number');
      return;
    }

    if (members.some(m => m.email_or_phone === inviteInput)) {
      toast.error('Member already added');
      return;
    }

    addMember({ email_or_phone: inviteInput.trim(), role: 'PLAYER' });
    setInviteInput('');
  };

  const handleRoleChange = (email_or_phone, newRole) => {
    // In zustand we might need a dedicated action, or we can just update the array
    removeMember(email_or_phone);
    addMember({ email_or_phone, role: newRole });
  };

  const submitTeam = async () => {
    setLoading(true);
    try {
      const payload = {
        name: team.name,
        sport_id: sport?.id,
        team_type: team.type,
        age_group: team.age_group,
        visibility: team.visibility,
        venue_id: venue?.id,
        userId: user?.id,
        members: members
      };

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.detail || 'Failed to create team');
      }

      // Success
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [sport?.color || '#3B82F6', '#ffffff']
      });

      toast.success('Team created successfully!');
      
      setTimeout(() => {
        reset();
        router.push('/dashboard'); // or /dashboard/[team_id]
      }, 2000);

    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
      <Toaster position="top-right" theme="dark" />
      
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {/* Team Summary Card */}
        <div style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)', padding: '24px', borderRadius: '16px', border: `1px solid ${sport?.color || '#334155'}`, marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: sport?.color || '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            {sport?.icon_url || '🏆'}
          </div>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#E2E8F0', textTransform: 'uppercase' }}>
                {team?.type}
              </span>
              <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#E2E8F0', textTransform: 'uppercase' }}>
                {team?.age_group}
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0 }}>{team?.name || 'Your New Team'}</h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', margin: '4px 0 0' }}>📍 {venue?.name || 'No venue selected'}</p>
          </div>
        </div>

        <h3 style={{ fontSize: '20px', color: '#F8FAFC', fontWeight: 700, marginBottom: '8px' }}>Invite Members</h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>Build your squad now or do it later from the dashboard.</p>

        <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <input 
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder="Add by email or phone..."
            style={{ flex: 1, padding: '14px 16px', background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none' }}
          />
          <button 
            type="submit"
            style={{ padding: '0 24px', background: '#334155', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
          >
            Add
          </button>
        </form>

        <div style={{ marginBottom: '40px' }}>
          {members.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '1px dashed #334155' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>👥</span>
              <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>No members added yet.</p>
            </div>
          ) : (
            members.map(m => (
              <TeamMemberSlot 
                key={m.email_or_phone}
                member={m}
                onRemove={removeMember}
                onRoleChange={handleRoleChange}
              />
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={submitTeam}
            disabled={loading}
            style={{ flex: 1, padding: '16px', background: 'transparent', color: '#94A3B8', border: '1px solid #334155', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            Skip for now
          </button>
          
          <button 
            onClick={submitTeam}
            disabled={loading}
            style={{ flex: 2, padding: '16px', background: '#00E676', color: '#0F172A', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}
          >
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Toaster, toast } from 'sonner';
import { useDiscoveryFlow } from '@/hooks/useDiscoveryFlow';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useDiscoveryFlow();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.full_name,
          email: data.email,
          phone: data.phone,
          password: data.password
        })
      });

      let result;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server Error: ${text || res.statusText}`);
      }
      
      if (!res.ok) {
        throw new Error(result.detail || 'Failed to register');
      }

      setUser(result.user);
      router.push('/discovery/create-team');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    toast.info("Google OAuth flow goes here");
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%' }}>
      <Toaster position="top-right" theme="dark" />
      
      {/* Left Panel */}
      <div style={{ flex: 1, background: '#0D1B2A', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px' }} className="hidden md:flex">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, background: 'radial-gradient(circle at 50% 50%, #3B82F6 0%, transparent 50%)' }} />
        <h1 style={{ fontSize: '48px', color: '#fff', fontWeight: 900, zIndex: 1, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>Mukijo</h1>
        <p style={{ fontSize: '24px', color: '#94A3B8', zIndex: 1, marginTop: '16px' }}>Your team. Your game. One place.</p>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, background: '#0B1421', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '28px', color: '#F8FAFC', fontWeight: 700, marginBottom: '24px' }}>Create an Account</h2>
          
          <button 
            onClick={handleGoogleAuth}
            style={{ width: '100%', padding: '14px', background: '#fff', color: '#0F172A', borderRadius: '8px', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px' }}
          >
            <span style={{ fontSize: '18px' }}>G</span> Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#334155' }} />
            <span style={{ padding: '0 12px', color: '#64748B', fontSize: '14px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#334155' }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input {...register('full_name')} placeholder="Full Name" style={{ width: '100%', padding: '14px', background: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC', outline: 'none' }} />
              {errors.full_name && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.full_name.message}</span>}
            </div>
            
            <div>
              <input {...register('email')} type="email" placeholder="Email" style={{ width: '100%', padding: '14px', background: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC', outline: 'none' }} />
              {errors.email && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</span>}
            </div>
            
            <div>
              <input {...register('phone')} placeholder="Phone Number (optional)" style={{ width: '100%', padding: '14px', background: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC', outline: 'none' }} />
            </div>
            
            <div>
              <input {...register('password')} type="password" placeholder="Password" style={{ width: '100%', padding: '14px', background: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC', outline: 'none' }} />
              {errors.password && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.password.message}</span>}
            </div>
            
            <div>
              <input {...register('confirmPassword')} type="password" placeholder="Confirm Password" style={{ width: '100%', padding: '14px', background: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#F8FAFC', outline: 'none' }} />
              {errors.confirmPassword && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#3B82F6', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

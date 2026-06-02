"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDiscoveryFlow } from '@/hooks/useDiscoveryFlow';
import { useLocation } from '@/hooks/useLocation';
import LocationPrompt from '@/components/discovery/LocationPrompt';

export default function LocationPage() {
  const router = useRouter();
  const { setLocation } = useDiscoveryFlow();
  const { coords, error, loading, requestLocation } = useLocation();

  useEffect(() => {
    if (coords) {
      setLocation({ lat: coords.lat, lng: coords.lng, label: 'Current Location' });
      router.push('/discovery/select-venue');
    }
  }, [coords, router, setLocation]);

  const handleSkip = (coords, label) => {
    if (coords && label) {
      setLocation({ lat: coords.lat, lng: coords.lng, label: label });
    }
    router.push('/discovery/select-venue');
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <LocationPrompt 
        onRequest={requestLocation} 
        onSkip={handleSkip} 
        loading={loading} 
        error={error} 
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ProgressStepper from '@/components/discovery/ProgressStepper';

export default function DiscoveryLayout({ children }) {
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (pathname.includes('/register')) setCurrentStep(1);
    else if (pathname.includes('/create-team')) setCurrentStep(2);
    else if (pathname.includes('/select-sport')) setCurrentStep(3);
    else if (pathname.includes('/location')) setCurrentStep(4);
    else if (pathname.includes('/select-venue')) setCurrentStep(5);
    else if (pathname.includes('/build-team')) setCurrentStep(6);
  }, [pathname]);

  const isOnboarding = pathname !== '/discovery';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0B1421', fontFamily: "'Inter', sans-serif" }}>
      {isOnboarding && <ProgressStepper currentStep={currentStep} />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}

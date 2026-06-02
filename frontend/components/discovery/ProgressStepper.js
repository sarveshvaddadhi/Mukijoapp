import React from 'react';

const steps = [
  { id: 1, label: 'Register' },
  { id: 2, label: 'Team Details' },
  { id: 3, label: 'Sport' },
  { id: 4, label: 'Location' },
  { id: 5, label: 'Venue' },
  { id: 6, label: 'Build Team' }
];

export default function ProgressStepper({ currentStep }) {
  return (
    <div style={{ padding: '16px 24px', background: '#0D1B2A', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Desktop view */}
      <div style={{ display: 'none', width: '100%', maxWidth: '800px', '@media (min-width: 768px)': { display: 'flex' }, justifyContent: 'space-between', alignItems: 'center' }} className="md:flex hidden">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 'bold',
                background: isCompleted ? '#00E676' : isCurrent ? '#3B82F6' : '#1E293B',
                color: (isCompleted || isCurrent) ? '#fff' : '#64748B',
                transition: 'all 0.3s ease'
              }}>
                {isCompleted ? '✓' : step.id}
              </div>
              <span style={{
                marginLeft: '12px', fontSize: '14px', fontWeight: 600,
                color: isCurrent ? '#fff' : isCompleted ? '#E2E8F0' : '#64748B'
              }}>
                {step.label}
              </span>
              
              {index < steps.length - 1 && (
                <div style={{
                  flex: 1, height: '2px', margin: '0 16px',
                  background: isCompleted ? '#00E676' : '#1E293B'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view */}
      <div style={{ display: 'block', width: '100%' }} className="md:hidden">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: 600 }}>Step {currentStep} of {steps.length}</span>
          <span style={{ color: '#94A3B8', fontSize: '14px' }}>{steps[currentStep - 1]?.label}</span>
        </div>
        <div style={{ width: '100%', height: '4px', background: '#1E293B', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(currentStep / steps.length) * 100}%`,
            background: '#3B82F6',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  );
}

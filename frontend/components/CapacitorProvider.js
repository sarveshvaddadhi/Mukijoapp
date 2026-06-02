'use client';

// Execute the patch immediately upon module evaluation, prior to any component render/mount
if (typeof window !== 'undefined' && !window.fetchPatched) {
  window.fetchPatched = true;
  const originalFetch = window.fetch;
  
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
      // Normalize URL construction to ensure no double slashes or missing slashes
      const cleanInput = `${backendUrl.replace(/\/+$/, '')}/${input.replace(/^\/+/, '')}`;
      return originalFetch(cleanInput, init);
    }
    return originalFetch(input, init);
  };
}

export default function CapacitorProvider({ children }) {
  return children;
}

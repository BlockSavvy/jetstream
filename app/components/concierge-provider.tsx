'use client';

import dynamic from 'next/dynamic';

// Import AI Concierge component with dynamic loading to avoid hydration issues
const AIConcierge = dynamic(() => import('@/app/components/voice/AIConcierge'), { ssr: false });

export function ConciergeProvider() {
  return <AIConcierge />;
} 
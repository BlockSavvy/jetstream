'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with no SSR - safe in a client component
const ConciergeProvider = dynamic(
  () => import('@/app/components/concierge-provider').then(mod => mod.ConciergeProvider),
  { ssr: false }
);

export default function ClientProviders({ children }: { children?: ReactNode }) {
  return (
    <>
      {children}
      <ConciergeProvider />
    </>
  );
} 
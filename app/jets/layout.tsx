'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/AuthGuard';

export default function JetsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
} 
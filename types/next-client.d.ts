/**
 * Type declarations for Next.js 15 client components
 * This ensures client components can work with non-Promise params
 */

import type { ReactNode } from 'react';

declare module 'next' {
  export interface PageProps {
    children?: ReactNode;
    params: Record<string, string>;
  }
} 
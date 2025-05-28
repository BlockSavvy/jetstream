// Split file into client and server parts
import { Metadata } from 'next';
// Use the full path to avoid TypeScript module resolution issues
import GdyupClientLayout from '@/app/gdyup/components/GdyupClientLayout';

// Server Component - this can contain metadata
export const metadata: Metadata = {
  title: 'GDY UP | Private Jet Sharing Platform',
  description: 'Share private jets and reduce your flying costs',
};

/**
 * Main layout for GDY·UP application
 * Fixed to prevent hydration errors and chunk loading issues
 */
export default function GdyupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server component wrapper around client component
  return <GdyupClientLayout>{children}</GdyupClientLayout>;
} 
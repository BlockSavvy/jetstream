'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Don't show Jetstream navbar on GDY UP or JetShare pages
  const isGdyupOrJetshare = pathname?.startsWith('/gdyup') || pathname?.startsWith('/jetshare');
  
  if (isGdyupOrJetshare) {
    return null;
  }
  
  return <Navbar />;
} 
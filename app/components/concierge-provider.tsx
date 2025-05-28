'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Dynamic imports with no SSR to avoid hydration issues
const MobileConciergeButton = dynamic(
  () => import('@/components/concierge-button-mobile'),
  { ssr: false }
);

// Extract form data from a global event listener
interface FormData {
  total_cost?: number | string;
  departure_location?: string;
  arrival_location?: string;
  departure_time?: Date;
  aircraft_model?: string;
  available_seats?: number;
  flight_duration?: string;
}

interface ConciergeProviderProps {
  children?: ReactNode;
}

export function ConciergeProvider({ children }: ConciergeProviderProps) {
  const [formData, setFormData] = useState<FormData>({});
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Determine context based on current route
  const getContextForRoute = () => {
    if (pathname?.includes('/create') || pathname?.includes('/offer')) {
      return 'offer-creation';
    }
    if (pathname?.includes('/browse') || pathname?.includes('/search')) {
      return 'flight-search';
    }
    return 'general';
  };

  // Listen for form updates from anywhere in the app
  useEffect(() => {
    const handleFormUpdate = (event: CustomEvent) => {
      console.log('[ConciergeProvider] Form data updated:', event.detail);
      setFormData(event.detail);
    };

    document.addEventListener('gdyup-form-update', handleFormUpdate as EventListener);
    
    return () => {
      document.removeEventListener('gdyup-form-update', handleFormUpdate as EventListener);
    };
  }, []);

  // Only render concierge on mobile when NOT on GDY·UP pages (since mobile nav has integrated button)
  // On desktop, don't render any concierge button to avoid conflicts
  const shouldRenderConcierge = isMobile && !pathname?.startsWith('/gdyup');

  return (
    <>
      {children}
      {shouldRenderConcierge && (
        <MobileConciergeButton 
          context={getContextForRoute()}
          currentFlightData={formData}
        />
      )}
    </>
  );
} 
'use client';

import { ConciergeButton } from '@/components/concierge-button';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef, ReactNode } from 'react';

// Extract form data from a global event listener
interface FormData {
  total_cost?: number | string;
  departure_location?: string;
  arrival_location?: string;
  departure_time?: Date;
  aircraft_model?: string;
  available_seats?: number;
  total_seats?: number;
  [key: string]: any; // Allow other fields
}

interface ConciergeProviderProps {
  children?: ReactNode;
}

export function ConciergeProvider({ children }: ConciergeProviderProps) {
  const pathname = usePathname();
  const [context, setContext] = useState<'general' | 'offer-creation' | 'flight-search'>('general');
  const [formData, setFormData] = useState<FormData>({});
  const [position, setPosition] = useState<'bottom-right' | 'bottom-nav' | 'fab'>('bottom-right');
  const [isClientSide, setIsClientSide] = useState(false);
  
  // Set flag to indicate we're on client-side
  useEffect(() => {
    setIsClientSide(true);
    console.log('[ConciergeProvider] Mounted on client side with pathname:', pathname);
  }, [pathname]);
  
  // Handle direct AI concierge requests (like from the Ask Concierge button)
  useEffect(() => {
    if (!isClientSide) return;
    
    const handleDirectRequest = (event: CustomEvent) => {
      if (event.detail && typeof event.detail === 'object') {
        console.log('[ConciergeProvider] Received direct AI concierge request:', event.detail);
        
        // Dispatch an event to open the concierge with specific context
        const openEvent = new CustomEvent('gdyup-open-concierge', {
          detail: event.detail
        });
        document.dispatchEvent(openEvent);
      }
    };
    
    console.log('[ConciergeProvider] Setting up event listeners');
    
    // Add event listener
    document.addEventListener('gdyup-ai-concierge-request', handleDirectRequest as EventListener);
    
    return () => {
      document.removeEventListener('gdyup-ai-concierge-request', handleDirectRequest as EventListener);
    };
  }, [isClientSide]);

  // Determine context based on pathname
  useEffect(() => {
    if (!isClientSide) return;

    // Ensure the button is always positioned at the bottom center
    setPosition('bottom-nav');
    
    // Set context based on path
    if (pathname?.includes('/gdyup/offer') || pathname?.includes('/gdyup/create')) {
      setContext('offer-creation');
      console.log('[ConciergeProvider] Detected offer creation context');
    } else if (pathname?.includes('/gdyup/flights') || pathname?.includes('/gdyup/marketplace')) {
      setContext('flight-search');
      console.log('[ConciergeProvider] Detected flight search context');
    } else {
      setContext('general');
      console.log('[ConciergeProvider] Using general context');
    }
    
    console.log('[ConciergeProvider] Path:', pathname, 'Context:', context);
  }, [pathname, isClientSide]);

  // Listen for form data events to provide context to AI
  useEffect(() => {
    if (!isClientSide) return;
    
    const handleFormDataEvent = (event: CustomEvent) => {
      if (event.detail && typeof event.detail === 'object') {
        console.log('[ConciergeProvider] Received form data:', event.detail);
        setFormData(event.detail);
      }
    };

    // Add event listener for form data
    document.addEventListener('gdyup-form-data', handleFormDataEvent as EventListener);

    return () => {
      document.removeEventListener('gdyup-form-data', handleFormDataEvent as EventListener);
    };
  }, [isClientSide]);

  // Create flight data object from form data
  const getFlightDataForContext = () => {
    if (context === 'offer-creation' && Object.keys(formData).length > 0) {
      return {
        route: formData.departure_location && formData.arrival_location 
          ? `${formData.departure_location} to ${formData.arrival_location}` 
          : undefined,
        aircraft: formData.aircraft_model,
        totalCost: formData.total_cost,
        seats: {
          total: formData.total_seats,
          available: formData.available_seats,
          yours: formData.total_seats && formData.available_seats 
            ? Number(formData.total_seats) - Number(formData.available_seats)
            : undefined
        },
        departureTime: formData.departure_time,
        // Include any other contextual data from form
        ...formData
      };
    }
    return undefined;
  };

  // Don't render until client-side to prevent hydration issues
  if (!isClientSide) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <ConciergeButton 
        imageUrl="/icons/conciergebutton.png" 
        context={context}
        position="bottom-right" // Keep consistent position for now
        currentFlightData={getFlightDataForContext()}
      />
    </>
  );
} 
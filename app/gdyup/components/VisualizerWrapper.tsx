'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect } from 'react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

// Dynamic import of JetSeatVisualizer with SSR disabled
const JetSeatVisualizer = dynamic(() => import('./JetSeatVisualizer'), {
  ssr: false,
  loading: () => {
    // We can't use the hook in this loading component (outside the main component body)
    // so we use the variables directly
    return (
      <div className="w-full h-48 bg-gdyup-bg-card rounded-md animate-pulse flex items-center justify-center">
        <p className="text-gdyup-text-subtle">Loading visualizer...</p>
      </div>
    );
  },
});

interface VisualizerWrapperProps {
  jet_id: string;
  readOnly?: boolean;
  showControls?: boolean;
  showLegend?: boolean;
  totalSeats?: number;
  splitConfig?: any; // The split configuration from your offer
}

// Define a simple Record type for the seat configuration
type SimpleSeatConfig = Record<string, boolean>;

export default function VisualizerWrapper({
  jet_id,
  readOnly = true,
  showControls = false,
  showLegend = true,
  totalSeats = 8,
  splitConfig
}: VisualizerWrapperProps) {
  const visualizerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  // Log totalSeats prop for debugging
  useEffect(() => {
    console.log(`[VisualizerWrapper] Received totalSeats: ${totalSeats} (${typeof totalSeats})`);
  }, [totalSeats]);
  
  // Set ready state after component mounts
  useEffect(() => {
    // Short timeout to ensure client-side hydration is complete
    const timer = setTimeout(() => {
      setIsReady(true);
      console.log(`[VisualizerWrapper] Component ready with totalSeats: ${totalSeats}`);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [totalSeats]);

  // Handle errors from the visualizer
  const handleError = (error: Error | string) => {
    console.error('Visualizer error:', error);
    setError(typeof error === 'string' ? error : error.message);
  };

  // Convert old split configuration to seat configuration format
  const initialSelection = splitConfig ? {
    jet_id: jet_id || 'default-jet',
    selectedSeats: splitConfig.allocatedSeats ? 
      (Object.values(splitConfig.allocatedSeats).flat() as string[]) : [],
    totalSeats: totalSeats,
    totalSelected: Object.values(splitConfig.allocatedSeats || {}).flat().length,
    selectionPercentage: splitConfig.splitPercentage || 0
  } : {
    jet_id: 'default-jet',
    selectedSeats: [],
    totalSeats: totalSeats,
    totalSelected: 0,
    selectionPercentage: 0
  };

  // Create a simplified seatConfig that matches the expected type
  const simplifiedSeatConfig: SimpleSeatConfig = {};
  
  // If we have allocated seats, mark them as available in the seatConfig
  if (splitConfig?.allocatedSeats) {
    const allSeats = Object.values(splitConfig.allocatedSeats).flat() as string[];
    allSeats.forEach(seatId => {
      simplifiedSeatConfig[seatId] = true;
    });
  }

  console.log(`[VisualizerWrapper] About to render with totalSeats=${totalSeats}, jet_id=${jet_id}, isReady=${isReady}`);

  // Fallback for client-side rendering
  if (!isReady) {
    return (
      <div className={cn(
        "w-full h-48 rounded-md flex items-center justify-center",
        getThemedBackgroundClasses('card')
      )}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gdyup-primary"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={cn(
        "w-full h-48 rounded-md flex items-center justify-center",
        getThemedBackgroundClasses('card')
      )}>
        <p className={cn(getThemedTextClasses('destructive'))}>Error: {error}</p>
      </div>
    );
  }

  return (
    <JetSeatVisualizer
      ref={visualizerRef}
      jet_id={jet_id}
      initialSelection={initialSelection}
      readOnly={readOnly}
      showControls={showControls}
      showLegend={showLegend}
      totalSeats={totalSeats}
      seatConfig={simplifiedSeatConfig}
      onError={handleError}
    />
  );
} 
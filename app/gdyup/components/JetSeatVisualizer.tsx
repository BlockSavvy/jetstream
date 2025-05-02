'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import Selecto from 'react-selecto';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { RefreshCw, GripVertical, MousePointerClick, MousePointer, Trash2, CheckCheck, AlertTriangle } from 'lucide-react';
import debounce from 'lodash/debounce';
import { Button } from '@/components/ui/button';

// Seat types and layout interfaces
export interface SeatLayout {
  rows: number;
  seatsPerRow: number;
  layoutType: 'standard' | 'luxury' | 'custom';
  totalSeats?: number;
  seatMap?: {
    skipPositions?: number[][];
    customPositions?: { row: number; col: number; id: string }[];
  };
}

export interface SeatConfiguration {
  jet_id: string;
  selectedSeats: string[];
  totalSeats: number;
  totalSelected: number;
  selectionPercentage: number;
}

// Props interface
export interface JetSeatVisualizerProps {
  jet_id: string;
  defaultLayout?: SeatLayout;
  onChange?: (config: SeatConfiguration) => void;
  initialSelection?: SeatConfiguration;
  readOnly?: boolean;
  className?: string;
  showControls?: boolean;
  totalSeats?: number;
  onError?: (error: Error | string) => void;
  showLegend?: boolean;
  showSummary?: boolean;
  customLayout?: SeatLayout;
  forceExactLayout?: boolean;
  onAllocationChange?: (allocation: { yourSeats: number; partnerSeats: number; selectionPercentage: number; totalSelected: number }) => void;
  initialSelectionPercentage?: number;
}

// Export the component ref type for external usage
export type JetSeatVisualizerRef = {
  openVisualizer: () => void;
  closeVisualizer: () => void;
  getLayoutInfo: () => {
    totalSeats: number;
    rows: number;
    seatsPerRow: number;
    layoutType: string;
    jet_id: string;
  };
  selectSeats: (seatIds: string[]) => void;
  clearSelection: () => void;
  setSelectionMode: (mode: 'tap' | 'drag') => void;
};

// Helper function to generate seat IDs
const generateSeatId = (row: number, col: number) => {
  const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
  return `${rowLetter}${col + 1}`;
};

// Add a status message component
const StatusMessage = ({ isLoading, error, onRetry }: { isLoading: boolean; error: string | null; onRetry?: () => void }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-2"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading jet configuration...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 text-center p-4">
        <p className="mb-2">{error}</p>
        {onRetry && (
          <button
            className="px-3 py-1 text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    );
  }
  
  return null;
};

// Add a seat selection summary component
const SeatSelectionSummary = ({ 
  selectedSeats,
  totalSeats,
}: { 
  selectedSeats: string[];
  totalSeats: number;
}) => {
  const selectionPercentage = totalSeats > 0 ? Math.round((selectedSeats.length / totalSeats) * 100) : 0;
  
  return (
    <div className="bg-gray-900/30 backdrop-blur-sm rounded-lg p-3 mb-4 text-sm text-gray-50 dark:text-gray-200">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-xs uppercase tracking-wider">Seat Selection Summary</span>
        <span className="bg-blue-900/20 dark:bg-blue-900/50 px-2 py-1 rounded-md text-xs">
          Total Seats: {totalSeats}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-900/20 dark:bg-blue-900/40 rounded p-2">
          <span className="text-xs font-medium block mb-1 opacity-70">Selected Seats</span>
          <div className="flex items-end justify-between">
            <span className="text-lg font-bold">{selectedSeats.length}</span>
            <span className="text-xs opacity-70">{selectionPercentage}%</span>
          </div>
        </div>
        
        <div className="bg-amber-900/20 dark:bg-amber-900/40 rounded p-2">
          <span className="text-xs font-medium block mb-1 opacity-70">Remaining Seats</span>
          <div className="flex items-end justify-between">
            <span className="text-lg font-bold">{totalSeats - selectedSeats.length}</span>
            <span className="text-xs opacity-70">{100 - selectionPercentage}%</span>
          </div>
        </div>
      </div>
      
      {selectedSeats.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
          {selectedSeats.map(seat => (
            <Badge key={seat} variant="outline" className="bg-blue-950/30 text-xs border-blue-900/40 text-blue-100">
              {seat}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// Update the AllocationData type at the top of the file to include proper properties
interface AllocationData {
  yourSeats: number;
  partnerSeats: number;
  selectionPercentage: number;
  totalSelected: number;
}

// Main component implementation
const JetSeatVisualizer = forwardRef<JetSeatVisualizerRef, JetSeatVisualizerProps>(
  ({ 
    jet_id, 
    defaultLayout, 
    onChange, 
    initialSelection, 
    readOnly = false, 
    className,
    showControls = true,
    totalSeats,
    onError,
    showLegend = true,
    showSummary = true,
    customLayout,
    forceExactLayout,
    onAllocationChange,
    initialSelectionPercentage
  }, ref) => {
    // Default layout if none provided
    const [layout, setLayout] = useState<SeatLayout>({
      rows: 4,
      seatsPerRow: 3,
      layoutType: 'standard',
      totalSeats: totalSeats || 12
    });
    const [selectedSeats, setSelectedSeats] = useState<string[]>(initialSelection?.selectedSeats || []);
    const [skipPositions, setSkipPositions] = useState<string[]>([]);
    const [selectionPercentage, setSelectionPercentage] = useState(50);

    // State for loading layout data
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for visibility
    const [isVisible, setIsVisible] = useState(true);

    // Selection mode - default (tap) or drag
    const [selectionMode, setSelectionMode] = useState<'tap' | 'drag'>('tap');

    // State for grid calculations
    const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });
    const [seatSize, setSeatSize] = useState(0);

    // Add state for aisle display
    const [showAisle, setShowAisle] = useState(false);

    // Add a reference to avoid stale closures
    const isUpdatingRef = useRef<boolean | AllocationData>(false);
    const isMounted = useRef(true);

    // Add ref to track slider interaction
    const isSliderInteractingRef = useRef(false);

    // Refs for seats
    const seatsRef = useRef<HTMLDivElement[]>([]);
    const selectoRef = useRef<Selecto>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Add refs for directly manipulating the DOM to avoid React state updates
    const yourSeatsDisplayRef = useRef<HTMLSpanElement>(null);
    const partnerSeatsDisplayRef = useRef<HTMLSpanElement>(null);

    // Add debug logging - memoize to prevent dependency changes
    const debugLog = useCallback((message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[JetSeatVisualizer] ${message}`, data || '');
      }
    }, []);

    // Seat configuration calculation
    const calculateSeatConfiguration = useCallback((): SeatConfiguration => {
      const actualTotalSeats = layout?.totalSeats || 
        (layout?.rows !== undefined && layout?.seatsPerRow !== undefined ? 
          (layout.rows * layout.seatsPerRow - skipPositions.length) : 0);
      
      const yourCount = Math.ceil((selectionPercentage / 100) * selectedSeats.length);
      
      return {
        jet_id,
        selectedSeats,
        totalSeats: actualTotalSeats || 0,
        totalSelected: selectedSeats.length,
        selectionPercentage
      };
    }, [jet_id, layout, selectedSeats, skipPositions, selectionPercentage]);
    
    // Update parent component with selection changes
    const updateParentComponent = useCallback(() => {
      if (!onChange || isUpdatingRef.current) return;
      
      // Call the onChange callback with the current configuration
      onChange(calculateSeatConfiguration());
    }, [onChange, calculateSeatConfiguration]);
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      openVisualizer: () => setIsVisible(true),
      closeVisualizer: () => setIsVisible(false),
      getLayoutInfo: () => {
        const totalSeats = layout?.totalSeats || 
          (layout?.rows !== undefined && layout?.seatsPerRow !== undefined ? 
            layout.rows * layout.seatsPerRow - skipPositions.length : 0);
        
        return {
          totalSeats,
          rows: layout?.rows || 0,
          seatsPerRow: layout?.seatsPerRow || 0,
          layoutType: layout?.layoutType || 'standard',
          jet_id: jet_id
        };
      },
      selectSeats: (seatIds: string[]) => {
        setSelectedSeats(seatIds);
      },
      clearSelection: () => {
        setSelectedSeats([]);
      },
      setSelectionMode: (mode: 'tap' | 'drag') => {
        setSelectionMode(mode);
      }
    }));

    // Add a helper function to calculate optimal layouts
    const calculateOptimalLayout = useCallback((seats: number) => {
      let rows, seatsPerRow;
      
      // Determine optimal layout based on industry standards for private jets
      // Most private jets have 2-3 seats per row
      if (seats <= 6) {
        // For smaller jets, 2 seats per row is common
        seatsPerRow = 2;
        rows = Math.ceil(seats / seatsPerRow);
      } else if (seats <= 9) {
        // Mid-sized jets often have 3 seats per row
        seatsPerRow = 3;
        rows = Math.ceil(seats / seatsPerRow);
      } else if (seats === 10) {
        // For 10-seat jets, 5×2 layout is standard
        seatsPerRow = 2;
        rows = 5;
      } else if (seats <= 12) {
        // For 11-12 seats, typically 3 seats per row
        seatsPerRow = 3;
        rows = Math.ceil(seats / seatsPerRow);
      } else if (seats === 14) {
        // For 14-seat jets, 4×4 layout with 2 empty seats
        seatsPerRow = 4;
        rows = 4;
      } else {
        // For larger jets, 4 seats per row is common
        seatsPerRow = 4;
        rows = Math.ceil(seats / seatsPerRow);
      }
      
      // Create a new layout with the calculated dimensions
      const newLayout: SeatLayout = {
        rows,
        seatsPerRow,
        layoutType: 'standard',
        totalSeats: seats
      };
      
      setLayout(newLayout);
      setSkipPositions([]);
      
      // Log the change for debugging
      debugLog(`Calculated optimal layout for ${seats} seats: ${rows} rows × ${seatsPerRow} columns`);
      
      return newLayout;
    }, [debugLog]);

    // Helper function to generate all valid seat IDs
    const generateAllSeatIds = useCallback((): string[] => {
      if (!layout || layout.rows === undefined || layout.seatsPerRow === undefined) {
        return [];
      }

      const allSeatIds: string[] = [];
      
      for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.seatsPerRow; col++) {
          if (!skipPositions.includes(`${row},${col}`)) {
            allSeatIds.push(generateSeatId(row, col));
          }
        }
      }
      
      return allSeatIds;
    }, [layout, skipPositions]);

    // Use effect to select all seats when layout is loaded
    useEffect(() => {
      if (layout && !isLoading && selectedSeats.length === 0) {
        const allSeats = generateAllSeatIds();
        setSelectedSeats(allSeats);
      }
    }, [layout, isLoading, selectedSeats.length, generateAllSeatIds]);

    // Update the useEffect for handling layout changes based on totalSeats or customLayout
    useEffect(() => {
      if (customLayout && forceExactLayout) {
        console.log(`[JetSeatVisualizer] Using custom layout with ${customLayout.totalSeats} seats (forceExactLayout=${forceExactLayout})`);
        
        // Use the exact layout specified in customLayout prop with explicit totalSeats
        const updatedLayout: SeatLayout = {
          ...customLayout,
          // Ensure totalSeats is always defined when using customLayout
          totalSeats: customLayout.totalSeats || (customLayout.rows * customLayout.seatsPerRow)
        };
        
        setLayout(updatedLayout);
        debugLog('Using forced custom layout with explicit totalSeats:', updatedLayout);
        
        // Apply skip positions if provided
        if (customLayout.seatMap?.skipPositions) {
          setSkipPositions(customLayout.seatMap.skipPositions.map(pos => pos.join(',')));
          debugLog('Applied custom skip positions:', customLayout.seatMap.skipPositions);
        } else {
          setSkipPositions([]);
        }
        
        // Calculate grid dimensions based on the custom layout
        const baseGridWidth = customLayout.seatsPerRow * 60;
        const baseGridHeight = customLayout.rows * 60;
        
        setGridDimensions({
          width: baseGridWidth,
          height: baseGridHeight,
        });
        
        setSeatSize(60);
      } else if (totalSeats && totalSeats > 0 && !isLoading) {
        // Only apply this if we're not currently loading from the API
        // The API fetching useEffect will handle this case
        calculateOptimalLayout(totalSeats);
      }
    }, [totalSeats, customLayout, forceExactLayout, calculateOptimalLayout, debugLog, isLoading]);

    // Update the useEffect for fetching layout data
    useEffect(() => {
      if (customLayout) {
        debugLog('Custom layout provided. Skipping API fetch.');
        setIsLoading(false);
        return;
      }

      if (!jet_id) {
        debugLog('No jet_id provided. Using default layout.');
        // If totalSeats is provided, calculate optimal layout
        if (totalSeats && totalSeats > 0) {
          calculateOptimalLayout(totalSeats);
        }
        setIsLoading(false);
        return;
      }
      
      async function fetchLayoutData() {
        try {
          debugLog(`Fetching layout data for jet_id: ${jet_id}`);
          setIsLoading(true);
          
          // Define headers to ensure we get JSON
          const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          };
          
          // Fetch the seat layout from the API
          const response = await fetch(`/api/jets/${jet_id}/layout`, { 
            method: 'GET',
            headers
          });
          
          if (!response.ok) {
            throw new Error(`API returned ${response.status} ${response.statusText}`);
          }
          
          // Check content type
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            // First get the text to see what was returned
            const text = await response.text();
            
            // If it looks like HTML, it might be a login page or error
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
              throw new Error('Received HTML instead of JSON. You may need to authenticate.');
            }
            
            // Try parsing as JSON anyway
            try {
              const data = JSON.parse(text);
              processLayoutData(data);
            } catch (e) {
              throw new Error(`Received non-JSON response: ${text.substring(0, 100)}...`);
            }
          } else {
            // Parse JSON response
            const data = await response.json();
            processLayoutData(data);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          debugLog(`Error fetching layout: ${errorMsg}`);
          console.error('[JetSeatVisualizer] Error fetching layout:', err);
          
          // Set fallback layout if needed
          if (totalSeats && totalSeats > 0) {
            calculateOptimalLayout(totalSeats);
          }
          
          // Set error message
          setError(`Failed to load seat layout: ${errorMsg}`);
          
          // Notify parent component of error
          if (onError) {
            onError(errorMsg);
          }
        } finally {
          setIsLoading(false);
        }
      }
      
      // Process the fetched layout data
      function processLayoutData(data: any) {
        if (!data || !data.layout) {
          throw new Error('Invalid layout data received from API');
        }
        
        const apiLayout = data.layout;
        
        // Extract the layout data
        const extractedLayout: SeatLayout = {
          rows: apiLayout.rows || 0,
          seatsPerRow: apiLayout.seatsPerRow || 0,
          layoutType: apiLayout.layoutType || 'standard',
          totalSeats: apiLayout.totalSeats || 
            (apiLayout.rows * apiLayout.seatsPerRow - (apiLayout.skipPositions?.length || 0))
        };
        
        // Extract skip positions if provided
        const skipPositionsArray = apiLayout.skipPositions || [];
        const formattedSkipPositions = skipPositionsArray.map((pos: [number, number]) => 
          pos.join(',')
        );
        
        debugLog('Layout data fetched successfully', extractedLayout);
        debugLog('Skip positions:', formattedSkipPositions);
        
        // Update state with the extracted data
        setLayout(extractedLayout);
        setSkipPositions(formattedSkipPositions);
        
        // Calculate appropriate grid dimensions based on the layout
        const baseGridWidth = extractedLayout.seatsPerRow * 60;
        const baseGridHeight = extractedLayout.rows * 60;
        
        setGridDimensions({
          width: baseGridWidth,
          height: baseGridHeight,
        });
        
        setSeatSize(60);
      }
      
      // If there's no valid layout yet, fetch it
      if (!layout || !layout.rows || !layout.seatsPerRow) {
        fetchLayoutData();
      } else {
        setIsLoading(false);
      }
    }, [jet_id, debugLog, onError, totalSeats, calculateOptimalLayout, layout, customLayout]);

    // Function to format image URL 
    const formatImageUrl = (jet_id: string): string => {
      // Convert jet_id to a format suitable for image name
      const normalizedJetId = jet_id.toLowerCase().replace(/\s+/g, '-');
      
      // First try with the normalized ID - using gdyup paths
      const gdyupPath = `/images/gdyup/jets/${normalizedJetId}.jpg`;
      console.log(`[JetSeatVisualizer] Using image path: ${gdyupPath}`);
      
      return gdyupPath;
    };

    // GDYUP brand colors
    const GDYUP_COLORS = {
      primary: '#DAFF0D', // Neon yellow-green
      secondary: '#DC143C', // Crimson
      dark: '#121212',
      light: '#FFFFFF'
    };

    // Update the useEffect for handling allocation changes - ensure callbacks are triggered on both tap and slider
    useEffect(() => {
      if (isUpdatingRef.current || !onAllocationChange) return;
      
      // Calculate allocation
      const yourSeats = Math.ceil((selectionPercentage / 100) * selectedSeats.length);
      const partnerSeats = selectedSeats.length - yourSeats;
      
      // Trigger allocation change callback
      onAllocationChange({
        selectionPercentage,
        yourSeats,
        partnerSeats,
        totalSelected: selectedSeats.length
      });
      
    }, [selectionPercentage, selectedSeats.length, onAllocationChange]);

    // Update seat click handler to ensure allocation updates
    const handleSeatClick = useCallback((seatId: string) => {
      if (readOnly || selectionMode !== 'tap') return;
      
      // Use functional state update to prevent stale state issues
      setSelectedSeats(prev => {
        const isSelected = prev.includes(seatId);
        const newSelectedSeats = isSelected 
          ? prev.filter(id => id !== seatId) // Remove if already selected
          : [...prev, seatId]; // Add if not selected
          
        return newSelectedSeats;
      });
    }, [readOnly, selectionMode]);

    // Handle select all
    const handleSelectAll = () => {
      if (readOnly) return;
      
      // Generate all valid seat IDs (excluding skipped positions)
      const allSeatIds: string[] = [];
      
      if (layout?.rows !== undefined && layout?.seatsPerRow !== undefined) {
        for (let row = 0; row < layout.rows; row++) {
          for (let col = 0; col < layout.seatsPerRow; col++) {
            if (!skipPositions.includes(`${row},${col}`)) {
              allSeatIds.push(generateSeatId(row, col));
            }
          }
        }
      }
      
      setSelectedSeats(allSeatIds);
    };

    // Handle clear selection
    const handleClearSelection = () => {
      if (readOnly) return;
      setSelectedSeats([]);
    };

    // Toggle selection mode
    const toggleSelectionMode = () => {
      if (readOnly) return;
      setSelectionMode(prev => prev === 'tap' ? 'drag' : 'tap');
    };

    // Handle selecto selection
    const handleSelectoSelect = useCallback((e: { selected: (HTMLElement | SVGElement)[] }) => {
      if (readOnly || selectionMode !== 'drag') return;
      
      // Get selected elements
      const selectedElements = e.selected;
      
      // Extract seat IDs from selected elements
      const newSelectedSeats = selectedElements.map((el) => 
        el instanceof HTMLElement ? el.getAttribute('data-seat-id') : null
      ).filter((id: string | null): id is string => id !== null);
      
      // Update selected seats - use functional state update
      setSelectedSeats(prev => {
        // Create a Set for efficient lookups
        const prevSet = new Set(prev);
        const newSeatsToAdd = newSelectedSeats.filter(id => !prevSet.has(id));
        
        // Return new array with unique values
        return [...prev, ...newSeatsToAdd];
      });
    }, [readOnly, selectionMode]);
    
    // Add event listeners to prevent page swiping during slider interaction
    useEffect(() => {
      // Function to handle touchstart event on slider
      const handleTouchStart = (e: TouchEvent) => {
        isSliderInteractingRef.current = true;
        
        // Prevent default behavior to avoid page swipe
        e.preventDefault();
        
        // Notify parent that slider interaction has started
        window.dispatchEvent(new CustomEvent('sliderInteractionStart'));
        
        // Add a class to body to disable swiping
        document.body.classList.add('no-swipe');
      };
      
      // Function to handle touchend event on slider
      const handleTouchEnd = () => {
        isSliderInteractingRef.current = false;
        
        // Notify parent that slider interaction has ended
        window.dispatchEvent(new CustomEvent('sliderInteractionEnd'));
        
        // Remove the class from body
        document.body.classList.remove('no-swipe');
      };
      
      // Function to handle touchmove event on slider
      const handleTouchMove = (e: TouchEvent) => {
        if (isSliderInteractingRef.current) {
          // Prevent default behavior to avoid page swipe
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      // Function to handle mousedown event on slider
      const handleMouseDown = () => {
        isSliderInteractingRef.current = true;
        
        // Notify parent that slider interaction has started
        window.dispatchEvent(new CustomEvent('sliderInteractionStart'));
      };
      
      // Function to handle mouseup event on slider
      const handleMouseUp = () => {
        isSliderInteractingRef.current = false;
        
        // Notify parent that slider interaction has ended
        window.dispatchEvent(new CustomEvent('sliderInteractionEnd'));
      };
      
      // Get current reference to avoid closure issues
      const currentSliderRef = sliderRef.current;
      
      // Add event listeners if slider ref exists
      if (currentSliderRef) {
        currentSliderRef.addEventListener('touchstart', handleTouchStart, { passive: false });
        currentSliderRef.addEventListener('touchend', handleTouchEnd);
        currentSliderRef.addEventListener('touchmove', handleTouchMove, { passive: false });
        currentSliderRef.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
      }
      
      // Cleanup function
      return () => {
        if (currentSliderRef) {
          currentSliderRef.removeEventListener('touchstart', handleTouchStart);
          currentSliderRef.removeEventListener('touchend', handleTouchEnd);
          currentSliderRef.removeEventListener('touchmove', handleTouchMove);
          currentSliderRef.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mouseup', handleMouseUp);
        }
        document.body.classList.remove('no-swipe');
      };
    }, []);

    // Helper function to check if an image exists
    const checkImageExists = useCallback(async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch (error) {
        console.error(`Error checking image at ${url}:`, error);
        return false;
      }
    }, []);

    // Update dimensions when layout changes or component mounts
    useEffect(() => {
      // Add proper null checks for layout properties
      // Set grid dimensions based on the number of rows/columns
      const baseGridWidth = layout ? layout.seatsPerRow * 60 : 240;
      const baseGridHeight = layout ? layout.rows * 60 : 180;
      
      // Set grid dimensions
      setGridDimensions({
        width: baseGridWidth,
        height: baseGridHeight,
      });
      
      // Update seat size
      setSeatSize(40); // Standard size for seats
    }, [layout]);

    // For the slider component, memoize values to avoid re-renders
    const sliderValue = React.useMemo(() => [selectionPercentage], [selectionPercentage]);
    const sliderDefaultValue = React.useMemo(() => [50], []);

    // Debounce helper to prevent excessive updates
    const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

    // Update allocation using direct DOM manipulation with debounce
    const updateAllocation = useCallback(
      debounce((newSelectionPercentage?: number) => {
        if (!layout || !yourSeatsDisplayRef.current || !partnerSeatsDisplayRef.current) return;
        
        try {
          // Use the percentage from parameter or from the latest state
          const percentage = newSelectionPercentage !== undefined 
            ? newSelectionPercentage 
            : selectionPercentage;
          
          // Calculate number of seats based on the ratio
          const totalSelectedSeats = selectedSeats.length;
          const yourSeats = Math.round(totalSelectedSeats * (percentage / 100));
          const partnerSeats = totalSelectedSeats - yourSeats;
          
          // Create allocation data object with the correct property name
          const allocationData: AllocationData = {
            yourSeats,
            partnerSeats,
            selectionPercentage: percentage,
            totalSelected: selectedSeats.length
          };
          
          // Compare with previous data before calling
          const prevAllocationData = typeof isUpdatingRef.current === 'object' ? isUpdatingRef.current as AllocationData : null;
          const hasChanged = !prevAllocationData || 
            prevAllocationData.yourSeats !== allocationData.yourSeats ||
            prevAllocationData.partnerSeats !== allocationData.partnerSeats || 
            prevAllocationData.selectionPercentage !== allocationData.selectionPercentage;
          
          if (hasChanged) {
            // Store current allocation data for future comparison
            isUpdatingRef.current = allocationData;
            
            // Update DOM directly if display exists
            if (yourSeatsDisplayRef.current) yourSeatsDisplayRef.current.textContent = `${yourSeats}`;
            if (partnerSeatsDisplayRef.current) partnerSeatsDisplayRef.current.textContent = `${partnerSeats}`;
            
            // Notify parent component only if the values have changed
            if (onAllocationChange && hasChanged) {
              onAllocationChange(allocationData);
            }
          }
        } catch (error) {
          console.error('Error updating allocation:', error);
        } finally {
          // Reset only the boolean flag status, not the data
          setTimeout(() => {
            // Only set to false if current value is not an object (allocation data)
            if (typeof isUpdatingRef.current !== 'object') {
              isUpdatingRef.current = false;
            }
          }, 100);
        }
      }, 150),
      [layout, selectedSeats, selectionPercentage, onAllocationChange]
    );

    // Handle slider changes
    const handleSliderChange = useCallback((values: number[]) => {
      setSelectionPercentage(values[0]);
    }, []);

    // Change the useEffect that monitors selectedSeats
    useEffect(() => {
      // Only update if we have selected seats and we're not already updating
      if (selectedSeats.length > 0 && isUpdatingRef.current !== true) {
        // Use a timeout to ensure this doesn't fire too often
        const timer = setTimeout(() => {
          updateAllocation();
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [selectedSeats, updateAllocation]);

    // Update the useEffect for initializing selectionPercentage
    useEffect(() => {
      // Only set initial percentage if we're not already in an update cycle
      if (initialSelectionPercentage !== undefined && !isUpdatingRef.current) {
        setSelectionPercentage(initialSelectionPercentage);
      }
    }, [initialSelectionPercentage]);

    // Modify the renderSeatGrid function to correctly display the exact number of seats
    const renderSeatGrid = () => {
      if (!layout || layout.rows === undefined || layout.seatsPerRow === undefined) return null;
      
      // Get the actual total seats value we should render
      const actualTotalSeats = layout.totalSeats || totalSeats || 
        (layout.rows * layout.seatsPerRow - skipPositions.length);
      
      // Keep track of rendered seats count to ensure we don't exceed totalSeats
      let renderedSeatsCount = 0;
      
      // Create a grid with the calculated dimensions
      return (
        <div className="grid gap-2 p-4 relative w-full h-full" style={{
          gridTemplateColumns: `repeat(${layout.seatsPerRow}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
        }}>
          {Array.from({ length: layout.rows }).flatMap((_, row) =>
            Array.from({ length: layout.seatsPerRow }).map((_, col) => {
              // Skip if this position should be empty
              if (skipPositions.includes(`${row},${col}`)) {
                return null;
              }
              
              // Only render up to the actual total seats count
              if (renderedSeatsCount >= actualTotalSeats) {
                return null;
              }
              
              // Increment rendered seats counter
              renderedSeatsCount++;
              
              const seatId = generateSeatId(row, col);
              const isSelected = selectedSeats.includes(seatId);
              
              return (
                <div
                  key={`seat-${row}-${col}`}
                  ref={(el) => {
                    if (el) seatsRef.current[row * layout.seatsPerRow + col] = el;
                  }}
                  data-seat-id={seatId}
                  data-seat-number={renderedSeatsCount}
                  className={cn(
                    // Base styling
                    "flex items-center justify-center rounded-md cursor-pointer touch-manipulation transition-all transform hover:scale-105",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    // Dynamic classes based on state
                    isSelected
                      ? "bg-[#DAFF0D] border-2 border-[#DAFF0D] text-black shadow-md hover:bg-[#DAFF0D]/90"
                      : readOnly
                      ? "bg-gray-800 border border-gray-700 opacity-50 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500 hover:text-white shadow-sm",
                    readOnly ? "pointer-events-none" : ""
                  )}
                  onClick={() => handleSeatClick(seatId)}
                  style={{
                    width: `${seatSize * 0.8}px`,
                    height: `${seatSize * 0.8}px`,
                    margin: `${seatSize * 0.1}px`,
                    fontSize: `${seatSize * 0.4}px`,
                    fontWeight: "bold",
                  }}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`Seat ${seatId} ${isSelected ? 'Selected' : (readOnly ? 'Unavailable' : 'Available')}`}
                >
                  <span className="font-medium">{seatId}</span>
                </div>
              );
            })
          )}
        </div>
      );
    };

    // Add back the fetchSeatLayout function
    const fetchSeatLayout = useCallback(async () => {
      if (!jet_id) {
        console.error('No jet ID provided');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // If we have customLayout and forceExactLayout, use that directly and skip the API call
        if (customLayout && forceExactLayout) {
          const updatedLayout: SeatLayout = {
            ...customLayout,
            totalSeats: customLayout.totalSeats || (customLayout.rows * customLayout.seatsPerRow)
          };
          
          setLayout(updatedLayout);
          setIsLoading(false);
          setIsVisible(true);
          
          if (initialSelection && initialSelection.selectedSeats) {
            setSelectedSeats(initialSelection.selectedSeats);
          }
          
          debugLog('Using custom layout with forced exact settings, skipping API call', updatedLayout);
          return;
        }
        
        // GDYUP API path should use gdyup prefix instead of jetshare
        const apiUrl = `/api/gdyup/jets/${jet_id}/layout`;
        console.log(`[JetSeatVisualizer] Fetching layout from: ${apiUrl}`);
        
        // Otherwise proceed with API call for layout
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // If totalSeats is explicitly provided, use that to override the API response
        if (totalSeats && totalSeats > 0) {
          // Calculate optimal dimensions
          let rows, seatsPerRow;
          
          // Optimize for common jet layouts with special case for 10 seats
          if (totalSeats === 10) {
            // Special case for Gulfstream G280
            rows = 5;
            seatsPerRow = 2;
            console.log('[JetSeatVisualizer] Using special 5x2 layout for 10 seats');
          } else if (totalSeats <= 4) {
            rows = 2; 
            seatsPerRow = 2;
          } else if (totalSeats <= 6) {
            rows = 2;
            seatsPerRow = 3;
          } else if (totalSeats <= 9) {
            rows = 3;
            seatsPerRow = 3;
          } else if (totalSeats <= 12) {
            rows = 3;
            seatsPerRow = 4;
          } else if (totalSeats <= 16) {
            rows = 4;
            seatsPerRow = 4;
          } else {
            // For larger configurations
            rows = Math.ceil(totalSeats / 4);
            seatsPerRow = 4;
          }
          
          // Update the layout with optimal dimensions
          const updatedLayout = {
            rows,
            seatsPerRow,
            layoutType: 'custom' as const,
            totalSeats
          };
          
          setLayout(updatedLayout);
          debugLog('Applied optimized layout for totalSeats:', updatedLayout);
        } else if (data.seatLayout) {
          // Use the API-provided layout if no totalSeats specified
          setLayout(data.seatLayout);
          debugLog('Applied layout from API:', data.seatLayout);
        }
        
        // Save skip positions if available
        if (data.seatLayout?.seatMap?.skipPositions) {
          setSkipPositions(data.seatLayout.seatMap.skipPositions);
          debugLog('Applied skip positions from API:', data.seatLayout.seatMap.skipPositions);
        } else {
          setSkipPositions([]);
        }
        
        // Calculate grid dimensions based on layout
        const baseGridWidth = layout ? layout.seatsPerRow * 60 : 240;
        const baseGridHeight = layout ? layout.rows * 60 : 180;
        
        setGridDimensions({
          width: baseGridWidth,
          height: baseGridHeight,
        });
        
        // Calculate seat size
        setSeatSize(60);
        
        // If initial selection is provided, set it
        if (initialSelection && initialSelection.selectedSeats) {
          setSelectedSeats(initialSelection.selectedSeats);
        }
        
        // Auto-open the visualizer if it should be open by default
        setIsVisible(true);
        
        // Success!
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching seat layout:', err);
        setError(err instanceof Error ? err.message : String(err));
        
        // Even on error, we need to show something - use totalSeats if provided
        if (totalSeats && totalSeats > 0) {
          // Create a default layout
          let rows, seatsPerRow;
          
          // Similar logic to the success case
          if (totalSeats === 10) {
            rows = 5;
            seatsPerRow = 2;
          } else if (totalSeats <= 4) {
            rows = 2; 
            seatsPerRow = 2;
          } else if (totalSeats <= 6) {
            rows = 2;
            seatsPerRow = 3;
          } else if (totalSeats <= 9) {
            rows = 3;
            seatsPerRow = 3;
          } else if (totalSeats <= 12) {
            rows = 3;
            seatsPerRow = 4;
          } else {
            rows = Math.ceil(totalSeats / 4);
            seatsPerRow = 4;
          }
          
          // Create fallback layout
          const fallbackLayout: SeatLayout = {
            rows,
            seatsPerRow,
            layoutType: 'standard',
            totalSeats
          };
          
          setLayout(fallbackLayout);
          setSkipPositions([]);
          
          console.log(`[JetSeatVisualizer] Using fallback layout for ${totalSeats} seats:`, fallbackLayout);
          
          // Calculate grid dimensions
          setGridDimensions({
            width: fallbackLayout.seatsPerRow * 60,
            height: fallbackLayout.rows * 60,
          });
          
          setSeatSize(60);
        }
        
        if (onError) {
          onError(err instanceof Error ? err : String(err));
        }
        
        setIsLoading(false);
      }
    }, [jet_id, customLayout, forceExactLayout, initialSelection, layout.rows, layout.seatsPerRow, onError, totalSeats, debugLog]);

    // Calculate allocation for display in the component UI
    const calculatedYourSeats = Math.ceil((selectionPercentage / 100) * selectedSeats.length);
    const calculatedPartnerSeats = selectedSeats.length - calculatedYourSeats;

    // Main render content with debugging info
    const renderContent = () => {
      // Show loading spinner while loading
      if (isLoading) {
        return (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-[#DAFF0D] border-t-transparent"></div>
          </div>
        );
      }
      
      // Show error message if there's an error
      if (error) {
        return (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <AlertTriangle className="h-8 w-8 text-[#DC143C]" />
            <p className="text-sm text-[#DC143C]">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              size="sm" 
              variant="outline" 
              className="mt-2 text-xs border-[#DAFF0D] text-[#DAFF0D] hover:bg-[#DAFF0D]/10"
            >
              Try Again
            </Button>
          </div>
        );
      }
      
      const actualTotalSeats = totalSeats || layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
      
      return (
        <div className="p-2 relative">
          {/* Add debug info in development mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-2 left-2 bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-md z-20 border border-amber-700/50 text-[8px] text-amber-300">
              {`seats: ${actualTotalSeats}, grid: ${layout.rows}×${layout.seatsPerRow}, selected: ${selectedSeats.length}, allocation: ${selectionPercentage}%`}
            </div>
          )}
          
          {/* Selection summary with GDYUP colors */}
          {showSummary !== false && (
            <div className="absolute top-2 right-2 bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full z-10 border border-gray-700 shadow-lg">
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 rounded-full bg-[#DAFF0D] mr-1.5"></div>
                <span className="text-[#DAFF0D] font-medium">{selectedSeats.length}</span>
                <span className="text-gray-300 mx-1">of</span>
                <span className="text-white font-medium">{actualTotalSeats}</span>
                <span className="text-gray-300 ml-1">seats selected</span>
                {selectedSeats.length > 0 && (
                  <>
                    <span className="mx-1 text-gray-500">|</span>
                    <span className="text-[#DAFF0D] font-medium">{calculatedYourSeats}</span>
                    <span className="text-gray-300 mx-1">:</span>
                    <span className="text-[#DC143C] font-medium">{calculatedPartnerSeats}</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Legend with GDYUP colors */}
          {showLegend !== false && (
            <div className="absolute bottom-2 right-2 left-2 bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg z-10 border border-gray-700 shadow-lg">
              <div className="flex items-center justify-around text-xs">
                <div className="flex items-center mr-2">
                  <div className="w-4 h-4 rounded-sm bg-[#DAFF0D] border border-[#DAFF0D] mr-1.5 opacity-80"></div>
                  <span className="text-[#DAFF0D] font-medium">Selected</span>
                </div>
                <div className="flex items-center mr-2">
                  <div className="w-4 h-4 rounded-sm bg-gray-700 border border-gray-600 mr-1.5 opacity-80"></div>
                  <span className="text-gray-300 font-medium">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-sm bg-gray-800 border border-gray-700 mr-1.5 opacity-50"></div>
                  <span className="text-gray-400 font-medium">Unavailable</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Seat map container with layout info */}
          <div 
            ref={containerRef}
            className="relative mx-auto bg-gradient-to-b from-gray-800 to-gray-950 rounded-lg overflow-hidden touch-manipulation border border-gray-700 shadow-inner"
            style={{ 
              width: `${gridDimensions.width}px`, 
              height: `${gridDimensions.height + 24}px`,
              maxWidth: '100%',
              maxHeight: '70vh'
            }}
            aria-label="Jet Seat Map"
          >
            {/* Simplified layout info bar at the top */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 flex justify-between items-center px-3 z-10 text-xs">
              <div className="text-gray-300 font-medium">{layout.rows} × {layout.seatsPerRow}</div>
              <div className="text-[#DAFF0D]">
                {selectedSeats.length} of {actualTotalSeats} selected
              </div>
            </div>
            
            {/* Render the seat grid */}
            {renderSeatGrid()}
            
            {/* Selecto component for drag selection */}
            {!readOnly && selectionMode === 'drag' && containerRef.current && (
              <Selecto
                ref={selectoRef}
                container={containerRef.current}
                selectableTargets={['[data-seat-id]']}
                selectByClick={false}
                selectFromInside={false}
                toggleContinueSelect={['shift']}
                hitRate={0}
                onSelect={handleSelectoSelect}
                ratio={0}
              />
            )}
          </div>
          
          {/* Add allocation controls with GDYUP colors */}
          {showControls && !readOnly && selectedSeats.length > 0 && (
            <div className="mt-3 px-3 py-2 bg-gray-800/70 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#DAFF0D]">Your Seats: {calculatedYourSeats}</span>
                <span className="text-white">{selectionPercentage}%</span>
                <span className="text-[#DC143C]">Partner Seats: {calculatedPartnerSeats}</span>
              </div>
              
              <Slider
                value={[selectionPercentage]}
                onValueChange={(values) => setSelectionPercentage(values[0])}
                min={0}
                max={100}
                step={1}
                className="my-2"
              />
              
              <div className="flex justify-between mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={toggleSelectionMode}
                  className="h-7 text-xs border-[#DAFF0D]/50 text-[#DAFF0D] hover:bg-[#DAFF0D]/10"
                >
                  {selectionMode === 'tap' ? 
                    <><MousePointerClick className="h-3 w-3 mr-1" /> Tap</> : 
                    <><MousePointer className="h-3 w-3 mr-1" /> Drag</>
                  }
                </Button>
                
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSelectAll}
                  className="h-7 text-xs bg-[#DAFF0D] text-black hover:bg-[#DAFF0D]/90"
                >
                  <CheckCheck className="h-3 w-3 mr-1" /> Select All
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    };

    // If not visible or there's an error, render minimized state
    if (!isVisible || error) {
      return (
        <div className={cn("bg-gray-900/30 backdrop-blur-md rounded-lg p-4 seat-visualizer-container", className)}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white seat-visualizer-header">Seat Configuration</h3>
            <button 
              onClick={() => setIsVisible(true)}
              className="px-4 py-1.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-100 rounded-md text-sm seat-control-button"
            >
              Show Seat Selector
            </button>
          </div>
          <StatusMessage isLoading={isLoading} error={error} onRetry={() => window.location.reload()} />
        </div>
      );
    }

    return renderContent();
  }
);

JetSeatVisualizer.displayName = 'JetSeatVisualizer';

export default JetSeatVisualizer; 

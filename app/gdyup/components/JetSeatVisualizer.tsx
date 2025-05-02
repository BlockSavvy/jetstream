'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback, useMemo } from 'react';
import Selecto from 'react-selecto';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import React from 'react';
import { MousePointer, CheckCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';

// Define a local SeatConfig type instead of importing from Prisma
export type SeatConfig = Record<string, boolean>;

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
  onChange?: (selectedSeats: string[]) => void;
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
  seatConfig: SeatConfig;
  selectionDisabled?: boolean;
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
  clearSelection: () => void;
  setSelectionMode: (mode: 'tap' | 'drag') => void;
  getAllSeatIds: () => string[];
  selectSeatsByCount: (count: number) => void;
};

// Helper function to generate seat IDs
const generateSeatId = (row: number, col: number) => {
  const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
  return `${rowLetter}${col + 1}`;
};

// Update the AllocationData type
interface AllocationData {
  yourSeats: number;
  partnerSeats: number;
  selectionPercentage: number;
  totalSelected: number;
}

// Define calculateAllocation outside the component or memoize it if it uses props/state
const calculateAllocation = (percentage: number, totalSelectedSeats: number): AllocationData => {
  const yourSeats = Math.ceil((percentage / 100) * totalSelectedSeats);
  const partnerSeats = totalSelectedSeats - yourSeats;
  return { yourSeats, partnerSeats, selectionPercentage: percentage, totalSelected: totalSelectedSeats };
};

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
    showSummary = false,
    customLayout,
    forceExactLayout,
    seatConfig,
    selectionDisabled = false,
  }, ref) => {
    // Default layout if none provided
    const [layout, setLayout] = useState<SeatLayout>(() => {
        // Initialize layout based on totalSeats or default
        const initialTotalSeats = totalSeats || initialSelection?.totalSeats || 12;
        return {
          rows: 4, // Default, will be recalculated
          seatsPerRow: 3, // Default, will be recalculated
          layoutType: 'standard',
          totalSeats: initialTotalSeats
        };
    });
    // Internal state for displaying selection - now the primary source
    const [selectedSeats, setSelectedSeats] = useState<string[]>(initialSelection?.selectedSeats || []);
    const [skipPositions, setSkipPositions] = useState<string[]>([]);

    // State for loading layout data
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for visibility
    const [isVisible, setIsVisible] = useState(true);

    // Selection mode - default (tap) or drag
    const [selectionMode, setSelectionMode] = useState<'tap' | 'drag'>('tap');

    // Add refs to avoid stale closures
    const isMounted = useRef(true);

    // Refs for seats
    const seatsRef = useRef<HTMLDivElement[]>([]);
    const selectoRef = useRef<Selecto>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Add debug logging - memoize to prevent dependency changes
    const debugLog = useCallback((message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[JetSeatVisualizer] ${message}`, data || '');
      }
    }, []);

    // Generate all valid seat IDs - memoized for performance
    const generateAllSeatIds = useCallback((): string[] => {
      if (!layout || layout.rows === undefined || layout.seatsPerRow === undefined) {
        console.warn('[Visualizer generateAllSeatIds] Layout not ready:', layout);
        return [];
      }

      const allSeatIds: string[] = [];
      let generatedCount = 0;
      console.log(`[Visualizer generateAllSeatIds] Generating for layout: ${layout.rows}x${layout.seatsPerRow}, Skips:`, skipPositions);

      for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.seatsPerRow; col++) {
          const posString = `${row},${col}`;
          if (!skipPositions.includes(posString)) {
            const seatId = generateSeatId(row, col);
            allSeatIds.push(seatId);
            generatedCount++;
          } else {
            console.log(`[Visualizer generateAllSeatIds] Skipping position: ${posString}`);
          }
        }
      }

      console.log(`[Visualizer generateAllSeatIds] Generated ${generatedCount} IDs:`, allSeatIds);
      return allSeatIds;
    }, [layout, skipPositions]);

    // Update parent component with selection changes - debounced for performance
    const updateParentComponent = useMemo(() => debounce(() => {
      if (!onChange) return;
      debugLog('Notifying parent onChange with selectedSeats:', selectedSeats);
      // Call the onChange callback with the current internal selected seats
      onChange(selectedSeats);
    }, 100), [onChange, selectedSeats, debugLog]);

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
      clearSelection: () => {
        setSelectedSeats([]);
        // Also notify parent immediately when cleared via ref
        if (onChange) {
            onChange([]);
        }
      },
      setSelectionMode: (mode: 'tap' | 'drag') => {
        setSelectionMode(mode);
      },
      getAllSeatIds: generateAllSeatIds,
      selectSeatsByCount: (count: number) => {
        debugLog(`[Visualizer selectSeatsByCount] Selecting ${count} seats.`);
        const allValidSeatIds = generateAllSeatIds();
        const validatedCount = Math.max(0, Math.min(allValidSeatIds.length, count));
        const seatsToSelect = allValidSeatIds.slice(0, validatedCount);
        setSelectedSeats(seatsToSelect);
        // Trigger onChange to notify parent of the new selection state
        if (onChange) {
          onChange(seatsToSelect);
        }
      }
    }));

    // Calculate optimal layout function - memoized
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

    // Update layout based on totalSeats or customLayout
    useEffect(() => {
      if (customLayout && forceExactLayout) {
        debugLog(`Using custom layout with ${customLayout.totalSeats} seats (forceExactLayout=${forceExactLayout})`);
        
        // Use the exact layout specified in customLayout prop with explicit totalSeats
        const updatedLayout: SeatLayout = {
          ...customLayout,
          // Ensure totalSeats is always defined when using customLayout
          totalSeats: customLayout.totalSeats || (customLayout.rows * customLayout.seatsPerRow)
        };
        
        setLayout(updatedLayout);
        
        // Apply skip positions if provided
        if (customLayout.seatMap?.skipPositions) {
          setSkipPositions(customLayout.seatMap.skipPositions.map(pos => pos.join(',')));
        } else {
          setSkipPositions([]);
        }
      } else if (totalSeats && totalSeats > 0 && !isLoading) {
        // Only apply this if we're not currently loading from the API
        calculateOptimalLayout(totalSeats);
      }
    }, [totalSeats, customLayout, forceExactLayout, calculateOptimalLayout, debugLog, isLoading]);

    // Fetch layout data from API
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
        
        // Update state with the extracted data
        setLayout(extractedLayout);
        setSkipPositions(formattedSkipPositions);
        // Automatically select seats based on initial controlled prop after layout is loaded
        if (selectedSeats.length > 0) {
            setSelectedSeats(selectedSeats);
        } else {
            // Handle default selection logic if needed (e.g., select all)
            // Example: Select all if autoSelectAllSeats was intended (now handled by parent)
             const allSeatIds = generateAllSeatIdsBasedOnLayout(extractedLayout, formattedSkipPositions);
             if (allSeatIds.length > 0) {
                // If parent provided empty array, perhaps it means "select all" or "select based on ratio" initially.
                // For now, we reflect the controlled prop. Parent needs to send the desired initial state.
                setSelectedSeats(selectedSeats);
             }
        }
      }
      
      // Helper to generate seats based on a layout object directly
      const generateAllSeatIdsBasedOnLayout = (l: SeatLayout, skips: string[]): string[] => {
          const allIds: string[] = [];
          if (!l || l.rows === undefined || l.seatsPerRow === undefined) return [];
          for (let row = 0; row < l.rows; row++) {
              for (let col = 0; col < l.seatsPerRow; col++) {
                  if (!skips.includes(`${row},${col}`)) {
                      allIds.push(generateSeatId(row, col));
                  }
              }
          }
          return allIds;
      };
      
      // If there's no valid layout yet, fetch it
      if (!layout || !layout.rows || !layout.seatsPerRow) {
        fetchLayoutData();
      } else {
        setIsLoading(false);
      }
    }, [jet_id, debugLog, onError, totalSeats, calculateOptimalLayout, layout, customLayout]);

    // Handle seat click with proper syncing
    const handleSeatClick = useCallback((seatId: string) => {
      if (readOnly || selectionMode !== 'tap') return;

      // *** ADD VALIDATION ***
      // Ensure the clicked seat ID is actually part of the current valid layout
      const allValidSeatIds = generateAllSeatIds(); // Get current valid seats
      if (!allValidSeatIds.includes(seatId)) {
        console.warn(`[Visualizer handleSeatClick] Clicked on invalid seat ID: ${seatId}. Ignoring.`);
        return; // Don't process clicks on invalid/skipped seats
      }
      // *** END VALIDATION ***

      console.log(`[Visualizer handleSeatClick] Clicked seat: ${seatId}`);
      
      // Calculate the next state immediately
      const newSelectedSeats = selectedSeats.includes(seatId)
        ? selectedSeats.filter(id => id !== seatId)
        : [...selectedSeats, seatId];
      
      // Update internal state
      setSelectedSeats(newSelectedSeats);
      console.log(`[Visualizer handleSeatClick] New internal selectedSeats state:`, newSelectedSeats);

      // Call onChange prop directly with the new state
      if (onChange) {
          console.log(`[Visualizer handleSeatClick] Calling onChange prop with:`, newSelectedSeats);
          onChange(newSelectedSeats);
      }
    }, [readOnly, selectionMode, selectedSeats, onChange, generateAllSeatIds]); // Add onChange and generateAllSeatIds dependencies

    // Handle selecto selection
    const handleSelectoSelect = useCallback((e: { selected: (HTMLElement | SVGElement)[] }) => {
      if (readOnly || selectionMode !== 'drag') return;

      const selectedElements = e.selected;
      const newSelectedSeatIds = selectedElements.map((el) =>
        el instanceof HTMLElement ? el.getAttribute('data-seat-id') : null
      ).filter((id: string | null): id is string => id !== null);

      // Update internal state ONLY based on the *newly* dragged selection
      // This assumes Selecto gives the total selection in the event,
      // If it gives only the *added* selection, logic needs adjustment.
      // Assuming e.selected is the *complete* list of selected elements in the drag area:
      setSelectedSeats(newSelectedSeatIds);
      console.log(`[Visualizer handleSelectoSelect] New internal selectedSeats state:`, newSelectedSeatIds);

      // Call onChange prop directly with the new state from the drag
      if (onChange) {
          console.log(`[Visualizer handleSelectoSelect] Calling onChange prop with:`, newSelectedSeatIds);
          onChange(newSelectedSeatIds);
      }
    }, [readOnly, selectionMode, onChange]); // Add onChange dependency

    // Select all seats functionality
    const handleSelectAll = useCallback(() => {
      if (readOnly) return;
      
      // Generate all valid seat IDs
      const allSeatIds = generateAllSeatIds();
      setSelectedSeats(allSeatIds);
      // Notify parent immediately
      if (onChange) {
        onChange(allSeatIds);
      }
    }, [readOnly, generateAllSeatIds, onChange]);

    // Clear selection with proper syncing
    const handleClearSelection = useCallback(() => {
      if (readOnly) return;
      
      setSelectedSeats([]);
      // Notify parent immediately
      if (onChange) {
        onChange([]);
      }
    }, [readOnly, onChange]);

    // Toggle selection mode
    const toggleSelectionMode = useCallback(() => {
      if (readOnly) return;
      setSelectionMode(prev => prev === 'tap' ? 'drag' : 'tap');
    }, [readOnly]);

    // Initialize with default seat selection on load
    useEffect(() => {
      // Skip if we're still loading layout
      if (isLoading) return;
      // Skip if layout is not ready
      if (!layout || layout.rows === undefined || layout.seatsPerRow === undefined) return;

      // The initial selection is now primarily driven by the controlledSelectedSeats prop
      // and the useEffect that syncs it. We might keep the initialSelection prop
      // just for the *very first* render before parent calculates controlled seats,
      // but the controlled prop takes precedence.
      if (JSON.stringify(selectedSeats) !== JSON.stringify(selectedSeats)) {
         debugLog('Aligning initial selected seats with controlled prop');
         setSelectedSeats(selectedSeats);
      }

    }, [
      layout,
      isLoading,
      selectedSeats,
      debugLog
      // Removed initialSelection, autoSelectAllSeats, totalSeats, skipPositions.length, setInitialSeatsByRatio
    ]);

    // Handle special case for 14-seat layout
    useEffect(() => {
      // Handle special case for 14-seat layout
      if (!layout) return;
      
      const actualTotalSeats = totalSeats || 
        layout?.totalSeats || 
        (layout?.rows !== undefined && layout?.seatsPerRow !== undefined ? 
          layout.rows * layout.seatsPerRow : 0);
      
      // Only modify skipPositions if we have a 4x4 layout but need 14 seats
      // This is specifically for the Dassault Falcon 900LX issue
      if (actualTotalSeats === 14 && layout?.rows === 4 && layout?.seatsPerRow === 4 && 
          (jet_id === '6d6250bc-4903-4656-b1c4-3851af747988' || jet_id.includes('dassault') || jet_id.includes('falcon'))) {
        debugLog("Setting up 14-seat layout for Falcon with skipped positions D3 and D4");
        setSkipPositions(['3,2', '3,3']); // Skip D3 and D4 positions
      }
    }, [layout?.rows, layout?.seatsPerRow, totalSeats, layout?.totalSeats, jet_id, debugLog]);

    // *** ADD LOGGING HERE ***
    console.log("[Visualizer Render] Rendering with internal selectedSeats:", selectedSeats);

    // Get actual total seats accounting for skipped positions - Calculate here for use in JSX
    const actualTotalSeats = totalSeats ||
      layout?.totalSeats ||
      (layout?.rows !== undefined && layout?.seatsPerRow !== undefined ?
        layout.rows * layout.seatsPerRow - skipPositions.length : 0);

    // Improved render function for seat grid with GDY UP aesthetics
    const renderSeatGrid = () => {
      if (!layout || layout.rows === undefined || layout.seatsPerRow === undefined) return null;
      
      // Keep track of rendered seats count
      let renderedSeatsCount = 0;
      
      return (
        <div className="grid gap-2 p-4 w-full" style={{
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
                    // Base styling - enhanced with GDY UP aesthetics
                    "flex items-center justify-center py-3 rounded-lg select-none transition-all duration-150",
                    // Dynamic classes based on state
                    isSelected
                      ? "bg-[#DAFF0D] text-black font-bold shadow-[0_0_8px_rgba(218,255,13,0.4)]"
                      : readOnly
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : "bg-gray-700 text-gray-300 cursor-pointer hover:bg-gray-600 hover:shadow-md",
                    readOnly ? "pointer-events-none" : ""
                  )}
                  onClick={() => handleSeatClick(seatId)}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`Seat ${seatId} ${isSelected ? 'Selected' : (readOnly ? 'Unavailable' : 'Available')}`}
                >
                  <span className="text-lg font-medium">{seatId}</span>
                </div>
              );
            })
          )}
        </div>
      );
    };

    // Main render
    return (
      <div className={cn('relative rounded-lg overflow-hidden bg-gray-900', className)}>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-[#DAFF0D] border-t-transparent"></div>
          </div>
        ) : error ? (
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
        ) : (
          <>
            {/* Seat allocation summary - only show if explicitly requested */}
            {showSummary && (
              <div className="grid grid-cols-2 divide-x divide-gray-700/50">
                <div className="bg-gray-900 px-4 py-3">
                  <div className="text-left">
                    <div className="text-sm text-gray-300 mb-1">Selected Seats</div>
                    <div className="flex items-baseline">
                      {/* Display total selected count */}
                      <span className="text-3xl font-bold text-white">{selectedSeats.length}</span>
                      <span className="text-sm text-gray-400 ml-1.5">seats</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 px-4 py-3">
                   <div className="text-left">
                     <div className="text-sm text-gray-300 mb-1">Total Seats</div>
                     <div className="flex items-baseline">
                       <span className="text-3xl font-bold text-white">{actualTotalSeats}</span>
                       <span className="text-sm text-gray-400 ml-1.5">seats</span>
                     </div>
                   </div>
                </div>
              </div>
            )}
            
            {/* Seat selection legend */}
            {showLegend && (
              <div className="flex items-center gap-4 p-2 px-4 bg-gray-800/90">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-[#DAFF0D]"></div>
                  <span className="text-xs text-white">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-gray-700"></div>
                  <span className="text-xs text-white">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-gray-800"></div>
                  <span className="text-xs text-white">Unavailable</span>
                </div>
              </div>
            )}
            
            {/* Seat grid */}
            <div 
              ref={containerRef}
              className="relative mx-auto bg-gray-900 p-2"
              style={{ 
                width: '100%',
                minHeight: '280px',
              }}
            >
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
          </>
        )}
      </div>
    );
  }
);

JetSeatVisualizer.displayName = 'JetSeatVisualizer';

export default JetSeatVisualizer; 

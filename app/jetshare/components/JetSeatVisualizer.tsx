'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import Selecto from 'react-selecto';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

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
    forceExactLayout
  }, ref) => {
    // Default layout if none provided
    const [layout, setLayout] = useState<SeatLayout>(
      defaultLayout || { rows: 6, seatsPerRow: 4, layoutType: 'standard' }
    );

    // State for loading layout data
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for visibility
    const [isVisible, setIsVisible] = useState(true);

    // State for seat selection
    const [selectedSeats, setSelectedSeats] = useState<string[]>(
      initialSelection?.selectedSeats || []
    );

    // Selection mode - default (tap) or drag
    const [selectionMode, setSelectionMode] = useState<'tap' | 'drag'>('tap');

    // State for grid calculations
    const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });
    const [seatSize, setSeatSize] = useState(0);

    // Add state for aisle display
    const [showAisle, setShowAisle] = useState(false);

    // Flag for preventing update loops
    const isUpdatingRef = useRef(false);

    // Refs for seats
    const seatsRef = useRef<HTMLDivElement[]>([]);
    const selectoRef = useRef<Selecto>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Add state to track seats that should be skipped (not displayed)
    const [skipPositions, setSkipPositions] = useState<number[][]>([]);

    // Calculate seat allocation
    const calculateSeatConfiguration = useCallback((): SeatConfiguration => {
      const actualTotalSeats = layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
      const selectionPercentage = actualTotalSeats > 0 ? Math.round((selectedSeats.length / actualTotalSeats) * 100) : 0;
      
      return {
        jet_id,
        selectedSeats,
        totalSeats: actualTotalSeats,
        totalSelected: selectedSeats.length,
        selectionPercentage
      };
    }, [jet_id, layout, selectedSeats, skipPositions]);

    // Function to check if a position should be skipped
    const isSkippedPosition = useCallback((row: number, col: number): boolean => {
      return skipPositions.some(pos => pos[0] === row && pos[1] === col);
    }, [skipPositions]);

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
        const totalSeats = layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
        return {
          totalSeats,
          rows: layout.rows,
          seatsPerRow: layout.seatsPerRow,
          layoutType: layout.layoutType,
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

    // Add debug logging - memoize to prevent dependency changes
    const debugLog = useCallback((message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[JetSeatVisualizer] ${message}`, data || '');
      }
    }, []);

    // Handle seat click
    const handleSeatClick = useCallback((seatId: string) => {
      if (readOnly || selectionMode !== 'tap') return;
      
      // Use functional state update to prevent stale state issues
      setSelectedSeats(prev => {
        const isSelected = prev.includes(seatId);
        return isSelected 
          ? prev.filter(id => id !== seatId) // Remove if already selected
          : [...prev, seatId]; // Add if not selected
      });
    }, [readOnly, selectionMode]);

    // Handle select all
    const handleSelectAll = () => {
      if (readOnly) return;
      
      // Generate all valid seat IDs (excluding skipped positions)
      const allSeatIds: string[] = [];
      
      for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.seatsPerRow; col++) {
          if (!isSkippedPosition(row, col)) {
            allSeatIds.push(generateSeatId(row, col));
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

    /**
     * Fetches seat layout data based on the jet_id
     * Tries to get from custom layouts first, then falls back to jet interior data
     */
    const fetchLayoutData = useCallback(async () => {
      if (!jet_id) {
        debugLog('No jet ID provided');
        return;
      }

      setIsLoading(true);
      setError(null);
      debugLog(`Fetching layout for jet ID: ${jet_id}`);

      try {
        // First try to get custom layout from jet_seat_layouts table
        const layoutResponse = await fetch(`/api/jetshare/seats/layout/${jet_id}`);
        
        // Check if we got a custom layout
        if (layoutResponse.ok) {
          const layoutData = await layoutResponse.json();
          
          if (layoutData && layoutData.layout) {
            debugLog(`Found custom layout for jet ID: ${jet_id}`);
            setLayout(layoutData.layout);
            setIsLoading(false);
            return;
          }
        }
        
        // If no custom layout, fall back to jet data API
        const response = await fetch(`/api/jets/${jet_id}?include_layout=true`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch jet layout data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.seatLayout) {
          // Use the provided seat layout
          debugLog(`Using seat layout from jet data API`);
          setLayout(data.seatLayout);
        } else if (data && data.interior && data.interior.seats) {
          // Derive a layout from the interior data
          const seats = parseInt(data.interior.seats, 10);
          const cabinConfig = data.interior.cabin_configuration || 'standard';
          // Ensure layoutType is a valid type
          const layoutType = (cabinConfig === 'luxury' || cabinConfig === 'custom') 
            ? cabinConfig as 'luxury' | 'custom'
            : 'standard';
          
          // Determine reasonable rows/columns based on total seats and layout type
          let rows, seatsPerRow;
          
          if (layoutType === 'luxury') {
            // Luxury layouts typically have fewer seats per row
            seatsPerRow = 2;
            rows = Math.ceil(seats / seatsPerRow);
          } else {
            // Standard layouts typically have 3-4 seats per row
            seatsPerRow = seats <= 12 ? 3 : 4;
            rows = Math.ceil(seats / seatsPerRow);
          }
          
          const derivedLayout: SeatLayout = {
            rows,
            seatsPerRow,
            layoutType,
            totalSeats: seats,
            seatMap: {
              skipPositions: []
            }
          };
          
          debugLog(`Derived layout from interior data: ${JSON.stringify(derivedLayout)}`);
          setLayout(derivedLayout);
        } else if (data && data.jet && data.jet.capacity) {
          // Last resort: derive from jet capacity
          const seats = parseInt(data.jet.capacity, 10);
          const layoutType: 'standard' = 'standard';
          
          // Standard configuration based on capacity
          const seatsPerRow = seats <= 8 ? 2 : (seats <= 15 ? 3 : 4);
          const rows = Math.ceil(seats / seatsPerRow);
          
          const derivedLayout: SeatLayout = {
            rows,
            seatsPerRow,
            layoutType,
            totalSeats: seats,
            seatMap: {
              skipPositions: []
            }
          };
          
          debugLog(`Derived layout from jet capacity: ${JSON.stringify(derivedLayout)}`);
          setLayout(derivedLayout);
        } else {
          // If all else fails, use default layout
          debugLog(`Using fallback layout: ${JSON.stringify(defaultLayout)}`);
          setLayout(defaultLayout || {
            rows: 4, 
            seatsPerRow: 3, 
            layoutType: 'standard',
            seatMap: { skipPositions: [] }
          });
        }
      } catch (err) {
        console.error('Error fetching jet layout:', err);
        setError(err instanceof Error ? err.message : String(err));
        debugLog(`Error fetching layout: ${err instanceof Error ? err.message : String(err)}`);
        
        // Use default layout as fallback
        debugLog(`Using fallback layout: ${JSON.stringify(defaultLayout)}`);
        setLayout(defaultLayout || {
          rows: 4, 
          seatsPerRow: 3, 
          layoutType: 'standard',
          seatMap: { skipPositions: [] }
        });
        
        // Call onError callback if provided
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        setIsLoading(false);
      }
    }, [jet_id, defaultLayout, onError, debugLog]);

    // Update dimensions when layout changes or component mounts
    useEffect(() => {
      // Set grid dimensions based on the number of rows/columns
      const baseGridWidth = layout.seatsPerRow * 60; // 60px per seat for better touch targets
      const baseGridHeight = layout.rows * 60; // 60px per seat
      
      setGridDimensions({
        width: baseGridWidth,
        height: baseGridHeight,
      });
      
      // Calculate seat size
      setSeatSize(60);
      
      // Log for debugging
      debugLog('Updated grid dimensions:', { width: baseGridWidth, height: baseGridHeight, rows: layout.rows, seatsPerRow: layout.seatsPerRow });
    }, [layout.rows, layout.seatsPerRow, debugLog]);

    // Initialize with initial selection if provided
    useEffect(() => {
      if (!initialSelection || isUpdatingRef.current) return;
      
      isUpdatingRef.current = true;
      
      setSelectedSeats(initialSelection.selectedSeats || []);
      
      // Reset the flag after a short delay
      const timer = setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
      
      return () => clearTimeout(timer);
    }, [initialSelection]); // Only dependency is initialSelection

    // Update when selection changes
    useEffect(() => {
      if (isUpdatingRef.current) return;
      
      // Use setTimeout to debounce updates and break potential update cycles
      const timer = setTimeout(() => {
        updateParentComponent();
      }, 100); // Add a small debounce delay
      
      return () => clearTimeout(timer);
    }, [selectedSeats, updateParentComponent]);

    // Update total seats from props if provided
    useEffect(() => {
      if (customLayout && forceExactLayout) {
        // Use the exact layout specified in customLayout prop
        setLayout(customLayout);
        debugLog('Using custom layout:', customLayout);
        
        // Apply skip positions if provided
        if (customLayout.seatMap?.skipPositions) {
          setSkipPositions(customLayout.seatMap.skipPositions);
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
      } else if (totalSeats && totalSeats > 0) {
        // Calculate rows and columns based on total seats
        // For simplicity, we'll make a grid with approximately square dimensions
        const approxDimension = Math.ceil(Math.sqrt(totalSeats));
        
        setLayout(prev => ({
          ...prev,
          rows: Math.ceil(totalSeats / approxDimension),
          seatsPerRow: Math.min(approxDimension, totalSeats),
          totalSeats: totalSeats // Explicitly set the totalSeats property
        }));
        
        // Reset skip positions since we're using the auto-calculated layout
        setSkipPositions([]);
        
        // Log the change for debugging
        debugLog(`Updated layout with total seats: ${totalSeats}`, {
          rows: Math.ceil(totalSeats / approxDimension),
          seatsPerRow: Math.min(approxDimension, totalSeats)
        });
      }
    }, [totalSeats, customLayout, forceExactLayout, debugLog]);

    // Fetch layout data when component mounts or jet_id changes
    useEffect(() => {
      // Skip if no jet_id is provided
      if (!jet_id) {
        setIsLoading(false);
        return;
      }
      
      // Fetch the layout data
      fetchLayoutData();
      
      // Store reference to layout fetch function for debugging
      (window as any).retryFetchLayout = fetchLayoutData;
      
      // Cleanup function
      return () => {
        delete (window as any).retryFetchLayout;
      };
    }, [jet_id, fetchLayoutData]);

    // Update skipPositions when layout changes
    useEffect(() => {
      if (layout && layout.seatMap && layout.seatMap.skipPositions) {
        setSkipPositions(layout.seatMap.skipPositions);
        debugLog('Updated skip positions from layout:', layout.seatMap.skipPositions);
      } else {
        setSkipPositions([]);
        debugLog('No skip positions found in layout, using empty array');
      }
    }, [layout, debugLog]);

    if (!isVisible) return null;

    return (
      <div className={cn("flex flex-col bg-gray-900 rounded-lg shadow-2xl overflow-hidden", className)}>
        {showControls && (
          <div className="w-full text-center p-4 border-b border-gray-800">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Seat Selection</h3>
            
            {/* Seat selection summary */}
            {!isLoading && !error && (
              <SeatSelectionSummary 
                selectedSeats={selectedSeats}
                totalSeats={layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length)}
              />
            )}
            
            {/* Selection mode toggles */}
            <div className="flex justify-center items-center gap-2 mt-4 mb-2">
              <button
                type="button"
                className={cn(
                  "px-4 py-2 rounded-full text-sm flex items-center transition-all",
                  selectionMode === 'tap'
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                )}
                onClick={toggleSelectionMode}
                disabled={readOnly}
                aria-label="Tap selection mode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                </svg>
                Tap Mode
              </button>
              <button
                type="button"
                className={cn(
                  "px-4 py-2 rounded-full text-sm flex items-center transition-all",
                  selectionMode === 'drag'
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                )}
                onClick={toggleSelectionMode}
                disabled={readOnly}
                aria-label="Drag selection mode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7z" />
                </svg>
                Drag Mode
              </button>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-center items-center gap-2 mt-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-green-700/30"
                onClick={handleSelectAll}
                disabled={readOnly}
                aria-label="Select all seats"
              >
                Select All
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-red-700/30"
                onClick={handleClearSelection}
                disabled={readOnly}
                aria-label="Clear selection"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <StatusMessage 
          isLoading={isLoading} 
          error={error} 
          onRetry={fetchLayoutData} 
        />

        {!isLoading && !error && (
          <div className="p-2 relative">
            {/* Selection summary - Improved contrast - now conditionally rendered */}
            {showSummary !== false && (
              <div className="absolute top-2 right-2 bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full z-10 border border-gray-700 shadow-lg">
                <div className="flex items-center text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                  <span className="text-blue-300 font-medium">{selectedSeats.length}</span>
                  <span className="text-gray-300 mx-1">of</span>
                  <span className="text-white font-medium">{totalSeats}</span>
                  <span className="text-gray-300 ml-1">seats selected</span>
                </div>
              </div>
            )}
            
            {/* Improved legend with better contrast - now conditionally rendered */}
            {showLegend !== false && (
              <div className="absolute bottom-2 right-2 left-2 bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg z-10 border border-gray-700 shadow-lg">
                <div className="flex items-center justify-around text-xs">
                  <div className="flex items-center mr-2">
                    <div className="w-4 h-4 rounded-sm bg-blue-600 border border-blue-400 mr-1.5 opacity-80"></div>
                    <span className="text-blue-300 font-medium">Selected</span>
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
            
            {/* Seat map container with layout info - more mobile optimized */}
            <div 
              ref={containerRef}
              className="relative mx-auto bg-gradient-to-b from-gray-800 to-gray-950 rounded-lg overflow-hidden touch-manipulation border border-gray-700 shadow-inner"
              style={{ 
                width: `${gridDimensions.width}px`, 
                height: `${gridDimensions.height + 24}px`, // Further reduce header space
                maxWidth: '100%',
                maxHeight: '70vh'  // Increase max height for better mobile use
              }}
              aria-label="Jet Seat Map"
            >
              {/* Cabin representation */}
              <div className="relative h-full w-full">
                
                {/* Aisle indicator */}
                <div 
                  className="absolute left-0 right-0 bg-gray-700/50 z-10"
                  style={{
                    top: `${(gridDimensions.height / 2) - (showAisle ? 10 : 0)}px`,
                    height: showAisle ? '20px' : '0px'
                  }}
                ></div>

                {/* Simplified layout info bar at the top */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 flex justify-between items-center px-3 z-10 text-xs">
                  <div className="text-gray-300 font-medium">{layout.rows} × {layout.seatsPerRow}</div>
                  <div className="text-blue-300">
                    {selectedSeats.length} of {layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length)} selected
                  </div>
                </div>

                {/* Seats grid - more compact with reduced spacing */}
                <div 
                  className="absolute top-6 left-0 right-0 bottom-0 grid place-items-center py-1" 
                  style={{ 
                    gridTemplateColumns: `repeat(${layout.seatsPerRow}, 1fr)`,
                    gridTemplateRows: `repeat(${layout.rows}, 1fr)` 
                  }}
                >
                  {Array.from({ length: layout.rows }).map((_, rowIdx) =>
                    Array.from({ length: layout.seatsPerRow }).map((_, colIdx) => {
                      // Skip rendering this seat if it's in skipPositions
                      if (isSkippedPosition(rowIdx, colIdx)) {
                        return <div key={`empty-${rowIdx}-${colIdx}`} className="m-0"></div>;
                      }
                      
                      const seatId = generateSeatId(rowIdx, colIdx);
                      const isSelected = selectedSeats.includes(seatId);
                      
                      // Seat styling with improved contrast and visibility
                      return (
                        <div
                          key={`seat-${rowIdx}-${colIdx}`}
                          ref={(el) => {
                            if (el) seatsRef.current[rowIdx * layout.seatsPerRow + colIdx] = el;
                          }}
                          data-seat-id={seatId}
                          className={cn(
                            // Base styling
                            "flex items-center justify-center rounded-md cursor-pointer touch-manipulation transition-all transform hover:scale-105",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                            // Dynamic classes based on state
                            isSelected
                              ? "bg-blue-600 border-2 border-blue-400 text-white shadow-md hover:bg-blue-700"
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
            </div>
          </div>
        )}

        {showControls && (
          <div className="p-4 border-t border-gray-800 flex justify-between">
            <button
              type="button"
              className="px-4 py-2 rounded-full text-sm bg-gray-800 text-gray-300 hover:bg-gray-700"
              onClick={() => setIsVisible(false)}
            >
              Close
            </button>
            <div className="text-sm text-gray-500">
              {selectedSeats.length} of {layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length)} seats selected
            </div>
          </div>
        )}
      </div>
    );
  }
);

JetSeatVisualizer.displayName = 'JetSeatVisualizer';

export default JetSeatVisualizer; 

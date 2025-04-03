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
  jetId: string;
  selectedSeats: string[];
  totalSeats: number;
  totalSelected: number;
  selectionPercentage: number;
}

// Props interface
export interface JetSeatVisualizerProps {
  jetId: string;
  defaultLayout?: SeatLayout;
  onChange?: (config: SeatConfiguration) => void;
  initialSelection?: SeatConfiguration;
  readOnly?: boolean;
  className?: string;
  showControls?: boolean;
  totalSeats?: number;
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
    jetId: string;
  };
  selectSeats: (seatIds: string[]) => void;
  clearSelection: () => void;
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
    jetId, 
    defaultLayout, 
    onChange, 
    initialSelection, 
    readOnly = false, 
    className,
    showControls = true,
    totalSeats
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
        jetId,
        selectedSeats,
        totalSeats: actualTotalSeats,
        totalSelected: selectedSeats.length,
        selectionPercentage
      };
    }, [jetId, layout, selectedSeats, skipPositions]);

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
          jetId: jetId
        };
      },
      selectSeats: (seatIds: string[]) => {
        setSelectedSeats(seatIds);
      },
      clearSelection: () => {
        setSelectedSeats([]);
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

    // Fetch layout data when jetId changes
    useEffect(() => {
      const fetchLayoutData = async () => {
        if (!jetId) return;

        debugLog(`Fetching layout for jet ID: ${jetId}`);
        setIsLoading(true);
        setError(null);

        try {
          // Call API to get jet layout data
          const response = await fetch(`/api/jets/${jetId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch jet layout data');
          }
          
          const data = await response.json();
          debugLog('Received jet layout data:', data);
          
          if (data.seatLayout) {
            setLayout(data.seatLayout);
            debugLog('Applied layout:', data.seatLayout);
            
            // Save skip positions if available
            if (data.seatLayout.seatMap?.skipPositions) {
              setSkipPositions(data.seatLayout.seatMap.skipPositions);
              debugLog('Applied skip positions:', data.seatLayout.seatMap.skipPositions);
            } else {
              setSkipPositions([]);
            }
          }
        } catch (err) {
          console.error('Error fetching jet layout:', err);
          setError('Failed to load jet configuration');
          // Keep using the default layout
        } finally {
          setIsLoading(false);
        }
      };

      fetchLayoutData();
      
      // Expose fetchLayoutData for retrying
      (window as any).fetchLayoutData = fetchLayoutData;
      
      return () => {
        // Cleanup
        delete (window as any).fetchLayoutData;
      };
    }, [jetId, debugLog]);

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
      if (totalSeats && totalSeats > 0) {
        // Calculate rows and columns based on total seats
        // For simplicity, we'll make a grid with approximately square dimensions
        const approxDimension = Math.ceil(Math.sqrt(totalSeats));
        
        setLayout(prev => ({
          ...prev,
          rows: Math.ceil(totalSeats / approxDimension),
          seatsPerRow: Math.min(approxDimension, totalSeats),
          totalSeats: totalSeats // Explicitly set the totalSeats property
        }));
        
        // Log the change for debugging
        debugLog(`Updated layout with total seats: ${totalSeats}`, {
          rows: Math.ceil(totalSeats / approxDimension),
          seatsPerRow: Math.min(approxDimension, totalSeats)
        });
      }
    }, [totalSeats, debugLog]);

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
          onRetry={() => {
            setIsLoading(true);
            setError(null);
            // Use the function from the current effect scope
            const fetchJetData = async () => {
              if (!jetId) return;
              try {
                const response = await fetch(`/api/jets/${jetId}`);
                if (!response.ok) throw new Error('Failed to fetch jet layout data');
                const data = await response.json();
                if (data.seatLayout) {
                  setLayout(data.seatLayout);
                  if (data.seatLayout.seatMap?.skipPositions) {
                    setSkipPositions(data.seatLayout.seatMap.skipPositions);
                  } else {
                    setSkipPositions([]);
                  }
                }
              } catch (err) {
                console.error('Error fetching jet layout:', err);
                setError('Failed to load jet configuration');
              } finally {
                setIsLoading(false);
              }
            };
            fetchJetData();
          }} 
        />

        {!isLoading && !error && (
          <div className="p-6 bg-gray-900 relative">
            {/* Seat map container with layout info */}
            <div 
              ref={containerRef}
              className="relative mx-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden touch-manipulation border border-gray-700 shadow-inner"
              style={{ 
                width: `${gridDimensions.width}px`, 
                height: `${gridDimensions.height + 40}px`, // Add space for the header
                maxWidth: '100%',
                maxHeight: '60vh'
              }}
              aria-label="Jet seat map"
            >
              {/* Layout info bar at the top */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-gray-800 border-b border-gray-700 flex justify-between items-center px-3 z-10">
                <div className="text-xs text-gray-300 font-medium">
                  {layout.layoutType === 'luxury' ? 'Luxury Layout' : 'Standard Layout'}
                </div>
                <div className="text-xs text-gray-400">
                  {layout.rows} rows × {layout.seatsPerRow} seats
                </div>
              </div>
              
              {/* Instruction banner */}
              <div className="absolute top-10 left-0 right-0 h-8 bg-blue-900/20 flex justify-center items-center z-5">
                <p className="text-xs text-blue-200">
                  {selectionMode === 'tap' ? 'Tap seats to select or deselect' : 'Drag to select multiple seats'}
                </p>
              </div>

              {/* Seats grid */}
              <div 
                className="absolute top-[4.5rem] left-0 right-0 bottom-0 grid place-items-center" 
                style={{ 
                  gridTemplateColumns: `repeat(${layout.seatsPerRow}, 1fr)`,
                  gridTemplateRows: `repeat(${layout.rows}, 1fr)` 
                }}
              >
                {Array.from({ length: layout.rows }).map((_, rowIdx) =>
                  Array.from({ length: layout.seatsPerRow }).map((_, colIdx) => {
                    // Skip rendering this seat if it's in skipPositions
                    if (isSkippedPosition(rowIdx, colIdx)) {
                      return <div key={`empty-${rowIdx}-${colIdx}`} className="m-1"></div>;
                    }
                    
                    const seatId = generateSeatId(rowIdx, colIdx);
                    const isSelected = selectedSeats.includes(seatId);
                    
                    // Improved seat styling with touch-friendly size and jet-like appearance
                    return (
                      <div
                        key={`seat-${rowIdx}-${colIdx}`}
                        ref={(el) => {
                          if (el) seatsRef.current[rowIdx * layout.seatsPerRow + colIdx] = el;
                        }}
                        data-seat-id={seatId}
                        className={cn(
                          "relative w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer touch-manipulation transition-all transform hover:scale-105",
                          isSelected 
                            ? "bg-blue-500 text-white border border-blue-400 shadow-md shadow-blue-900/50"
                            : "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600",
                          layout.layoutType === 'luxury' ? "shadow-sm" : "",
                          readOnly ? "pointer-events-none" : ""
                        )}
                        onClick={() => handleSeatClick(seatId)}
                        style={{ 
                          backgroundImage: isSelected 
                            ? 'linear-gradient(135deg, #3182ce, #2c5282)' 
                            : 'linear-gradient(135deg, #4a5568, #2d3748)',
                        }}
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={`Seat ${seatId}`}
                      >
                        <span className="font-medium text-xs">{seatId}</span>
                        {/* Subtle embellishments to make it look like a jet seat */}
                        <div className={cn(
                          "absolute inset-x-3 h-1 rounded-full top-2",
                          isSelected ? "bg-blue-300/30" : "bg-gray-500/30"
                        )}></div>
                        <div className={cn(
                          "absolute inset-x-3 h-0.5 rounded-full bottom-2",
                          isSelected ? "bg-blue-300/20" : "bg-gray-500/20"
                        )}></div>
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

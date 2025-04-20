'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import Selecto from 'react-selecto';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { RefreshCw, GripVertical } from 'lucide-react';
import debounce from 'lodash/debounce';

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
  onAllocationChange?: (allocation: { yourSeats: number; partnerSeats: number; selectionPercentage: number }) => void;
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
    const [layout, setLayout] = useState<SeatLayout | null>(defaultLayout ? {...defaultLayout} : null);
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

    // Calculate seat configuration
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

    // Function to check if a position should be skipped
    const isSkippedPosition = useCallback((row: number, col: number): boolean => {
      return skipPositions.includes(`${row},${col}`);
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
      
      if (layout?.rows !== undefined && layout?.seatsPerRow !== undefined) {
        for (let row = 0; row < layout.rows; row++) {
          for (let col = 0; col < layout.seatsPerRow; col++) {
            if (!isSkippedPosition(row, col)) {
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

    // Update the useEffect for fetching layout data
    useEffect(() => {
      // Skip API calls if jet_id is 'default' to prevent loops
      if (jet_id === 'default') {
        setIsLoading(false);
        
        // If we have totalSeats, still create an optimized layout
        if (totalSeats && totalSeats > 0) {
          calculateOptimalLayout(totalSeats);
        }
        return;
      }
      
      // Set loading state
      setIsLoading(true);
      
      // Clear any previous errors
      setError(null);
      
      // Note: isMounted ref is now declared at the component level
      
      const fetchLayoutData = async () => {
        try {
          // Call API to get jet layout data
          const response = await fetch(`/api/jets/${jet_id}`);
          
          if (!response.ok) {
            const errorMsg = `Failed to fetch jet layout data: ${response.status} ${response.statusText}`;
            throw new Error(errorMsg);
          }
          
          const data = await response.json();
          debugLog('Received jet layout data:', data);
          
          // Process the retrieved layout data
          if (data.seatLayout) {
            // If totalSeats is provided, we need to calculate the optimal layout
            if (totalSeats && totalSeats > 0) {
              // Override with our optimal layout based on totalSeats
              calculateOptimalLayout(totalSeats);
            } else {
              // Use layout from API
              setLayout(data.seatLayout);
              debugLog('Applied layout from API:', data.seatLayout);
              
              // Save skip positions if available
              if (data.seatLayout.seatMap?.skipPositions) {
                const formattedSkipPositions = data.seatLayout.seatMap.skipPositions.map((pos: number[]) => pos.join(','));
                setSkipPositions(formattedSkipPositions);
                debugLog('Applied skip positions:', data.seatLayout.seatMap.skipPositions);
              } else {
                setSkipPositions([]);
              }
            }
          } else if (totalSeats && totalSeats > 0) {
            // If no seatLayout in response but we have totalSeats, calculate optimal layout
            calculateOptimalLayout(totalSeats);
          }
        } catch (err) {
          console.error('Error fetching jet layout:', err);
          setError('Failed to load jet configuration');
          
          // Call onError prop if provided
          if (onError) {
            onError(err instanceof Error ? err : String(err));
          }
          
          // If totalSeats is provided, still create an optimized layout
          if (totalSeats && totalSeats > 0) {
            calculateOptimalLayout(totalSeats);
          } else {
            // Fallback layout
            const fallbackLayout: SeatLayout = {
              rows: 4,
              seatsPerRow: 3,
              layoutType: 'standard' as const,
              totalSeats: totalSeats || 12
            };
            
            setLayout(fallbackLayout);
            debugLog('Using fallback layout:', fallbackLayout);
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchLayoutData();
      
      return () => {
        // Cleanup
        isMounted.current = false;
      };
    }, [jet_id, debugLog, onError, totalSeats, calculateOptimalLayout]);

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

    // Update dimensions when layout changes or component mounts
    useEffect(() => {
      // Add proper null checks for layout properties
      // Set grid dimensions based on the number of rows/columns
      const baseGridWidth = layout?.seatsPerRow !== undefined ? layout.seatsPerRow * 60 : 0; // 60px per seat for better touch targets
      const baseGridHeight = layout?.rows !== undefined ? layout.rows * 60 : 0;
      
      // Set grid dimensions
      setGridDimensions({
        width: baseGridWidth,
        height: baseGridHeight
      });
      
      // Update seat size
      setSeatSize(40); // Standard size for seats
    }, [layout]);

    // For the slider component, ensure we memoize values to avoid re-renders
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
            selectionPercentage: percentage
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

    // Update the handleSliderChange function
    const handleSliderChange = useCallback((value: number[]) => {
      // Don't update if we're already updating
      if (isUpdatingRef.current === true) return;
      
      // Set the flag to indicate we're updating
      isUpdatingRef.current = true;
      
      // Update the selection percentage state
      setSelectionPercentage(value[0]);
      
      // Call the debounced update function
      updateAllocation(value[0]);
    }, [updateAllocation]);

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
              if (isSkippedPosition(row, col)) {
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
                  className={cn(
                    "rounded-md flex items-center justify-center cursor-pointer transition-all select-none",
                    isSelected ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-400",
                    "border",
                    isSelected ? "border-blue-400" : "border-gray-700",
                    "transform transition duration-150",
                    isSelected ? "scale-100" : "scale-95",
                    readOnly && "pointer-events-none"
                  )}
                  onClick={() => handleSeatClick(seatId)}
                >
                  <span className="text-xs font-medium">{seatId}</span>
                </div>
              );
            })
          )}
        </div>
      );
    };

    // Render the seat grid or loading state
    const renderContent = () => {
      if (isLoading) return <div className="flex justify-center items-center h-48"><RefreshCw className="h-10 w-10 animate-spin" /></div>;
      
      if (!layout || !layout.rows || !layout.seatsPerRow) return (
        <div className="text-center py-10">
          <p className="text-red-500">No seat layout found. Please try again or contact support.</p>
        </div>
      );

      return (
        <div className={cn("bg-gray-900/40 backdrop-blur-md rounded-lg p-4 transition-all seat-visualizer-container", className, readOnly && "pointer-events-none opacity-80")}>
          <h3 className="text-lg font-medium text-white mb-3 seat-visualizer-header">Seat Configuration</h3>
          
          {/* Show the status message while loading or on error */}
          <StatusMessage isLoading={isLoading} error={error} onRetry={() => window.location.reload()} />
          
          {/* Show the summary if enabled */}
          {showSummary && !isLoading && !error && (
            <SeatSelectionSummary 
              selectedSeats={selectedSeats} 
              totalSeats={layout?.totalSeats || 
                (layout?.rows !== undefined && layout?.seatsPerRow !== undefined ? 
                  (layout.rows * layout.seatsPerRow - skipPositions.length) : 0)} 
            />
          )}
          
          {/* Controls for seat selection */}
          {showControls && !isLoading && !error && (
            <div className="mb-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-100">Your Seats vs Partner Seats</div>
                  <div className="text-sm font-medium text-white">
                    <span 
                      ref={yourSeatsDisplayRef} 
                      className="inline-block px-2 py-1 bg-blue-900/30 text-blue-200 rounded-md"
                    >
                      {Math.ceil((selectionPercentage / 100) * selectedSeats.length) || 0}
                    </span>
                    <span className="mx-1">:</span>
                    <span 
                      ref={partnerSeatsDisplayRef} 
                      className="inline-block px-2 py-1 bg-amber-900/30 text-amber-200 rounded-md"
                    >
                      {selectedSeats.length - Math.ceil((selectionPercentage / 100) * selectedSeats.length) || 0}
                    </span>
                  </div>
                </div>
                
                {/* Selection slider - prevent touchmove propagation to avoid page swipe */}
                <div 
                  ref={sliderRef}
                  className="px-2 touch-none slider-container" 
                  style={{ touchAction: 'none' }}
                >
                  <Slider
                    defaultValue={sliderDefaultValue}
                    max={100}
                    step={1}
                    value={sliderValue}
                    onValueChange={handleSliderChange}
                    className="bg-gray-800 cursor-grab active:cursor-grabbing"
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-400">
                  <span>All to You</span>
                  <span>Split 50/50</span>
                  <span>All to Partner</span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 seat-control-button"
                >
                  Clear
                </button>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 seat-control-button"
                >
                  Select All
                </button>
                <button
                  onClick={toggleSelectionMode}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm ml-auto seat-control-button",
                    selectionMode === 'tap'
                      ? "active"
                      : ""
                  )}
                >
                  {selectionMode === 'tap' ? 'Tap Mode' : 'Drag Mode'}
                </button>
              </div>
            </div>
          )}
          
          {/* Seat grid visualization */}
          {!isLoading && !error && (
            <div 
              ref={containerRef}
              className="relative border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: `${layout?.seatsPerRow !== undefined ? layout.seatsPerRow : 1} / ${layout?.rows !== undefined ? layout.rows : 1}`
              }}
            >
              {/* Optional: Add plane outline or visual elements */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Could add aircraft shape outlines here */}
              </div>
              
              {/* The seat grid */}
              {renderSeatGrid()}
              
              {/* Selecto for drag selection */}
              {selectionMode === 'drag' && !readOnly && (
                <Selecto
                  ref={selectoRef}
                  dragContainer={containerRef.current}
                  selectableTargets={seatsRef.current.filter(Boolean)}
                  onSelect={handleSelectoSelect}
                  selectByClick={true}
                  selectFromInside={true}
                  continueSelect={true}
                  toggleContinueSelect={'shift'}
                  keyContainer={window}
                  hitRate={0}
                  preventDragFromInside={true}
                  preventDefault={true}
                  className="seat-selecto"
                />
              )}
            </div>
          )}
          
          {/* Legend for seats */}
          {showLegend && !isLoading && !error && (
            <div className="mt-4 flex gap-4 justify-center text-sm seat-legend">
              <div className="flex items-center seat-legend-item">
                <div className="w-4 h-4 rounded-sm bg-blue-600 border border-blue-400 mr-2 seat-legend-color" style={{ backgroundColor: "#DAFF0D", borderColor: "#DAFF0D" }}></div>
                <span className="text-white">Your Seats</span>
              </div>
              <div className="flex items-center seat-legend-item">
                <div className="w-4 h-4 rounded-sm bg-gray-800 border border-gray-700 mr-2 seat-legend-color"></div>
                <span className="text-white">Partner's Seats</span>
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

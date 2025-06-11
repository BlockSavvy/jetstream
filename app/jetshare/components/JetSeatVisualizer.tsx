'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import Selecto from 'react-selecto';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCheck, MousePointer, MousePointerClick, Trash2, XCircle } from 'lucide-react';
import { formatImageUrl } from "@/lib/utils";
import { Spinner } from '@/components/ui/spinner';

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

// Add SeatPosition type near other interfaces/types if it doesn't exist
interface SeatPosition {
  row: number;
  col: number;
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
  initialSelectionPercentage?: number;
  autoSelectAllSeats?: boolean;
  externalShareRatio?: number;
  hideSlider?: boolean;
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
        <Spinner size="lg" className="mb-2" />
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
    className = '',
    showControls = true,
    totalSeats: propTotalSeats,
    onError,
    showLegend = true,
    showSummary = true,
    customLayout,
    forceExactLayout = false,
    initialSelectionPercentage = 50,
    autoSelectAllSeats = false,
    externalShareRatio,
    hideSlider = false
  }, ref) => {
    // Add isUpdatingRef to prevent infinite update loops
    const isUpdatingRef = useRef(false);
    
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

    // Refs for seats
    const seatsRef = useRef<HTMLDivElement[]>([]);
    const selectoRef = useRef<Selecto>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const layoutRef = useRef<HTMLDivElement>(null);
    const seatGridRef = useRef<HTMLDivElement>(null);

    // Add state to track seats that should be skipped (not displayed)
    const [skipPositions, setSkipPositions] = useState<number[][]>([]);

    // Add state for selection percentage
    const [selectionPercentage, setSelectionPercentage] = useState(initialSelectionPercentage);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      openVisualizer: () => setIsVisible(true),
      closeVisualizer: () => setIsVisible(false),
      getLayoutInfo: () => {
        // Always prioritize explicitly provided totalSeats prop
        const effectiveTotalSeats = propTotalSeats || layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
        console.log(`[JetSeatVisualizer] getLayoutInfo returning ${effectiveTotalSeats} total seats`);
        
        return {
          totalSeats: effectiveTotalSeats,
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

    // Calculate seat allocation
    const calculateSeatConfiguration = useCallback((): SeatConfiguration => {
      // CRITICAL FIX: Always honor totalSeats prop if provided
      const providedTotalSeats = propTotalSeats !== undefined ? propTotalSeats : null;
      const actualTotalSeats = providedTotalSeats || layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
      
      // Force cap selected seats count to actual total seats
      const validSelectedSeats = selectedSeats.slice(0, actualTotalSeats);
      
      // Calculate percentage based on valid seat count
      const seatSelectionPercentage = actualTotalSeats > 0 ? Math.round((validSelectedSeats.length / actualTotalSeats) * 100) : 0;
      
      return {
        jet_id,
        selectedSeats: validSelectedSeats,
        totalSeats: actualTotalSeats,
        totalSelected: validSelectedSeats.length,
        selectionPercentage: selectionPercentage
      };
    }, [jet_id, layout, selectedSeats, skipPositions, propTotalSeats, selectionPercentage]);

    // Function to check if a position should be skipped
    const isSkippedPosition = useCallback((row: number, col: number): boolean => {
      return skipPositions.some(pos => pos[0] === row && pos[1] === col);
    }, [skipPositions]);

    // Update parent component with selection changes
    const updateParentComponent = useCallback(() => {
      if (!onChange || isUpdatingRef.current) return;
      
      const totalSelected = selectedSeats.length;
      const totalSeatsValue = propTotalSeats || layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
      
      debugLog('Updating parent component with selection:', {
        selectedSeats, 
        selectionPercentage, 
        totalSeats: totalSeatsValue
      });
      
      onChange({
        jet_id,
        selectedSeats,
        totalSeats: totalSeatsValue,
        totalSelected,
        selectionPercentage
      });
    }, [selectedSeats, selectionPercentage, onChange, jet_id, propTotalSeats, layout, skipPositions.length, debugLog]);

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
        
        // Otherwise proceed with API call for layout
        const response = await fetch(`/api/jets/${jet_id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch layout: ${response.status}`);
        }
        
        const data = await response.json();
        
        // If totalSeats is explicitly provided, use that to override the API response
        if (propTotalSeats && propTotalSeats > 0) {
          // Calculate optimal dimensions
          let rows, seatsPerRow;
          
          // Optimize for common jet layouts with special case for 10 seats
          if (propTotalSeats === 10) {
            // Special case for Gulfstream G280
            rows = 5;
            seatsPerRow = 2;
            console.log('[JetSeatVisualizer] Using special 5x2 layout for 10 seats');
          } else if (propTotalSeats <= 4) {
            rows = 2; 
            seatsPerRow = 2;
          } else if (propTotalSeats <= 6) {
            rows = 2;
            seatsPerRow = 3;
          } else if (propTotalSeats <= 9) {
            rows = 3;
            seatsPerRow = 3;
          } else if (propTotalSeats <= 12) {
            rows = 3;
            seatsPerRow = 4;
          } else if (propTotalSeats <= 16) {
            rows = 4;
            seatsPerRow = 4;
          } else {
            // For larger configurations
            rows = Math.ceil(propTotalSeats / 4);
            seatsPerRow = 4;
          }
          
          // Update the layout with optimal dimensions
          const updatedLayout = {
            rows,
            seatsPerRow,
            layoutType: 'custom' as const,
            totalSeats: propTotalSeats
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
        const baseGridWidth = layout.seatsPerRow * 60;
        const baseGridHeight = layout.rows * 60;
        
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
        setIsLoading(false);
        
        if (onError) {
          onError(err instanceof Error ? err : String(err));
        }
        
        // Even on error, we set a default layout with the correct totalSeats if provided
        const defaultLayout: SeatLayout = {
          rows: propTotalSeats ? Math.min(4, Math.ceil(propTotalSeats / 3)) : 4,
          seatsPerRow: propTotalSeats ? Math.min(4, Math.ceil(propTotalSeats / 3)) : 3,
          layoutType: 'standard' as const,
          totalSeats: propTotalSeats || 12
        };
        
        setLayout(defaultLayout);
        setGridDimensions({ width: defaultLayout.seatsPerRow * 60, height: defaultLayout.rows * 60 });
        setSeatSize(60);
        setSelectedSeats([]);
      }
    }, [jet_id, customLayout, forceExactLayout, initialSelection, layout.rows, layout.seatsPerRow, onError, propTotalSeats, debugLog]);

    // Update dimensions when layout changes or component mounts
    useEffect(() => {
      // Force totalSeats to be respected in dimensions
      const actualTotalSeats = propTotalSeats || layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
      
      // Set special layouts for specific seat counts
      let optimalRows, optimalCols;
      
      // Use the complete special case logic from elsewhere in the component
      if (actualTotalSeats === 10) {
        // Special case for Gulfstream G280
        optimalRows = 5;
        optimalCols = 2;
        debugLog('Using special 5x2 layout for 10 seats in dimensions update');
      } else if (actualTotalSeats <= 4) {
        optimalRows = 2; 
        optimalCols = 2;
      } else if (actualTotalSeats <= 6) {
        optimalRows = 2;
        optimalCols = 3;
      } else if (actualTotalSeats <= 9) {
        optimalRows = 3;
        optimalCols = 3;
      } else if (actualTotalSeats <= 12) {
        optimalRows = 3;
        optimalCols = 4;
      } else if (actualTotalSeats <= 16) {
        optimalRows = 4;
        optimalCols = 4;
      } else {
        // For larger configurations
        optimalRows = Math.ceil(actualTotalSeats / 4);
        optimalCols = 4;
      }
      
      // Override layout if totalSeats is specified
      if (propTotalSeats && (layout.totalSeats !== propTotalSeats || (layout.rows * layout.seatsPerRow) > propTotalSeats)) {
        debugLog(`Forcing layout adjustment for totalSeats=${propTotalSeats}`, { 
          oldLayout: layout,
          newDimensions: { rows: optimalRows, cols: optimalCols }
        });
        
        setLayout(prev => ({
          ...prev,
          rows: optimalRows,
          seatsPerRow: optimalCols,
          totalSeats: propTotalSeats
        }));
      }
      
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
      debugLog('Updated grid dimensions:', { 
        width: baseGridWidth, 
        height: baseGridHeight, 
        rows: layout.rows, 
        seatsPerRow: layout.seatsPerRow,
        actualTotalSeats
      });
    }, [layout.rows, layout.seatsPerRow, layout.totalSeats, propTotalSeats, skipPositions.length, debugLog]);

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

    // Effect to handle when totalSeats or customLayout changes
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
      } else if (propTotalSeats && propTotalSeats > 0) {
        console.log(`[JetSeatVisualizer] Setting layout for ${propTotalSeats} seats from totalSeats prop`);
        
        // Calculate optimal dimensions for the given seat count
        // For a typical private jet layout of 2-3 seats across
        let rows, seatsPerRow;
        
        // Optimize for common jet layouts with special case for 10 seats
        if (propTotalSeats === 10) {
          // Special case for Gulfstream G280
          rows = 5;
          seatsPerRow = 2;
          console.log('[JetSeatVisualizer] Using special 5x2 layout for 10 seats');
        } else if (propTotalSeats <= 4) {
          rows = 2; 
          seatsPerRow = 2;
        } else if (propTotalSeats <= 6) {
          rows = 2;
          seatsPerRow = 3;
        } else if (propTotalSeats <= 9) {
          rows = 3;
          seatsPerRow = 3;
        } else if (propTotalSeats <= 12) {
          rows = 3;
          seatsPerRow = 4;
        } else if (propTotalSeats <= 16) {
          rows = 4;
          seatsPerRow = 4;
        } else {
          // For larger configurations
          rows = Math.ceil(propTotalSeats / 4);
          seatsPerRow = 4;
        }
        
        // Update layout with explicit totalSeats to avoid using default
        setLayout(prev => ({
          ...prev,
          rows,
          seatsPerRow,
          totalSeats: propTotalSeats // Explicitly set the totalSeats property
        }));
        
        // Reset skip positions since we're using the auto-calculated layout
        setSkipPositions([]);
        
        // Log the change for debugging
        debugLog(`Set layout for ${propTotalSeats} seats: ${rows} rows × ${seatsPerRow} columns`, {
          totalSeats: propTotalSeats
        });
      }
    }, [propTotalSeats, customLayout, forceExactLayout, debugLog]);

    // Add back useEffect for loading seat layout when jet_id changes
    useEffect(() => {
      if (!jet_id) return;
      
      debugLog(`Jet ID changed to ${jet_id}, fetching layout`);
      fetchSeatLayout();
      
      // Expose fetchSeatLayout for retrying from outside
      (window as any).fetchLayoutData = fetchSeatLayout;
      
      return () => {
        // Cleanup
        delete (window as any).fetchLayoutData;
      };
    }, [jet_id, fetchSeatLayout]);

    // Initialize selection percentage
    useEffect(() => {
      if (autoSelectAllSeats && selectedSeats.length === 0) {
        // When auto-selecting all, handle any layout without explicit totalSeats
        const availableSeats: SeatPosition[] = [];
        
        for (let row = 0; row < layout.rows; row++) {
          for (let col = 0; col < layout.seatsPerRow; col++) {
            if (!isSkippedPosition(row, col)) {
              availableSeats.push({ row, col });
            }
          }
        }
        
        // Only select up to the specified totalSeats (if provided)
        const seatsToSelect = propTotalSeats ? availableSeats.slice(0, propTotalSeats) : availableSeats;
        
        setSelectedSeats(seatsToSelect.map(pos => generateSeatId(pos.row, pos.col)));
        debugLog(`Auto-selected ${seatsToSelect.length} seats`, {
          seats: seatsToSelect,
          totalSeats: propTotalSeats || 'undefined'
        });
        
        setSeatSize(60);
      }
    }, [layout, isSkippedPosition, autoSelectAllSeats, initialSelectionPercentage, selectedSeats.length, debugLog, propTotalSeats]);

    // Update when externalShareRatio changes
    useEffect(() => {
      if (externalShareRatio !== undefined && externalShareRatio !== selectionPercentage && !isUpdatingRef.current) {
        isUpdatingRef.current = true;
        setSelectionPercentage(externalShareRatio);
        
        // Reset the flag after a short delay to prevent update loops
        const timer = setTimeout(() => {
          isUpdatingRef.current = false;
        }, 50);
        
        return () => clearTimeout(timer);
      }
    }, [externalShareRatio, selectionPercentage]);

    // Improved renderSeatGrid function that respects total seats
    const renderSeatGrid = () => {
      // Force respect for totalSeats by calculating how many seats to render
      const actualTotalSeats = propTotalSeats || layout.totalSeats || (layout.rows * layout.seatsPerRow);
      console.log(`[JetSeatVisualizer] Rendering grid with ${actualTotalSeats} seats, grid size: ${layout.rows}×${layout.seatsPerRow}`);
      
      // Count how many seats we'll actually render
      let renderedCount = 0;
      
      return (
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
              
              // STRICT ENFORCEMENT: Only render up to actualTotalSeats
              if (renderedCount >= actualTotalSeats) {
                return <div key={`extra-${rowIdx}-${colIdx}`} className="m-0"></div>;
              }
              
              // This is a valid seat we should render
              renderedCount++;
              
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
                  data-seat-number={renderedCount}
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
      );
    };
    
    // Main render content with debugging info
    const renderContent = () => {
      const actualTotalSeats = propTotalSeats || layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
      
      // Calculate allocation based on percentage
      const yourSeats = Math.ceil((selectionPercentage / 100) * selectedSeats.length);
      const partnerSeats = selectedSeats.length - yourSeats;
      
      return (
        <div className="p-2 relative">
          {/* Add debug info in development mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-2 left-2 bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-md z-20 border border-amber-700/50 text-[8px] text-amber-300">
              {`seats: ${actualTotalSeats}, grid: ${layout.rows}×${layout.seatsPerRow}, selected: ${selectedSeats.length}, allocation: ${selectionPercentage}%`}
            </div>
          )}
          
          {/* Selection summary - Improved contrast - now conditionally rendered */}
          {showSummary !== false && (
            <div className="absolute top-2 right-2 bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full z-10 border border-gray-700 shadow-lg">
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                <span className="text-blue-300 font-medium">{selectedSeats.length}</span>
                <span className="text-gray-300 mx-1">of</span>
                <span className="text-white font-medium">{actualTotalSeats}</span>
                <span className="text-gray-300 ml-1">seats selected</span>
                {selectedSeats.length > 0 && (
                  <>
                    <span className="mx-1 text-gray-500">|</span>
                    <span className="text-blue-300 font-medium">{yourSeats}</span>
                    <span className="text-gray-300 mx-1">:</span>
                    <span className="text-amber-300 font-medium">{partnerSeats}</span>
                  </>
                )}
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
          </div>
        </div>
      );
    };

    // Main render content with loading state
    if (!isVisible) return null;

    return (
      <div className={cn('relative rounded-lg overflow-hidden border border-gray-700 bg-gray-800/50 flex flex-col', className)}>
        {/* Jet Image Banner */}
        <div className="h-40 relative overflow-hidden group">
          <Image
            src={formatImageUrl(jet_id)}
            alt={`${jet_id} interior`}
            width={800}
            height={300}
            className="w-full h-full object-cover object-center brightness-90 transition group-hover:scale-105 duration-1000"
            onError={(e) => {
              // Fallback to a default image on error
              (e.target as HTMLImageElement).src = "/images/jets/default-jet-interior.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="font-medium tracking-wide text-xl">{jet_id}</div>
          </div>
        </div>

        {/* Visualization content */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4">
              <XCircle size={48} className="text-destructive" />
              <h3 className="text-lg font-medium">Unable to load seating layout</h3>
              <p className="text-center text-muted-foreground">
                {typeof error === 'string' ? error : (error as Error).message || 'An error occurred while loading the jet seating layout. Please try again later.'}
              </p>
            </div>
          ) : (
            <div className="relative flex h-full w-full flex-col items-center overflow-hidden rounded-lg bg-muted/30 p-4">
              {/* Jet interior background image */}
              {jet_id && (
                <div className="absolute inset-0 opacity-30">
                  <Image
                    src={formatImageUrl(jet_id)}
                    alt={`${jet_id} interior`}
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => {
                      // Fallback to default image if the specific jet image fails to load
                      (e.target as HTMLImageElement).src = '/images/jets/default-jet-interior.jpg';
                    }}
                  />
                </div>
              )}
              
              <div className="z-10 flex w-full flex-col items-center">
                {renderContent()}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {showControls && !readOnly && selectedSeats.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/90 flex flex-col space-y-3">
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <div className="text-xs text-blue-300">Your allocation</div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                <div className="text-xs text-amber-300">Partner allocation</div>
              </div>
            </div>
            
            {/* Add allocation slider - only show if hideSlider is false */}
            {!hideSlider && (
              <div className="flex items-center space-x-3 py-1">
                <div className="text-xs text-gray-400 w-10 text-right">{selectionPercentage}%</div>
                <Slider
                  value={[selectionPercentage]}
                  min={1}
                  max={100}
                  step={1}
                  className="flex-1"
                  onValueChange={([value]) => {
                    if (isUpdatingRef.current) return;
                    isUpdatingRef.current = true;
                    setSelectionPercentage(value);
                    
                    // Use timeout to prevent update loops and allow UI to update first
                    setTimeout(() => {
                      updateParentComponent();
                      setTimeout(() => {
                        isUpdatingRef.current = false;
                      }, 50);
                    }, 50);
                  }}
                />
                <div className="text-xs text-gray-400 w-10">{100 - selectionPercentage}%</div>
              </div>
            )}
            
            <div className="pt-1 flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={toggleSelectionMode}
                  className="h-7 text-xs"
                >
                  {selectionMode === 'tap' ? 
                    <><MousePointerClick className="h-3 w-3 mr-1" /> Tap</> : 
                    <><MousePointer className="h-3 w-3 mr-1" /> Drag</>
                  }
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearSelection}
                  className="h-7 text-xs text-red-400 hover:text-red-300 hover:border-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Clear
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" /> Select All
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

JetSeatVisualizer.displayName = 'JetSeatVisualizer';

export default JetSeatVisualizer; 

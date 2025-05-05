'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback, useMemo } from 'react';
import Selecto from 'react-selecto';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import React from 'react';
import { MousePointer, CheckCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

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
    // Get theme functionality
    const { getThemeClasses, theme } = useGdyupTheme();
    
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

    // Update the seatsRef to use a Record with string keys
    const seatsRef = useRef<Record<string, HTMLDivElement>>({});
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
      } else if (seats <= 10) {
        // For 10-seat jets, 2×5 layout is common (5 rows of 2 seats)
        seatsPerRow = 2;
        rows = 5;
      } else if (seats <= 12) {
        // For 12-seat jets, 3×4 layout is common (4 rows of 3 seats)
        seatsPerRow = 3;
        rows = 4;
      } else if (seats <= 16) {
        // For 16-seat jets, 4×4 layout is common (4 rows of 4 seats)
        seatsPerRow = 4;
        rows = 4;
      } else {
        // For larger jets, use 4-5 seats per row
        seatsPerRow = 4;
        rows = Math.ceil(seats / seatsPerRow);

        // If we have many seats, consider 5 seats per row
        if (seats > 20) {
          seatsPerRow = 5;
          rows = Math.ceil(seats / seatsPerRow);
        }
      }

      return { rows, seatsPerRow };
    }, []);

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
        const { rows, seatsPerRow } = calculateOptimalLayout(totalSeats);
        setLayout({ rows, seatsPerRow, layoutType: 'standard', totalSeats: totalSeats });
        setSkipPositions([]);
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
          const { rows, seatsPerRow } = calculateOptimalLayout(totalSeats);
          setLayout({ rows, seatsPerRow, layoutType: 'standard', totalSeats: totalSeats });
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
            const { rows, seatsPerRow } = calculateOptimalLayout(totalSeats);
            setLayout({ rows, seatsPerRow, layoutType: 'standard', totalSeats: totalSeats });
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
      if (!layout || layout.rows === undefined || layout.seatsPerRow === undefined) {
        return <div>Layout not available</div>;
      }

      const gridItems = [];
      
      // Determine the middle point to add an aisle
      // For even number of seats per row, we'll add space after the middle seat
      // For odd number of seats per row, we'll add more space around the middle seat
      const middlePoint = Math.floor(layout.seatsPerRow / 2);
      const hasAisle = layout.seatsPerRow > 2; // Only add aisle if more than 2 seats per row
      
      // Dynamic grid template with aisle
      let gridTemplateColumns = "";
      if (hasAisle) {
        // Create column definitions with wider gap in the middle for the aisle
        for (let i = 0; i < layout.seatsPerRow; i++) {
          gridTemplateColumns += "minmax(0, 1fr) ";
          // Add extra space after the middle column for the aisle
          if (i === middlePoint - 1 && layout.seatsPerRow > 2) {
            gridTemplateColumns += "0.5fr "; // Aisle space
          }
        }
        gridTemplateColumns = gridTemplateColumns.trim();
      } else {
        // Default equal columns if no aisle
        gridTemplateColumns = `repeat(${layout.seatsPerRow}, minmax(0, 1fr))`;
      }
      
      // Calculate seat size based on total seats
      // Fewer seats = larger seats
      const totalSeats = layout.rows * layout.seatsPerRow - skipPositions.length;
      const sizingClass = totalSeats <= 8 
        ? "aspect-square p-3 min-h-[48px] text-lg" // Large seats for few seats
        : totalSeats <= 12 
          ? "aspect-square p-2 min-h-[40px] text-base" // Medium seats
          : "aspect-square p-1 min-h-[36px] text-sm"; // Smaller seats for many seats

      // Function to check if seat is selectable
      const isSeatSelectable = (seatId: string): boolean => {
        // If selectionDisabled is true, all seats are not selectable
        if (selectionDisabled) return false;
        
        // If readonly mode is enabled, only show selected seats
        if (readOnly) return selectedSeats.includes(seatId);
        
        // If there's a seatConfig with non-empty keys, check against it
        if (seatConfig && Object.keys(seatConfig).length > 0) {
          return seatConfig[seatId] !== false;
        }
        
        return true; // Default to selectable
      };

      // Prepare the grid with aisle
      for (let row = 0; row < layout.rows; row++) {
        let currentCol = 0; // Keep track of the actual column index
        
        for (let col = 0; col < layout.seatsPerRow; col++) {
          const posString = `${row},${col}`;
          
          // Skip positions defined as empty
          if (skipPositions.includes(posString)) {
            currentCol++; // Increment the actual column index
            continue;
          }
          
          const seatId = generateSeatId(row, col);
          const isSelected = selectedSeats.includes(seatId);
          const isSelectable = isSeatSelectable(seatId);
          
          // Get theme-specific seat styling
          const seatClasses = getThemeClasses({
            base: cn(
              "flex items-center justify-center rounded-lg transition-all font-medium",
              sizingClass, // Dynamic sizing based on total seat count
              isSelectable ? "focus:outline-none focus:ring-2 cursor-pointer hover:scale-105" : "opacity-50 cursor-not-allowed",
              isSelected ? "shadow-md transform scale-[0.98] transition-transform" : ""
            ),
            default: cn(
              isSelected 
                ? "bg-gdyup-primary text-black border border-gdyup-primary/70 focus:ring-gdyup-primary/50" 
                : "bg-gdyup-accent text-white/90 border border-gray-700 hover:bg-gray-700 focus:ring-gdyup-primary/40",
              !isSelectable && "bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-800"  
            ),
            blue: cn(
              isSelected 
                ? "bg-blue-500 text-white border border-blue-400 focus:ring-blue-400/50" 
                : "bg-blue-900/60 text-white/90 border border-blue-800 hover:bg-blue-800 focus:ring-blue-500/40",
              !isSelectable && "bg-blue-900/30 text-blue-300/50 border-blue-900 hover:bg-blue-900/30"  
            ),
            pink: cn(
              isSelected 
                ? "bg-pink-500 text-white border border-pink-400 focus:ring-pink-400/50" 
                : "bg-pink-900/60 text-white/90 border border-pink-800 hover:bg-pink-800 focus:ring-pink-500/40",
              !isSelectable && "bg-pink-900/30 text-pink-300/50 border-pink-900 hover:bg-pink-900/30"  
            )
          });
          
          gridItems.push(
            <div
              key={seatId}
              className={seatClasses}
              data-key={seatId}
              onClick={() => {
                if (selectionMode === 'tap' && isSelectable && !readOnly) {
                  handleSeatClick(seatId);
                }
              }}
              onMouseEnter={() => {
                // Optional hover effect
              }}
              aria-label={`Seat ${seatId}`}
              role="button"
              tabIndex={isSelectable ? 0 : -1}
              ref={(el) => {
                if (el) seatsRef.current[seatId] = el;
              }}
              style={{
                // Push columns to correct position accounting for aisle
                gridColumn: hasAisle && col > middlePoint - 1 ? col + 2 : col + 1
              }}
            >
              {seatId}
            </div>
          );
          
          // Add an aisle marker after the middle seat if we have an aisle
          if (hasAisle && col === middlePoint - 1) {
            gridItems.push(
              <div
                key={`aisle-${row}-${col}`}
                className={getThemeClasses({
                  base: "flex items-center justify-center opacity-30 text-xs",
                  default: "text-white",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}
                style={{
                  gridColumn: middlePoint + 1,
                  gridRow: row + 1
                }}
                aria-hidden="true"
              >
                ⟡
              </div>
            );
          }
          
          currentCol++; // Increment the actual column index
        }
      }

      return (
        <div
          className={cn(
            "seat-grid relative w-full overflow-hidden rounded-lg transition-colors",
            getThemeClasses({
              base: "shadow-inner p-3",
              default: "bg-black/70 border border-gray-800",
              blue: "bg-blue-950/60 border border-blue-900",
              pink: "bg-pink-950/60 border border-pink-900"
            })
          )}
          style={{ width: '100%' }}
          ref={containerRef}
        >
          <div className="flex flex-wrap justify-center items-center h-full">
            <div
              className="grid w-full gap-2 md:gap-3"
              style={{ 
                gridTemplateColumns: gridTemplateColumns, 
                width: '100%',
                gridAutoRows: "auto"
              }}
            >
              {gridItems}
            </div>
          </div>
        </div>
      );
    };

    // Main render
    return (
      <div className={cn("jet-seat-visualizer relative transition-all", className)}>
        {isLoading ? (
          <div className={getThemeClasses({
            base: "flex items-center justify-center p-6 rounded-lg bg-opacity-50 border animate-pulse h-48 transition-colors",
            default: "bg-black border-gray-800",
            blue: "bg-blue-950 border-blue-900",
            pink: "bg-pink-950 border-pink-900" 
          })}>
            <span className={getThemeClasses({
              base: "opacity-70",
              default: "text-white",
              blue: "text-blue-200",
              pink: "text-pink-200"
            })}>Loading seat configuration...</span>
          </div>
        ) : error ? (
          <div className={getThemeClasses({
            base: "flex items-center justify-center p-4 rounded-lg border shadow-sm transition-colors",
            default: "bg-red-900/30 text-red-500 border-red-900/50",
            blue: "bg-red-900/30 text-red-400 border-red-900/50",
            pink: "bg-red-900/30 text-red-400 border-red-900/50"
          })}>
            <AlertTriangle className="w-5 h-5 mr-2 opacity-70" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* Main seat grid */}
            {renderSeatGrid()}

            {/* Controls */}
            {showControls && !readOnly && (
              <div className={getThemeClasses({
                base: "flex flex-col space-y-2 mt-4 p-3 rounded-lg border transition-colors",
                default: "bg-gray-900/60 border-gray-800",
                blue: "bg-blue-950/60 border-blue-900",
                pink: "bg-pink-950/60 border-pink-900"
              })}>
                <div className="flex justify-between items-center">
                  <div className={getThemeClasses({
                    base: "text-sm font-medium",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    Selection Mode
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectionMode('tap')}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium transition-colors",
                        selectionMode === 'tap' ? getThemeClasses({
                          base: "border",
                          default: "bg-gdyup-primary text-black border-gdyup-primary",
                          blue: "bg-blue-500 text-white border-blue-400",
                          pink: "bg-pink-500 text-white border-pink-400"
                        }) : getThemeClasses({
                          base: "border",
                          default: "bg-gray-800 text-white border-gray-700 hover:bg-gray-700",
                          blue: "bg-blue-900 text-blue-100 border-blue-800 hover:bg-blue-800",
                          pink: "bg-pink-900 text-pink-100 border-pink-800 hover:bg-pink-800"
                        })
                      )}
                    >
                      <MousePointer className="w-4 h-4" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectionMode('drag')}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium transition-colors",
                        selectionMode === 'drag' ? getThemeClasses({
                          base: "border",
                          default: "bg-gdyup-primary text-black border-gdyup-primary",
                          blue: "bg-blue-500 text-white border-blue-400",
                          pink: "bg-pink-500 text-white border-pink-400"
                        }) : getThemeClasses({
                          base: "border",
                          default: "bg-gray-800 text-white border-gray-700 hover:bg-gray-700",
                          blue: "bg-blue-900 text-blue-100 border-blue-800 hover:bg-blue-800",
                          pink: "bg-pink-900 text-pink-100 border-pink-800 hover:bg-pink-800"
                        })
                      )}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">≣</div>
                    </button>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeats([]);
                    if (onChange) onChange([]);
                  }}
                  className={getThemeClasses({
                    base: "px-3 py-1.5 mt-1 text-sm rounded font-medium transition-colors border flex items-center justify-center",
                    default: "bg-gray-800 hover:bg-gray-700 text-white border-gray-700",
                    blue: "bg-blue-900 hover:bg-blue-800 text-blue-100 border-blue-800",
                    pink: "bg-pink-900 hover:bg-pink-800 text-pink-100 border-pink-800"
                  })}
                >
                  <CheckCheck className="w-4 h-4 mr-1 opacity-70" />
                  <span>Reset to Zero</span>
                </button>
              </div>
            )}
            
            {/* Summary information */}
            {showSummary && (
              <div className={getThemeClasses({
                base: "mt-3 p-2 text-sm rounded-md",
                default: "bg-gray-800/70 text-white",
                blue: "bg-blue-900/70 text-blue-100",
                pink: "bg-pink-900/70 text-pink-100"
              })}>
                <div className="flex justify-between">
                  <span>Selected:</span>
                  <span className="font-medium">{selectedSeats.length} / {generateAllSeatIds().length}</span>
                </div>
              </div>
            )}
            
            {/* Legend */}
            {showLegend && (
              <div className={getThemeClasses({
                base: "mt-3 text-xs grid grid-cols-2 gap-x-2 gap-y-1",
                default: "text-white",
                blue: "text-blue-100",
                pink: "text-pink-100"
              })}>
                <div className="flex items-center">
                  <div className={getThemeClasses({
                    base: "w-3 h-3 rounded mr-1",
                    default: "bg-gdyup-primary",
                    blue: "bg-blue-500",
                    pink: "bg-pink-500"
                  })}></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center">
                  <div className={getThemeClasses({
                    base: "w-3 h-3 rounded mr-1",
                    default: "bg-gdyup-accent",
                    blue: "bg-blue-900/60",
                    pink: "bg-pink-900/60"
                  })}></div>
                  <span>Available</span>
                </div>
                {Object.keys(seatConfig).length > 0 && (
                  <>
                    <div className="flex items-center">
                      <div className={getThemeClasses({
                        base: "w-3 h-3 rounded mr-1 opacity-50",
                        default: "bg-gray-700",
                        blue: "bg-blue-900/30",
                        pink: "bg-pink-900/30"
                      })}></div>
                      <span>Unavailable</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Drag selection component */}
        {selectionMode === 'drag' && !readOnly && !selectionDisabled && (
          <Selecto
            ref={selectoRef}
            container={containerRef.current}
            selectableTargets={['.jet-seat-visualizer [data-key]']}
            selectByClick={false}
            selectFromInside={false}
            toggleContinueSelect={['shift']}
            hitRate={0}
            ratio={0}
            onSelect={(e) => {
              const selectedElements = e.selected || [];
              const newSelectedIds = selectedElements
                .map(el => el.getAttribute('data-key') as string)
                .filter(id => id && (!seatConfig || seatConfig[id] !== false));
              
              if (e.isDragStartEnd) {
                setSelectedSeats(e.inputEvent.shiftKey 
                  ? [...selectedSeats, ...newSelectedIds] 
                  : newSelectedIds);
              }
            }}
            onSelectEnd={() => {
              if (onChange) {
                onChange(selectedSeats);
              }
            }}
            dragContainer={document.body}
            boundContainer={containerRef.current}
            className={getThemeClasses({
              base: "!fixed", // Override Selecto's positioning
              default: "",
              blue: "", 
              pink: ""
            })}
          />
        )}
      </div>
    );
  }
);

JetSeatVisualizer.displayName = 'JetSeatVisualizer';

export default JetSeatVisualizer; 

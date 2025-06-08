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
  skipPositions?: string[]; // Add support for direct skipPositions array
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
  getAllSeats: () => string[];
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

// Define seatSize here so it's always available
const MIN_SEAT_SIZE = 36; // Minimum seat size for small screens
const DEFAULT_SEAT_SIZE = 40; // Default size
const LARGE_SEAT_SIZE = 48; // Size for larger screens

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
    // Debug log all initial props
    console.log("JetSeatVisualizer initialized with props:", {
      jet_id,
      totalSeats,
      initialSelection: initialSelection ? {
        totalSeats: initialSelection.totalSeats,
        selectedSeats: initialSelection.selectedSeats?.length
      } : null,
      customLayout: customLayout ? 'Custom layout provided' : null,
      forceExactLayout
    });
    
    // Get theme functionality
    const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses, theme } = useGdyupTheme();
    
    // Local state
    const [visualizerOpen, setVisualizerOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [layout, setLayout] = useState<SeatLayout | undefined>(defaultLayout || customLayout);
    const [skipPositions, setSkipPositions] = useState<string[]>(layout?.skipPositions || []);
    const [selectedSeats, setSelectedSeats] = useState<string[]>(initialSelection?.selectedSeats || []);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const seatsRef = useRef<Record<string, HTMLDivElement | null>>({});
    const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
    const selectoRef = useRef<Selecto>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const [selectionMode, setSelectionMode] = useState<'tap' | 'drag'>('tap');
    
    // State for loading layout data
    const [error, setError] = useState<string | null>(null);

    // State for visibility
    const [isVisible, setIsVisible] = useState(true);

    // Calculate appropriate seat size based on layout
    const seatSize = useMemo(() => {
      if (!layout || !containerDimensions.width || !containerDimensions.height) return DEFAULT_SEAT_SIZE;
      
      // Ensure layout values are valid numbers
      const validRows = Math.max(1, layout.rows || 1);
      const validSeatsPerRow = Math.max(1, layout.seatsPerRow || 1);
      const validWidth = Math.max(100, containerDimensions.width);
      const validHeight = Math.max(100, containerDimensions.height);
      
      // Calculate max size by width with safety checks
      const maxSizeByWidth = Math.floor(
        (validWidth - 40) / validSeatsPerRow
      );
      
      // Calculate max size by height with safety checks
      const maxSizeByHeight = Math.floor(
        (validHeight - 40) / validRows
      );
      
      // Use the smaller constraint and ensure it's a valid number
      const calculatedSize = Math.min(maxSizeByWidth, maxSizeByHeight, LARGE_SEAT_SIZE);
      
      // Ensure minimum size and that result is a finite number
      const finalSize = Math.max(calculatedSize, MIN_SEAT_SIZE);
      
      // Validate the final result
      if (!isFinite(finalSize) || isNaN(finalSize)) {
        console.warn('[JetSeatVisualizer] Invalid seat size calculated, using default');
        return DEFAULT_SEAT_SIZE;
      }
      
      return finalSize;
    }, [containerDimensions, layout]);

    // Add refs to avoid stale closures
    const isMounted = useRef(true);
    const isUpdatingRef = useRef(false); // Add a ref to track update state

    // Add debug logging - memoize to prevent dependency changes
    const debugLog = useCallback((message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[JetSeatVisualizer] ${message}`, data || '');
      }
    }, []);

    // IMPROVED: Generate all valid seat IDs - memoized for performance with better error handling
    const generateAllSeatIds = useCallback(() => {
      if (!layout || !layout.rows || !layout.seatsPerRow) return [];
      
      const allSeats: string[] = [];
      
      try {
        for (let row = 0; row < layout.rows; row++) {
          for (let col = 0; col < layout.seatsPerRow; col++) {
            const position = `${row},${col}`;
            
            // Skip positions that should be excluded
            if (skipPositions.includes(position)) continue;
            
            const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
            allSeats.push(`${rowLetter}${col + 1}`);
          }
        }
      } catch (err) {
        console.error(`[JetSeatVisualizer] Error generating seat IDs:`, err);
        // Return empty array if error occurs
        return [];
      }
      
      return allSeats;
    }, [layout, skipPositions]);

    // Update parent component with selection changes - debounced for performance
    const updateParentComponent = useMemo(() => debounce(() => {
      if (!onChange) return;
      debugLog('Notifying parent onChange with selectedSeats:', selectedSeats);
      // Call the onChange callback with the current internal selected seats
      onChange(selectedSeats);
    }, 100), [onChange, selectedSeats, debugLog]);

    // Calculate layout based on totalSeats
    const generateOptimalLayout = useCallback((seatCount: number) => {
      // Skip if we don't have a valid seat count
      if (!seatCount || seatCount <= 0) return null;
      
      console.log(`[generateOptimalLayout] Creating layout for ${seatCount} seats`);
      
      // Generate layout based on seat count
      let rows, seatsPerRow;
      let skipPositions: string[] = [];
      
      // For jets with different seat counts, determine an optimal layout
      if (seatCount <= 6) {
        // Small jets: 2-3 seats per row
        seatsPerRow = Math.min(3, seatCount);
        rows = Math.ceil(seatCount / seatsPerRow);
      } else if (seatCount <= 9) {
        // Medium jets: 3 seats per row
        seatsPerRow = 3;
        rows = Math.ceil(seatCount / seatsPerRow);
      } else if (seatCount <= 12) {
        // Standard configuration: 4 seats per row with aisle
        seatsPerRow = 4;
        rows = Math.ceil(seatCount / seatsPerRow);
        
        // Add an aisle in the middle (by skipping middle seats)
        if (seatsPerRow >= 4) {
          // For each row, skip the middle-right seat to create an aisle
          for (let r = 0; r < rows; r++) {
            skipPositions.push(`${r},${Math.floor(seatsPerRow / 2)}`);
          }
        }
      } else if (seatCount === 14) {
        // Special case for 14 seats: 4 seats per row for 3 rows, 2 seats in the last row with wide aisle
        seatsPerRow = 5; // We'll use 5 columns but skip the middle one
        rows = 4; // 3 full rows with 4 seats each + 1 partial row with 2 seats
        
        // Skip the middle position in all rows to create an aisle
        for (let r = 0; r < rows; r++) {
          skipPositions.push(`${r},2`); // Skip middle seat (index 2) in each row
        }
        
        // For the last row, also skip seats on both sides of the aisle leaving only 2 seats
        skipPositions.push(`3,0`); // Skip far-left seat in last row
        skipPositions.push(`3,4`); // Skip far-right seat in last row
      } else if (seatCount <= 16) {
        // Larger jets: 5 seats per row with aisle
        seatsPerRow = 5;
        rows = Math.ceil(seatCount / seatsPerRow);
        
        // Add an aisle in the middle
        if (seatsPerRow >= 5) {
          // For each row, skip the middle seat to create an aisle
          for (let r = 0; r < rows; r++) {
            skipPositions.push(`${r},${Math.floor(seatsPerRow / 2)}`);
          }
        }
      } else {
        // Very large jets: 6 seats per row with aisle
        seatsPerRow = 6;
        rows = Math.ceil(seatCount / seatsPerRow);
        
        // Add an aisle in the middle
        if (seatsPerRow >= 6) {
          // For each row, skip two middle seats to create a wider aisle
          for (let r = 0; r < rows; r++) {
            skipPositions.push(`${r},${Math.floor(seatsPerRow / 2) - 1}`);
            skipPositions.push(`${r},${Math.floor(seatsPerRow / 2)}`);
          }
        }
      }
      
      // Calculate total grid positions excluding aisle (skipped positions)
      const totalPositions = rows * seatsPerRow - skipPositions.length;
      
      // For cases where the grid has more positions than needed seats
      if (totalPositions > seatCount) {
        // Calculate how many extra positions to skip
        const extraToSkip = totalPositions - seatCount;
        
        // Skip positions from the back of the aircraft (last row, right to left)
        let skipped = 0;
        for (let r = rows - 1; r >= 0 && skipped < extraToSkip; r--) {
          for (let c = seatsPerRow - 1; c >= 0 && skipped < extraToSkip; c--) {
            const posStr = `${r},${c}`;
            // Only add if not already in skipPositions
            if (!skipPositions.includes(posStr)) {
              skipPositions.push(posStr);
              skipped++;
            }
          }
        }
      }
      
      console.log(`[generateOptimalLayout] Created ${rows}x${seatsPerRow} layout with ${skipPositions.length} skipped positions for ${seatCount} seats`);
      
      // Return the complete layout object
      return {
        rows,
        seatsPerRow,
        layoutType: 'standard' as const, // Use as const to fix the type
        totalSeats: seatCount,
        skipPositions
      };
    }, []);

    // Update layout based on totalSeats or customLayout
    useEffect(() => {
      // Add guard against re-entrance
      if (isUpdatingRef.current) {
        console.log(`[JetSeatVisualizer] Layout effect skipped - update already in progress`);
        return;
      }

      console.log(`[JetSeatVisualizer] Layout effect triggered with totalSeats=${totalSeats}`);
      
      // Set update flag to prevent re-entrance
      isUpdatingRef.current = true;
      
      try {
        // If we have a custom layout, use it
        if (customLayout) {
          console.log('[JetSeatVisualizer] Using custom layout:', customLayout);
          
          // Deep compare the layouts to avoid unnecessary updates
          const layoutChanged = 
            layout?.rows !== customLayout.rows || 
            layout?.seatsPerRow !== customLayout.seatsPerRow ||
            layout?.layoutType !== customLayout.layoutType ||
            layout?.totalSeats !== customLayout.totalSeats;
          
          if (layoutChanged) {
            console.log('[JetSeatVisualizer] Applying custom layout due to layout changes');
            setLayout(customLayout);
          }
          
          // Support both direct skipPositions prop and seatMap.skipPositions
          // This ensures compatibility with both API formats and inline definitions
          if (customLayout.skipPositions && customLayout.skipPositions.length > 0) {
            console.log('[JetSeatVisualizer] Using direct skipPositions:', customLayout.skipPositions);
            setSkipPositions(customLayout.skipPositions);
          } 
          else if (customLayout.seatMap?.skipPositions && customLayout.seatMap.skipPositions.length > 0) {
            // Convert number[][] to string[] for compatibility
            const formattedSkips = customLayout.seatMap.skipPositions.map(pos => 
              Array.isArray(pos) ? pos.join(',') : pos
            );
            console.log('[JetSeatVisualizer] Using seatMap.skipPositions:', formattedSkips);
            setSkipPositions(formattedSkips);
          }
        }
        // If no custom layout and we have totalSeats, generate a layout
        else if (totalSeats && totalSeats > 0) {
          console.log(`[JetSeatVisualizer] Generating layout for ${totalSeats} seats`);
          
          // Generate the layout
          const generatedLayout = generateOptimalLayout(totalSeats);
          
          if (generatedLayout) {
            console.log('[JetSeatVisualizer] Setting generated layout:', generatedLayout);
            setLayout(generatedLayout);
            // Skip positions are included in the generated layout
            setSkipPositions(generatedLayout.skipPositions || []);
          } else {
            console.warn('[JetSeatVisualizer] Failed to generate layout');
            // Fallback to a simple layout if generation fails
            const fallbackLayout = {
              rows: Math.ceil(totalSeats / 3),
              seatsPerRow: 3,
              layoutType: 'standard' as const, // Use as const to fix the type
              totalSeats: totalSeats,
              skipPositions: []
            };
            setLayout(fallbackLayout);
            setSkipPositions([]);
          }
        } 
        // Only apply default layout if no layout exists
        else if (!layout) {
          // Default fallback layout when no totalSeats or customLayout is provided
          console.log('[JetSeatVisualizer] Using default fallback layout');
          const defaultLayout = {
            rows: 3,
            seatsPerRow: 3,
            layoutType: 'standard' as const, // Use as const to fix the type
            totalSeats: 8,
            skipPositions: []
          };
          setLayout(defaultLayout);
          setSkipPositions([]);
        }
      } catch (err) {
        console.error('[JetSeatVisualizer] Error in layout effect:', err);
        if (onError) {
          onError(err as Error);
        }
      } finally {
        // Clear update flag with timeout to prevent React batching issues
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, [customLayout, totalSeats, generateOptimalLayout, onError]);

    // Create default 50/50 seat split function - enhanced for better balance
    const createDefault5050Split = useCallback(() => {
      // If the visualizer is not ready or no seats available, skip
      if (!layout || !layout.rows || !layout.seatsPerRow) return [];
      
      // Calculate the effective total seats
      const effectiveTotalSeats = totalSeats || 
        layout.totalSeats || 
        (layout.rows * layout.seatsPerRow - skipPositions.length);
      
      if (effectiveTotalSeats <= 0) return [];
      
      // Calculate 50% of the seats (rounded up for owner)
      const halfCount = Math.ceil(effectiveTotalSeats / 2);
      console.log(`[JetSeatVisualizer] createDefault5050Split: ${halfCount} of ${effectiveTotalSeats} seats`);
      
      // Generate all possible seat IDs 
      const allSeatIds = generateAllSeatIds();
      
      // Special handling for different seating configurations
      // For any configuration, distribute seats evenly across rows for a balanced look
      const selectedSeats: string[] = [];
      const rowGroups: Record<string, string[]> = {};
      
      // Group seats by row
      allSeatIds.forEach(seatId => {
        const row = seatId.charAt(0);
        if (!rowGroups[row]) rowGroups[row] = [];
        rowGroups[row].push(seatId);
      });
      
      // Get rows in order
      const rows = Object.keys(rowGroups).sort();
      
      // Take seats from front to back, evenly distributed
      let remaining = halfCount;
      for (const row of rows) {
        if (remaining <= 0) break;
        const seatsInRow = rowGroups[row];
        // Take approximately half of each row's seats
        const seatsToTake = Math.min(Math.ceil(seatsInRow.length / 2), remaining);
        
        // Take seats from left to right within the row
        selectedSeats.push(...seatsInRow.slice(0, seatsToTake));
        remaining -= seatsToTake;
      }
      
      return selectedSeats;
    }, [layout, skipPositions.length, totalSeats, generateAllSeatIds]);

    // Initialize with appropriate seat selection
    useEffect(() => {
      // Prevent running if not mounted or stale closures
      if (!isMounted.current) return;
      
      // Wait until layout and visualizer are ready
      if (isLoading || !layout) return;
      
      // Skip initialization if we already have selected seats
      if (selectedSeats.length > 0) return;
      
      // Set flag to prevent re-entrance
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;
      
      try {
        // Initialize with a 50/50 split by default
        const default5050Selection = createDefault5050Split();
        if (default5050Selection.length > 0) {
          // Update internal state
          setSelectedSeats(default5050Selection);
          
          // Schedule parent notification with timeout to avoid React batching issues
          setTimeout(() => {
            if (onChange && isMounted.current) {
              onChange(default5050Selection);
            }
            // Clear update flag to allow future updates
            isUpdatingRef.current = false;
          }, 0);
        } else {
          // Reset flag if no action taken
          isUpdatingRef.current = false;
        }
      } catch (err) {
        console.error(`[JetSeatVisualizer] Error in seat initialization:`, err);
        isUpdatingRef.current = false;
      }
    }, [isLoading, layout, selectedSeats.length, createDefault5050Split, onChange]);

    // Handle seat click function - improved with direct updates
    const handleSeatClick = useCallback((seatId: string) => {
      if (readOnly || selectionDisabled) return;
      
      try {
        // Toggle the selected state
        let newSelectedSeats: string[];
        
        if (selectedSeats.includes(seatId)) {
          // Remove seat from selection
          newSelectedSeats = selectedSeats.filter(id => id !== seatId);
        } else {
          // Add seat to selection
          newSelectedSeats = [...selectedSeats, seatId];
        }
        
        // Update state immediately
        setSelectedSeats(newSelectedSeats);
        
        // Notify parent component
        if (onChange) {
          onChange(newSelectedSeats);
        }
      } catch (err) {
        console.error(`[JetSeatVisualizer] Error handling seat click:`, err);
      }
    }, [onChange, readOnly, selectedSeats, selectionDisabled]);

    // Render individual seat with improved visual styles that use the theme system
    const renderSeat = (row: number, col: number) => {
      const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
      const seatId = `${rowLetter}${col + 1}`;
      const position = `${row},${col}`;
      
      // Check if this position should be skipped
      if (skipPositions.includes(position)) {
        return null;
      }
      
      const isSelected = selectedSeats.includes(seatId);
      const isDisabled = selectionDisabled || readOnly;
      
      // Apply appropriate styling based on selection state using theme system
      const seatClasses = cn(
        "relative flex items-center justify-center transition-all duration-150 select-none seat",
        isSelected ? "selected" : "",
        "rounded-lg",
        isDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
      );
      
      // Determine if the seat is selectable
      const isSelectable = !isDisabled;
      
      return (
        <div
          key={seatId}
          ref={(el) => { seatsRef.current[seatId] = el; }}
          data-seat-id={seatId}
          data-key={seatId}
          style={{
            width: `${isFinite(seatSize) && !isNaN(seatSize) ? seatSize : DEFAULT_SEAT_SIZE}px`,
            height: `${isFinite(seatSize) && !isNaN(seatSize) ? seatSize : DEFAULT_SEAT_SIZE}px`,
            margin: `${isFinite(seatSize) && !isNaN(seatSize) ? Math.max(2, seatSize / 10) : 4}px`,
            fontSize: `${isFinite(seatSize) && !isNaN(seatSize) ? Math.max(10, seatSize / 2.5) : 16}px`,
            lineHeight: `${isFinite(seatSize) && !isNaN(seatSize) ? seatSize : DEFAULT_SEAT_SIZE}px`
          }}
          className={seatClasses}
          onClick={() => {
            if (selectionMode === 'tap' && isSelectable && !readOnly) {
              handleSeatClick(seatId);
            }
          }}
        >
          {seatId}
        </div>
      );
    };

    // Improved layout rendering with better seat visualization
    const renderSeatGrid = () => {
      if (!layout || layout.rows === undefined || layout.seatsPerRow === undefined) {
        return (
          <div className="h-32 w-full flex items-center justify-center">
            <div className={cn(
              "border rounded-md p-2 text-sm",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border",
              getThemedTextClasses('muted')
            )}>
              No seat layout available
            </div>
          </div>
        );
      }
      
      // Initialize refs for DOM elements if needed
      if (Object.keys(seatsRef.current).length === 0) {
        // Reset on new render
        seatsRef.current = {};
      }
      
      // Prepare grid items for rendering
      const gridItems: React.ReactNode[] = [];
      
      // Calculate layout parameters
      const hasAisle = layout.rows > 1 && layout.seatsPerRow > 2;
      const isEvenSeatsPerRow = layout.seatsPerRow % 2 === 0;
      const middlePoint = Math.floor(layout.seatsPerRow / 2);
      
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
      
      // Get the current theme for styling
      const currentTheme = document?.documentElement?.dataset?.theme || 'default';

      // Determine the actual grid column for a seat, accounting for the aisle
      const getGridColumn = (col: number): number => {
        if (!hasAisle) return col + 1;
        
        if (isEvenSeatsPerRow) {
          // For even layouts (e.g., 4 seats per row with aisle in the middle)
          return col < middlePoint ? col + 1 : col + 2;
        } else {
          // For odd layouts
          return col < Math.ceil(layout.seatsPerRow / 2) ? col + 1 : col + 2;
        }
      };
      
      // Determine the aisle position
      const aisleColumn = isEvenSeatsPerRow ? middlePoint + 1 : Math.ceil(layout.seatsPerRow / 2) + 1;

      // Prepare the grid with aisle
      for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.seatsPerRow; col++) {
          const posString = `${row},${col}`;
          
          // Skip positions defined as empty
          if (skipPositions.includes(posString)) {
            continue;
          }
          
          const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
          const seatId = `${rowLetter}${col + 1}`;
          const isSelected = selectedSeats.includes(seatId);
          const isSelectable = isSeatSelectable(seatId);
          
          // Apply appropriate styling based on seat state
          let seatClass = cn(
            `${sizingClass} flex items-center justify-center rounded border transition-colors relative seat`,
            isSelected 
              ? "selected" // Use the proper class that's styled in our global CSS
              : "",
            isSelectable 
              ? "cursor-pointer hover:brightness-110" 
              : "opacity-50 cursor-not-allowed"
          );
          
          // Better styling for selected and unselected seats
          const seatStyle: React.CSSProperties = {
            gridColumn: getGridColumn(col),
            gridRow: row + 1,
            zIndex: isSelected ? 2 : 1,
          };
          
          gridItems.push(
            <div
              key={seatId}
              className={seatClass}
              data-key={seatId}
              data-seat-id={seatId}
              onClick={() => {
                if (selectionMode === 'tap' && isSelectable && !readOnly) {
                  handleSeatClick(seatId);
                }
              }}
              aria-label={`Seat ${seatId}`}
              role="button"
              tabIndex={isSelectable ? 0 : -1}
              ref={(el) => {
                if (el) seatsRef.current[seatId] = el;
              }}
              style={seatStyle}
            >
              {seatId}
            </div>
          );
        }
        
        // Add aisle markers if we have an aisle
        if (hasAisle) {
          gridItems.push(
            <div
              key={`aisle-${row}`}
              className={cn(getThemedTextClasses('muted'), "flex items-center justify-center opacity-30 text-xs")}
              style={{
                gridColumn: aisleColumn,
                gridRow: row + 1
              }}
            >
              ⬛
            </div>
          );
        }
      }
      
      return (
        <div
          className={cn(
            "seat-grid relative w-full overflow-hidden rounded-lg transition-colors p-3",
            getThemedBackgroundClasses('card'),
            "border border-gdyup-border shadow-inner"
          )}
          style={{ width: '100%' }}
          ref={containerRef}
        >
          <div className="flex flex-wrap justify-center items-center h-full">
            <div
              className="grid w-full gap-2 md:gap-3"
              style={{ 
                gridTemplateColumns: `repeat(${layout.seatsPerRow}, 1fr)`, 
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
        // Ensure count is non-negative
        if (count < 0) count = 0;
        
        // Get all valid seat IDs
        const allSeatIds = generateAllSeatIds();
        
        // Validate count doesn't exceed available seats
        const validCount = Math.min(count, allSeatIds.length);
        
        if (validCount === 0) {
          // Clear selection if count is 0
          setSelectedSeats([]);
          
          // Notify parent about the change
          if (onChange) {
            onChange([]);
          }
          return;
        }
        
        try {
          // Implement a balanced seat selection algorithm with stability
          // This prioritizes seats in a visually pleasing way:
          // 1. Start with front row and move backward
          // 2. Within each row, fill seats from left to right
          // 3. Distribute seats evenly across rows
          
          // Group seats by row
          const rowMap: Record<string, string[]> = {};
          
          allSeatIds.forEach(seatId => {
            const row = seatId.charAt(0); // A, B, C, etc.
            if (!rowMap[row]) rowMap[row] = [];
            rowMap[row].push(seatId);
          });
          
          // Sort rows (A, B, C, etc.)
          const rows = Object.keys(rowMap).sort();
          
          // Calculate ideal seats per row for even distribution
          const rowCount = rows.length;
          
          // For stability, always use the same algorithm regardless of count
          const selectedSeats: string[] = [];
          
          // First fill front-to-back, left-to-right up to validCount seats
          for (const row of rows) {
            if (selectedSeats.length >= validCount) break;
            
            const seatsInRow = rowMap[row];
            const seatsToSelectFromRow = Math.min(seatsInRow.length, validCount - selectedSeats.length);
            
            // Select seats from left to right in the row
            for (let i = 0; i < seatsToSelectFromRow; i++) {
              selectedSeats.push(seatsInRow[i]);
            }
          }
          
          // Update the internal state with the new selection
          setSelectedSeats(selectedSeats);
          
          // Notify parent about the change immediately 
          if (onChange) {
            onChange(selectedSeats);
          }
        } catch (err) {
          console.error(`[JetSeatVisualizer] Error selecting seats:`, err);
          // Fallback - simply take the first n seats if algorithm fails
          const fallbackSeats = allSeatIds.slice(0, validCount);
          setSelectedSeats(fallbackSeats);
          
          if (onChange && fallbackSeats.length > 0) {
            onChange(fallbackSeats);
          }
        }
      },
      getAllSeats: () => generateAllSeatIds()
    }));

    // Main render
    return (
      <div className={cn("jet-seat-visualizer relative transition-all", className)}>
        {/* The styles are now in the centralized theme system in gdyup.css */}
        
        {isLoading ? (
          <div className={cn(
            "flex items-center justify-center p-6 rounded-lg border animate-pulse h-48 transition-colors",
            getThemedBackgroundClasses('card'),
            "border-gdyup-border"
          )}>
            <span className={getThemedTextClasses('muted')}>Loading seat configuration...</span>
          </div>
        ) : error ? (
          <div className={cn(
            "flex items-center justify-center p-4 rounded-lg border shadow-sm transition-colors",
            "bg-red-900/20 text-red-300 border-red-900/30"
          )}>
            <AlertTriangle className="w-5 h-5 mr-2 opacity-70" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* Main seat grid */}
            {renderSeatGrid()}

            {/* Controls */}
            {showControls && !readOnly && (
              <div className={cn(
                "flex flex-col space-y-2 mt-4 p-3 rounded-lg border transition-colors",
                getThemedBackgroundClasses('card'),
                "border-gdyup-border"
              )}>
                <div className="flex justify-between items-center">
                  <div className={getThemedTextClasses('secondary') + " text-sm font-medium"}>
                    Selection Mode
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectionMode('tap')}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium transition-colors border",
                        selectionMode === 'tap' 
                          ? getThemedBackgroundClasses('primary') + ' ' + getThemedTextClasses('inverse') + ' border-gdyup-primary' 
                          : 'bg-gdyup-bg-dark ' + getThemedTextClasses() + ' border-gdyup-border hover:bg-gdyup-bg-card'
                      )}
                    >
                      <MousePointer className="w-4 h-4" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectionMode('drag')}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium transition-colors border",
                        selectionMode === 'drag' 
                          ? getThemedBackgroundClasses('primary') + ' ' + getThemedTextClasses('inverse') + ' border-gdyup-primary' 
                          : 'bg-gdyup-bg-dark ' + getThemedTextClasses() + ' border-gdyup-border hover:bg-gdyup-bg-card'
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
                  className={cn(
                    "px-3 py-1.5 mt-1 text-sm rounded font-medium transition-colors border flex items-center justify-center",
                    getThemedButtonClasses('secondary')
                  )}
                >
                  <CheckCheck className="w-4 h-4 mr-1 opacity-70" />
                  <span>Reset to Zero</span>
                </button>
              </div>
            )}
            
            {/* Summary information */}
            {showSummary && (
              <div className={cn(
                "mt-3 p-2 text-sm rounded-md",
                getThemedBackgroundClasses('card')
              )}>
                <div className="flex justify-between">
                  <span className={getThemedTextClasses()}>Selected:</span>
                  <span className={cn(getThemedTextClasses(), "font-medium")}>{selectedSeats.length} / {generateAllSeatIds().length}</span>
                </div>
              </div>
            )}
            
            {/* Legend */}
            {showLegend && (
              <div className={cn(
                "mt-3 text-xs grid grid-cols-2 gap-x-2 gap-y-1",
                getThemedTextClasses()
              )}>
                <div className="jet-seat-visualizer-legend-item">
                  <div className="jet-seat-visualizer-legend-dot selected"></div>
                  <span>Selected</span>
                </div>
                <div className="jet-seat-visualizer-legend-item">
                  <div className="jet-seat-visualizer-legend-dot available"></div>
                  <span>Available</span>
                </div>
                {Object.keys(seatConfig).length > 0 && (
                  <>
                    <div className="jet-seat-visualizer-legend-item">
                      <div className="jet-seat-visualizer-legend-dot unavailable"></div>
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
                .map(el => el.getAttribute('data-seat-id') as string)
                .filter((id: string | null): id is string => id !== null);

              // Update internal state ONLY based on the *newly* dragged selection
              // This assumes Selecto gives the total selection in the event,
              // If it gives only the *added* selection, logic needs adjustment.
              // Assuming e.selected is the *complete* list of selected elements in the drag area:
              setSelectedSeats(newSelectedIds);
              console.log(`[Visualizer handleSelectoSelect] New internal selectedSeats state:`, newSelectedIds);

              // Call onChange prop directly with the new state from the drag
              if (onChange) {
                  console.log(`[Visualizer handleSelectoSelect] Calling onChange prop with:`, newSelectedIds);
                  onChange(newSelectedIds);
              }
            }}
            onSelectEnd={() => {
              if (onChange) {
                onChange(selectedSeats);
              }
            }}
            dragContainer={document.body}
            boundContainer={containerRef.current}
            className="!fixed" // Override Selecto's positioning
          />
        )}
      </div>
    );
  }
);

JetSeatVisualizer.displayName = 'JetSeatVisualizer';

export default JetSeatVisualizer; 


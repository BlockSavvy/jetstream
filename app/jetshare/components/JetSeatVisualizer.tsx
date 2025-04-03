'use client';

import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

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

export interface SplitConfiguration {
  jetId: string;
  splitOrientation: 'horizontal' | 'vertical';
  splitRatio: string;
  splitPercentage: number;
  allocatedSeats: {
    front?: string[];
    back?: string[];
    left?: string[];
    right?: string[];
  };
}

// Props interface
export interface JetSeatVisualizerProps {
  jetId: string;
  defaultLayout?: SeatLayout;
  onChange?: (config: SplitConfiguration) => void;
  initialSplit?: SplitConfiguration;
  readOnly?: boolean;
  className?: string;
  showControls?: boolean;
  seatRatio?: number;
  onRatioChange?: (ratio: number) => void;
  totalSeats?: number;
}

// Export the component ref type for external usage
export type JetSeatVisualizerRef = {
  openVisualizer: () => void;
  closeVisualizer: () => void;
  updateRatio: (ratio: number) => void;
  getLayoutInfo: () => {
    totalSeats: number;
    rows: number;
    seatsPerRow: number;
    layoutType: string;
    jetId: string;
  };
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

// Add a seat split summary component
const SeatSplitSummary = ({ 
  splitConfiguration, 
  totalSeats,
  splitOrientation,
  splitPercentage
}: { 
  splitConfiguration: SplitConfiguration | null;
  totalSeats: number;
  splitOrientation: 'horizontal' | 'vertical';
  splitPercentage: number;
}) => {
  const firstSectionCount = Math.round((splitPercentage / 100) * totalSeats);
  const secondSectionCount = totalSeats - firstSectionCount;
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 mb-4 text-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">Seat Split Summary</span>
        <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md text-xs">
          Total Seats: {totalSeats}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
          <span className="text-xs font-medium block mb-1">
            {splitOrientation === 'horizontal' ? 'Front Section' : 'Left Section'}
          </span>
          <span className="text-lg font-bold">{firstSectionCount} seats</span>
          <span className="text-xs text-gray-500 block">{splitPercentage}%</span>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          <span className="text-xs font-medium block mb-1">
            {splitOrientation === 'horizontal' ? 'Back Section' : 'Right Section'}
          </span>
          <span className="text-lg font-bold">{secondSectionCount} seats</span>
          <span className="text-xs text-gray-500 block">{100 - splitPercentage}%</span>
        </div>
      </div>
    </div>
  );
};

// Main component implementation
const JetSeatVisualizer = forwardRef<JetSeatVisualizerRef, JetSeatVisualizerProps>(
  ({ 
    jetId, 
    defaultLayout, 
    onChange, 
    initialSplit, 
    readOnly = false, 
    className,
    showControls = true,
    seatRatio,
    onRatioChange,
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

    // State for split configuration
    const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>(
      initialSplit?.splitOrientation || 'horizontal'
    );

    // State for grid calculations and crosshair position
    const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });
    const [seatSize, setSeatSize] = useState(0);
    const [crosshairPosition, setCrosshairPosition] = useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    // State for split percentage slider
    const [splitPercentage, setSplitPercentage] = useState<number>(
      initialSplit?.splitPercentage || 50
    );

    // Flag for preventing update loops
    const isUpdatingRef = useRef(false);

    // Add a ref to track previous values and prevent unnecessary updates
    const previousValueRef = useRef<{
      x: number;
      y: number;
      orientation: 'horizontal' | 'vertical';
      percentage: number;
    }>({
      x: 0,
      y: 0,
      orientation: initialSplit?.splitOrientation || 'horizontal',
      percentage: initialSplit?.splitPercentage || 50
    });

    // Add state to track seats that should be skipped (not displayed)
    const [skipPositions, setSkipPositions] = useState<number[][]>([]);

    // Calculate the split ratio
    const calculateSplitRatio = useCallback(() => {
      // Use the percentage directly for a cleaner calculation
      return `${splitPercentage}/${100 - splitPercentage}`;
    }, [splitPercentage]);

    // Calculate seat allocation based on crosshair position and handle odd numbers of seats
    const calculateSeatAllocation = useCallback(() => {
      const seats: SplitConfiguration['allocatedSeats'] = {
        front: [],
        back: [],
        left: [],
        right: [],
      };

      // Get actual number of seats (accounting for skipped positions)
      const actualTotalSeats = layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
      let firstSectionCount = 0;
      
      if (splitOrientation === 'horizontal') {
        // Calculate how many seats should be in the front section based on percentage
        firstSectionCount = Math.round((splitPercentage / 100) * actualTotalSeats);
        
        // Ensure we don't end up with 0 seats in either section
        firstSectionCount = Math.max(1, Math.min(firstSectionCount, actualTotalSeats - 1));
        
        // We need to dynamically calculate how many rows this represents
        let frontSeatCount = 0;
        let rowsInFirstSection = 0;
        
        // Count seats row by row until we reach the target count
        for (let row = 0; row < layout.rows && frontSeatCount < firstSectionCount; row++) {
          let seatsInThisRow = 0;
          for (let col = 0; col < layout.seatsPerRow; col++) {
            // Skip this position if it's in the skipPositions array
            if (!isSkippedPosition(row, col)) {
              seatsInThisRow++;
            }
          }
          frontSeatCount += seatsInThisRow;
          rowsInFirstSection++;
        }
        
        // Calculate actual allocation of seats
        let frontCount = 0;
        let backCount = 0;
        
        for (let row = 0; row < layout.rows; row++) {
          for (let col = 0; col < layout.seatsPerRow; col++) {
            // Skip this position if it's in the skipPositions array
            if (isSkippedPosition(row, col)) continue;
            
            const seatId = generateSeatId(row, col);
            
            if (row < rowsInFirstSection && frontCount < firstSectionCount) {
              seats.front!.push(seatId);
              frontCount++;
            } else {
              seats.back!.push(seatId);
              backCount++;
            }
            
            // Handle left/right allocation for completeness
            if (col < Math.ceil(layout.seatsPerRow / 2)) {
              seats.left!.push(seatId);
            } else {
              seats.right!.push(seatId);
            }
          }
        }
      } else {
        // Vertical split (left/right)
        firstSectionCount = Math.round((splitPercentage / 100) * actualTotalSeats);
        
        // Ensure we don't end up with 0 seats in either section
        firstSectionCount = Math.max(1, Math.min(firstSectionCount, actualTotalSeats - 1));
        
        // Calculate column split position (more complex with skip positions)
        let leftSeatCount = 0;
        let colsInFirstSection = 0;
        
        // Count seats column by column until we reach the target count
        for (let col = 0; col < layout.seatsPerRow && leftSeatCount < firstSectionCount; col++) {
          let seatsInThisCol = 0;
          for (let row = 0; row < layout.rows; row++) {
            // Skip this position if it's in the skipPositions array
            if (!isSkippedPosition(row, col)) {
              seatsInThisCol++;
            }
          }
          leftSeatCount += seatsInThisCol;
          colsInFirstSection++;
        }
        
        // Calculate actual allocation of seats
        let leftCount = 0;
        let rightCount = 0;
        
        for (let row = 0; row < layout.rows; row++) {
          for (let col = 0; col < layout.seatsPerRow; col++) {
            // Skip this position if it's in the skipPositions array
            if (isSkippedPosition(row, col)) continue;
            
            const seatId = generateSeatId(row, col);
            
            // Handle front/back allocation for completeness
            if (row < Math.ceil(layout.rows / 2)) {
              seats.front!.push(seatId);
            } else {
              seats.back!.push(seatId);
            }
            
            if (col < colsInFirstSection && leftCount < firstSectionCount) {
              seats.left!.push(seatId);
              leftCount++;
            } else {
              seats.right!.push(seatId);
              rightCount++;
            }
          }
        }
      }

      return seats;
    }, [layout, splitPercentage, splitOrientation, skipPositions]);

    // Function to check if a position should be skipped
    const isSkippedPosition = useCallback((row: number, col: number): boolean => {
      return skipPositions.some(pos => pos[0] === row && pos[1] === col);
    }, [skipPositions]);

    // Prepare configuration object for the onChange callback
    const prepareConfiguration = useCallback((): SplitConfiguration => {
      return {
        jetId,
        splitOrientation,
        splitRatio: calculateSplitRatio(),
        splitPercentage,
        allocatedSeats: calculateSeatAllocation(),
      };
    }, [jetId, splitOrientation, calculateSplitRatio, calculateSeatAllocation, splitPercentage]);

    // Update the updateParentComponent function to use memoization with useCallback
    const updateParentComponent = useCallback(() => {
      if (!onChange || isUpdatingRef.current) return;
      
      // Call the onChange callback with the current configuration
      onChange(prepareConfiguration());
      
      // Call onRatioChange if provided
      if (onRatioChange) {
        onRatioChange(splitPercentage);
      }
    }, [onChange, prepareConfiguration, onRatioChange, splitPercentage]);

    // Update the crosshair position based on the split percentage
    const updateCrosshairFromPercentage = useCallback(() => {
      if (isUpdatingRef.current) return;
      
      isUpdatingRef.current = true;
      
      // Get actual number of seats (accounting for skipped positions)
      const actualTotalSeats = layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
      
      if (splitOrientation === 'horizontal') {
        // Calculate how many rows should be in the front section
        const frontSeatCount = Math.round((splitPercentage / 100) * actualTotalSeats);
        
        // Count seats row by row to find the split position
        let currentSeatCount = 0;
        let rowsInFront = 0;
        
        for (let row = 0; row < layout.rows && currentSeatCount < frontSeatCount; row++) {
          let seatsInThisRow = 0;
          for (let col = 0; col < layout.seatsPerRow; col++) {
            if (!isSkippedPosition(row, col)) {
              seatsInThisRow++;
            }
          }
          currentSeatCount += seatsInThisRow;
          rowsInFront++;
        }
        
        const yPosition = Math.min(rowsInFront * seatSize, gridDimensions.height);
        
        setCrosshairPosition(prev => ({
          ...prev,
          y: yPosition,
        }));
      } else {
        // Calculate how many columns should be in the left section
        const leftSeatCount = Math.round((splitPercentage / 100) * actualTotalSeats);
        
        // Count seats column by column to find the split position
        let currentSeatCount = 0;
        let colsInLeft = 0;
        
        for (let col = 0; col < layout.seatsPerRow && currentSeatCount < leftSeatCount; col++) {
          let seatsInThisCol = 0;
          for (let row = 0; row < layout.rows; row++) {
            if (!isSkippedPosition(row, col)) {
              seatsInThisCol++;
            }
          }
          currentSeatCount += seatsInThisCol;
          colsInLeft++;
        }
        
        const xPosition = Math.min(colsInLeft * seatSize, gridDimensions.width);
        
        setCrosshairPosition(prev => ({
          ...prev,
          x: xPosition,
        }));
      }
      
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }, [splitPercentage, splitOrientation, layout, seatSize, gridDimensions, skipPositions, isSkippedPosition]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      openVisualizer: () => setIsVisible(true),
      closeVisualizer: () => setIsVisible(false),
      updateRatio: (ratio: number) => {
        setSplitPercentage(ratio);
      },
      getLayoutInfo: () => {
        const totalSeats = layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
        return {
          totalSeats,
          rows: layout.rows,
          seatsPerRow: layout.seatsPerRow,
          layoutType: layout.layoutType,
          jetId: jetId
        };
      }
    }));

    // Add debug logging
    const debugLog = (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[JetSeatVisualizer] ${message}`, data || '');
      }
    };

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
    }, [jetId]);

    // Update dimensions when layout changes or component mounts
    useEffect(() => {
      // Set grid dimensions based on the number of rows/columns
      // These are base values that will be scaled by the container
      const baseGridWidth = layout.seatsPerRow * 40; // 40px per seat
      const baseGridHeight = layout.rows * 40; // 40px per seat
      
      setGridDimensions({
        width: baseGridWidth,
        height: baseGridHeight,
      });
      
      // Calculate seat size
      setSeatSize(40);
      
      // Set initial crosshair position in the middle
      if (!initialSplit) {
        setCrosshairPosition({
          x: baseGridWidth / 2,
          y: baseGridHeight / 2,
          width: 4, // Width of the crosshair line
          height: 4, // Height of the crosshair line
        });
      }
    }, [layout, initialSplit]);

    // Listen for external ratio changes
    useEffect(() => {
      if (seatRatio !== undefined && !isUpdatingRef.current && seatRatio !== splitPercentage) {
        setSplitPercentage(seatRatio);
      }
    }, [seatRatio, splitPercentage]);

    // Update when split percentage changes
    useEffect(() => {
      if (previousValueRef.current.percentage !== splitPercentage) {
        previousValueRef.current.percentage = splitPercentage;
        updateCrosshairFromPercentage();
      }
    }, [splitPercentage, updateCrosshairFromPercentage]);

    // Update total seats from props if provided
    useEffect(() => {
      if (totalSeats && totalSeats > 0) {
        // Calculate rows and columns based on total seats
        // For simplicity, we'll make a grid with approximately square dimensions
        const approxDimension = Math.ceil(Math.sqrt(totalSeats));
        
        setLayout(prev => ({
          ...prev,
          rows: Math.ceil(totalSeats / approxDimension),
          seatsPerRow: Math.min(approxDimension, totalSeats)
        }));
      }
    }, [totalSeats]);

    // Replace the problematic useEffect with a more controlled version
    useEffect(() => {
      if (isUpdatingRef.current) return;
      
      // Use setTimeout to debounce updates and break potential update cycles
      const timer = setTimeout(() => {
        updateParentComponent();
      }, 100); // Add a small debounce delay
      
      return () => clearTimeout(timer);
    }, [crosshairPosition, splitOrientation, splitPercentage, updateParentComponent]);

    // Initialize with initial split if provided
    useEffect(() => {
      if (!initialSplit || isUpdatingRef.current) return;
      
      isUpdatingRef.current = true;
      
      setSplitOrientation(initialSplit.splitOrientation);
      setSplitPercentage(initialSplit.splitPercentage || 
        (initialSplit.splitRatio ? parseInt(initialSplit.splitRatio.split('/')[0]) : 50));
      
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }, [initialSplit]);

    // Handle crosshair drag stop - update the percentage based on position
    const handleDragStop = (e: any, d: { x: number; y: number }) => {
      if (isUpdatingRef.current) return;
      
      isUpdatingRef.current = true;
      
      // Constrain to grid boundaries
      const x = Math.max(0, Math.min(d.x, gridDimensions.width));
      const y = Math.max(0, Math.min(d.y, gridDimensions.height));
      
      setCrosshairPosition(prev => ({
        ...prev,
        x,
        y,
      }));
      
      // Get actual number of seats (accounting for skipped positions)
      const actualTotalSeats = layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
      
      if (splitOrientation === 'horizontal') {
        // Find the row at crosshair position
        const rowAtCrosshair = Math.round(y / seatSize);
        
        // Count seats up to that row
        let seatsInFront = 0;
        for (let row = 0; row < Math.min(rowAtCrosshair, layout.rows); row++) {
          for (let col = 0; col < layout.seatsPerRow; col++) {
            if (!isSkippedPosition(row, col)) {
              seatsInFront++;
            }
          }
        }
        
        // Calculate percentage
        const newPercentage = Math.round((seatsInFront / actualTotalSeats) * 100);
        setSplitPercentage(Math.max(1, Math.min(99, newPercentage))); // Ensure between 1-99%
      } else {
        // Find the column at crosshair position
        const colAtCrosshair = Math.round(x / seatSize);
        
        // Count seats up to that column
        let seatsInLeft = 0;
        for (let col = 0; col < Math.min(colAtCrosshair, layout.seatsPerRow); col++) {
          for (let row = 0; row < layout.rows; row++) {
            if (!isSkippedPosition(row, col)) {
              seatsInLeft++;
            }
          }
        }
        
        // Calculate percentage
        const newPercentage = Math.round((seatsInLeft / actualTotalSeats) * 100);
        setSplitPercentage(Math.max(1, Math.min(99, newPercentage))); // Ensure between 1-99%
      }
      
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    };

    // Handle slider change
    const handleSliderChange = (value: number[]) => {
      if (isUpdatingRef.current) return;
      setSplitPercentage(value[0]);
    };

    // Toggle split orientation
    const toggleSplitOrientation = () => {
      if (isUpdatingRef.current) return;
      
      isUpdatingRef.current = true;
      setSplitOrientation(prev => {
        const newOrientation = prev === 'horizontal' ? 'vertical' : 'horizontal';
        
        // After changing orientation, we need to update the parent component
        setTimeout(() => {
          updateParentComponent();
          isUpdatingRef.current = false;
        }, 50);
        
        return newOrientation;
      });
    };

    // Set the orientation directly
    const setOrientation = (orientation: 'horizontal' | 'vertical') => {
      if (isUpdatingRef.current || orientation === splitOrientation) return;
      
      isUpdatingRef.current = true;
      setSplitOrientation(orientation);
      
      // After changing orientation, we need to update the parent component
      setTimeout(() => {
        updateParentComponent();
        isUpdatingRef.current = false;
      }, 50);
    };

    if (!isVisible) return null;

    return (
      <div className={cn("flex flex-col items-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md", className)}>
        {showControls && (
          <div className="w-full text-center mb-4">
            <h3 className="text-lg font-semibold">Seat Split Configuration</h3>
            
            <div className="flex justify-center items-center gap-4 mt-2">
              <button
                type="button"
                className={cn(
                  "px-3 py-1 rounded-md text-sm flex items-center",
                  splitOrientation === 'horizontal'
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                )}
                onClick={() => setOrientation('horizontal')}
                disabled={readOnly}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 10a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
                  <path d="M10 5a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1z" />
                </svg>
                Front/Back Split
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1 rounded-md text-sm flex items-center",
                  splitOrientation === 'vertical'
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                )}
                onClick={() => setOrientation('vertical')}
                disabled={readOnly}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 10a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
                </svg>
                Left/Right Split
              </button>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {splitOrientation === 'horizontal'
                ? `Split Ratio: ${calculateSplitRatio()} (Front/Back)`
                : `Split Ratio: ${calculateSplitRatio()} (Left/Right)`}
            </div>

            {/* Show seat split summary */}
            {!isLoading && !error && (
              <SeatSplitSummary 
                splitConfiguration={prepareConfiguration()}
                totalSeats={layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length)}
                splitOrientation={splitOrientation}
                splitPercentage={splitPercentage}
              />
            )}

            {/* Split percentage slider */}
            <div className="w-full mt-4 px-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs">1%</span>
                <span className="text-xs font-medium">{splitPercentage}%</span>
                <span className="text-xs">99%</span>
              </div>
              <Slider
                defaultValue={[splitPercentage]}
                max={99}
                min={1}
                step={1}
                value={[splitPercentage]}
                onValueChange={handleSliderChange}
                disabled={readOnly}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{splitOrientation === 'horizontal' ? 'Minimal Front' : 'Minimal Left'}</span>
                <span>50/50</span>
                <span>{splitOrientation === 'horizontal' ? 'Minimal Back' : 'Minimal Right'}</span>
              </div>
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
          <div 
            className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            style={{ 
              width: `${gridDimensions.width}px`, 
              height: `${gridDimensions.height}px`,
              maxWidth: '100%',
              maxHeight: '60vh'
            }}
          >
            {/* Show jet model and configuration info */}
            <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-center">
              <div className="bg-white/80 dark:bg-black/50 backdrop-blur-sm text-xs px-2 py-1 rounded">
                {layout.layoutType === 'luxury' ? 'Luxury Layout' : 'Standard Layout'}
              </div>
              <div className="bg-white/80 dark:bg-black/50 backdrop-blur-sm text-xs px-2 py-1 rounded">
                {layout.rows} rows × {layout.seatsPerRow} seats
              </div>
            </div>

            {/* Seats grid with improved styling */}
            <div className="absolute top-0 left-0 w-full h-full grid" 
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
                  
                  // Determine if the seat is in the first section based on the split percentage
                  let isInFirstSection = false;
                  const totalSeatsCount = layout.totalSeats || (layout.rows * layout.seatsPerRow - skipPositions.length);
                  const firstSectionCount = Math.round((splitPercentage / 100) * totalSeatsCount);
                  
                  // Calculate which seats are in the first section (more complex with skipPositions)
                  if (splitOrientation === 'horizontal') {
                    // Count seats row by row to find the split position
                    let frontSeatCount = 0;
                    let rowsInFirstSection = 0;
                    
                    for (let row = 0; row < layout.rows && frontSeatCount < firstSectionCount; row++) {
                      let seatsInThisRow = 0;
                      for (let col = 0; col < layout.seatsPerRow; col++) {
                        if (!isSkippedPosition(row, col)) {
                          seatsInThisRow++;
                        }
                      }
                      frontSeatCount += seatsInThisRow;
                      rowsInFirstSection++;
                    }
                    
                    // This seat is in the first section if its row is before the split
                    isInFirstSection = rowIdx < rowsInFirstSection;
                  } else {
                    // Count seats column by column to find the split position
                    let leftSeatCount = 0;
                    let colsInFirstSection = 0;
                    
                    for (let col = 0; col < layout.seatsPerRow && leftSeatCount < firstSectionCount; col++) {
                      let seatsInThisCol = 0;
                      for (let row = 0; row < layout.rows; row++) {
                        if (!isSkippedPosition(row, col)) {
                          seatsInThisCol++;
                        }
                      }
                      leftSeatCount += seatsInThisCol;
                      colsInFirstSection++;
                    }
                    
                    // This seat is in the first section if its column is before the split
                    isInFirstSection = colIdx < colsInFirstSection;
                  }
                  
                  // Improved seat styling
                  return (
                    <div
                      key={`seat-${rowIdx}-${colIdx}`}
                      className={cn(
                        "m-1 flex items-center justify-center rounded-lg transition-colors duration-200",
                        isInFirstSection 
                          ? "bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-900/70 dark:text-blue-100 dark:border-blue-700"
                          : "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/70 dark:text-amber-100 dark:border-amber-700",
                        layout.layoutType === 'luxury' ? "shadow-sm" : ""
                      )}
                    >
                      <span className={cn(
                        "font-medium",
                        layout.layoutType === 'luxury' ? "text-sm" : "text-xs"
                      )}>{seatId}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Crosshair lines */}
            {!readOnly && (
              <>
                {/* Horizontal line (for vertical split) */}
                {splitOrientation === 'vertical' && (
                  <div
                    className="absolute bg-red-500 z-10"
                    style={{
                      left: crosshairPosition.x,
                      top: 0,
                      width: 2,
                      height: '100%',
                    }}
                  />
                )}

                {/* Vertical line (for horizontal split) */}
                {splitOrientation === 'horizontal' && (
                  <div
                    className="absolute bg-red-500 z-10"
                    style={{
                      left: 0,
                      top: crosshairPosition.y,
                      width: '100%',
                      height: 2,
                    }}
                  />
                )}

                {/* Draggable handle with improved design */}
                <Rnd
                  position={{
                    x: splitOrientation === 'vertical' ? crosshairPosition.x - 10 : gridDimensions.width / 2 - 10,
                    y: splitOrientation === 'horizontal' ? crosshairPosition.y - 10 : gridDimensions.height / 2 - 10,
                  }}
                  size={{ width: 20, height: 20 }}
                  onDragStop={handleDragStop}
                  enableResizing={false}
                  bounds="parent"
                  dragAxis={splitOrientation === 'horizontal' ? 'y' : 'x'}
                  disableDragging={readOnly}
                >
                  <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center cursor-move shadow-md ring-2 ring-white dark:ring-gray-800">
                    <div className="w-2/3 h-2/3 rounded-full bg-white dark:bg-gray-200" />
                  </div>
                </Rnd>
              </>
            )}
          </div>
        )}

        {showControls && (
          <div className="mt-4 w-full flex justify-between">
            <button
              type="button"
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md dark:bg-gray-800 dark:text-gray-300"
              onClick={() => setIsVisible(false)}
            >
              Close
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              onClick={toggleSplitOrientation}
              disabled={readOnly}
            >
              Toggle Split Direction
            </button>
          </div>
        )}
      </div>
    );
  }
);

JetSeatVisualizer.displayName = 'JetSeatVisualizer';

export default JetSeatVisualizer; 
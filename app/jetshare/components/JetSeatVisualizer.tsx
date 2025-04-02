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
};

// Helper function to generate seat IDs
const generateSeatId = (row: number, col: number) => {
  const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
  return `${rowLetter}${col + 1}`;
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
    const [isLoading, setIsLoading] = useState(false);
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

      const totalSeatsCount = layout.rows * layout.seatsPerRow;
      let firstSectionCount = 0;
      
      if (splitOrientation === 'horizontal') {
        // Calculate how many seats should be in the front section based on percentage
        firstSectionCount = Math.round((splitPercentage / 100) * totalSeatsCount);
        
        // Ensure we don't end up with 0 seats in either section
        firstSectionCount = Math.max(1, Math.min(firstSectionCount, totalSeatsCount - 1));
        
        // Calculate row split position based on the adjusted count
        const rowsInFirstSection = Math.ceil(firstSectionCount / layout.seatsPerRow);
        
        for (let row = 0; row < layout.rows; row++) {
          for (let col = 0; col < layout.seatsPerRow; col++) {
            const seatId = generateSeatId(row, col);
            
            if (row < rowsInFirstSection && seats.front!.length < firstSectionCount) {
              seats.front!.push(seatId);
            } else {
              seats.back!.push(seatId);
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
        firstSectionCount = Math.round((splitPercentage / 100) * totalSeatsCount);
        
        // Ensure we don't end up with 0 seats in either section
        firstSectionCount = Math.max(1, Math.min(firstSectionCount, totalSeatsCount - 1));
        
        // Calculate column split position based on the adjusted count
        const colsInFirstSection = Math.ceil(firstSectionCount / layout.rows);
        
        for (let row = 0; row < layout.rows; row++) {
          for (let col = 0; col < layout.seatsPerRow; col++) {
            const seatId = generateSeatId(row, col);
            
            // Handle front/back allocation for completeness
            if (row < Math.ceil(layout.rows / 2)) {
              seats.front!.push(seatId);
            } else {
              seats.back!.push(seatId);
            }
            
            if (col < colsInFirstSection && seats.left!.length < firstSectionCount) {
              seats.left!.push(seatId);
            } else {
              seats.right!.push(seatId);
            }
          }
        }
      }

      return seats;
    }, [layout, splitPercentage, splitOrientation]);

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
      
      const totalSeats = layout.rows * layout.seatsPerRow;
      
      if (splitOrientation === 'horizontal') {
        // Calculate how many rows should be in the front section
        const frontSeatCount = Math.round((splitPercentage / 100) * totalSeats);
        const rowsInFront = Math.ceil(frontSeatCount / layout.seatsPerRow);
        const yPosition = Math.min(rowsInFront * seatSize, gridDimensions.height);
        
        setCrosshairPosition(prev => ({
          ...prev,
          y: yPosition,
        }));
      } else {
        // Calculate how many columns should be in the left section
        const leftSeatCount = Math.round((splitPercentage / 100) * totalSeats);
        const colsInLeft = Math.ceil(leftSeatCount / layout.rows);
        const xPosition = Math.min(colsInLeft * seatSize, gridDimensions.width);
        
        setCrosshairPosition(prev => ({
          ...prev,
          x: xPosition,
        }));
      }
      
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }, [splitPercentage, splitOrientation, layout, seatSize, gridDimensions]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      openVisualizer: () => setIsVisible(true),
      closeVisualizer: () => setIsVisible(false),
      updateRatio: (ratio: number) => {
        setSplitPercentage(ratio);
      }
    }));

    // Fetch layout data when jetId changes
    useEffect(() => {
      const fetchLayoutData = async () => {
        if (!jetId) return;

        setIsLoading(true);
        setError(null);

        try {
          // Call API to get jet layout data
          const response = await fetch(`/api/jets/${jetId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch jet layout data');
          }
          
          const data = await response.json();
          
          if (data.seatLayout) {
            setLayout(data.seatLayout);
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
      
      // Update the percentage based on crosshair position
      const totalSeats = layout.rows * layout.seatsPerRow;
      
      if (splitOrientation === 'horizontal') {
        const rowAtCrosshair = Math.round(y / seatSize);
        const seatsInFront = Math.min(rowAtCrosshair * layout.seatsPerRow, totalSeats - 1);
        const newPercentage = Math.round((seatsInFront / totalSeats) * 100);
        setSplitPercentage(Math.max(1, Math.min(99, newPercentage))); // Ensure between 1-99%
      } else {
        const colAtCrosshair = Math.round(x / seatSize);
        const seatsInLeft = Math.min(colAtCrosshair * layout.rows, totalSeats - 1);
        const newPercentage = Math.round((seatsInLeft / totalSeats) * 100);
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
      setSplitOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
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
                  "px-3 py-1 rounded-md text-sm",
                  splitOrientation === 'horizontal'
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                )}
                onClick={() => setSplitOrientation('horizontal')}
                disabled={readOnly}
              >
                Front/Back Split
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1 rounded-md text-sm",
                  splitOrientation === 'vertical'
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                )}
                onClick={() => setSplitOrientation('vertical')}
                disabled={readOnly}
              >
                Left/Right Split
              </button>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {splitOrientation === 'horizontal'
                ? `Split Ratio: ${calculateSplitRatio()} (Front/Back)`
                : `Split Ratio: ${calculateSplitRatio()} (Left/Right)`}
            </div>

            {/* Split percentage slider */}
            <div className="w-full mt-4 px-2">
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
                <span>1%</span>
                <span>50%</span>
                <span>99%</span>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center w-full h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 dark:text-red-400 text-center">
            {error}
            <button
              className="block mx-auto mt-2 text-sm underline"
              onClick={() => setLayout({ rows: 6, seatsPerRow: 4, layoutType: 'standard' })}
            >
              Use Default Layout
            </button>
          </div>
        ) : (
          <div 
            className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            style={{ 
              width: `${gridDimensions.width}px`, 
              height: `${gridDimensions.height}px`,
              maxWidth: '100%',
              maxHeight: '60vh'
            }}
          >
            {/* Seats grid */}
            <div className="absolute top-0 left-0 w-full h-full grid" 
              style={{ 
                gridTemplateColumns: `repeat(${layout.seatsPerRow}, 1fr)`,
                gridTemplateRows: `repeat(${layout.rows}, 1fr)` 
              }}
            >
              {Array.from({ length: layout.rows }).map((_, rowIdx) =>
                Array.from({ length: layout.seatsPerRow }).map((_, colIdx) => {
                  const seatId = generateSeatId(rowIdx, colIdx);
                  
                  // Determine if the seat is in the first section based on the split percentage
                  let isInFirstSection = false;
                  const totalSeatsCount = layout.rows * layout.seatsPerRow;
                  const firstSectionCount = Math.round((splitPercentage / 100) * totalSeatsCount);
                  
                  if (splitOrientation === 'horizontal') {
                    const rowsInFirstSection = Math.ceil(firstSectionCount / layout.seatsPerRow);
                    isInFirstSection = rowIdx < rowsInFirstSection && 
                      (rowIdx * layout.seatsPerRow + colIdx < firstSectionCount);
                  } else {
                    const colsInFirstSection = Math.ceil(firstSectionCount / layout.rows);
                    isInFirstSection = colIdx < colsInFirstSection && 
                      (colIdx * layout.rows + rowIdx < firstSectionCount);
                  }
                  
                  let seatColor = "bg-gray-200 dark:bg-gray-700";
                  if (splitOrientation === 'horizontal') {
                    seatColor = isInFirstSection ? "bg-blue-100 dark:bg-blue-900" : "bg-amber-100 dark:bg-amber-900";
                  } else {
                    seatColor = isInFirstSection ? "bg-blue-100 dark:bg-blue-900" : "bg-amber-100 dark:bg-amber-900";
                  }
                  
                  return (
                    <div
                      key={`seat-${rowIdx}-${colIdx}`}
                      className={cn(
                        "border border-gray-300 dark:border-gray-600 flex items-center justify-center rounded-md m-1",
                        seatColor
                      )}
                    >
                      <span className="text-xs font-medium">{seatId}</span>
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

                {/* Draggable handle */}
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
                  <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center cursor-move shadow-md">
                    <div className="w-2/3 h-2/3 rounded-full bg-white" />
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
'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Rnd } from 'react-rnd';
import { cn } from '@/lib/utils';

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
}

// Export the component ref type for external usage
export type JetSeatVisualizerRef = {
  openVisualizer: () => void;
  closeVisualizer: () => void;
};

// Helper function to generate seat IDs
const generateSeatId = (row: number, col: number) => {
  const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
  return `${rowLetter}${col + 1}`;
};

// Main component implementation
const JetSeatVisualizer = forwardRef<JetSeatVisualizerRef, JetSeatVisualizerProps>(
  ({ jetId, defaultLayout, onChange, initialSplit, readOnly = false, className }, ref) => {
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

    // Calculate seat allocation based on crosshair position
    const calculateSeatAllocation = () => {
      const seats: SplitConfiguration['allocatedSeats'] = {
        front: [],
        back: [],
        left: [],
        right: [],
      };

      // Get the split position in rows/cols
      const xSplit = Math.round(crosshairPosition.x / seatSize);
      const ySplit = Math.round(crosshairPosition.y / seatSize);

      for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.seatsPerRow; col++) {
          const seatId = generateSeatId(row, col);

          // Horizontal split (front/back)
          if (row < ySplit) {
            seats.front?.push(seatId);
          } else {
            seats.back?.push(seatId);
          }

          // Vertical split (left/right)
          if (col < xSplit) {
            seats.left?.push(seatId);
          } else {
            seats.right?.push(seatId);
          }
        }
      }

      return seats;
    };

    // Calculate the split ratio
    const calculateSplitRatio = () => {
      const totalSeats = layout.rows * layout.seatsPerRow;
      
      if (splitOrientation === 'horizontal') {
        const frontRows = Math.round(crosshairPosition.y / seatSize);
        const frontSeats = frontRows * layout.seatsPerRow;
        const frontPercentage = Math.round((frontSeats / totalSeats) * 100);
        return `${frontPercentage}/${100 - frontPercentage}`;
      } else {
        const leftCols = Math.round(crosshairPosition.x / seatSize);
        const leftSeats = leftCols * layout.rows;
        const leftPercentage = Math.round((leftSeats / totalSeats) * 100);
        return `${leftPercentage}/${100 - leftPercentage}`;
      }
    };

    // Prepare configuration object for the onChange callback
    const prepareConfiguration = (): SplitConfiguration => {
      return {
        jetId,
        splitOrientation,
        splitRatio: calculateSplitRatio(),
        allocatedSeats: calculateSeatAllocation(),
      };
    };

    // Update the parent component with the current configuration
    const updateParentComponent = () => {
      if (onChange) {
        onChange(prepareConfiguration());
      }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      openVisualizer: () => setIsVisible(true),
      closeVisualizer: () => setIsVisible(false),
    }));

    // Fetch layout data when jetId changes
    useEffect(() => {
      const fetchLayoutData = async () => {
        if (!jetId) return;

        setIsLoading(true);
        setError(null);

        try {
          // TODO: Replace with actual API call to get jet layout data
          // For now, simulate a fetch with default data
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
      setCrosshairPosition({
        x: baseGridWidth / 2,
        y: baseGridHeight / 2,
        width: 4, // Width of the crosshair line
        height: 4, // Height of the crosshair line
      });
    }, [layout]);

    // Notify parent component when crosshair position changes
    useEffect(() => {
      updateParentComponent();
    }, [crosshairPosition, splitOrientation]);

    // Initialize with initial split if provided
    useEffect(() => {
      if (initialSplit) {
        setSplitOrientation(initialSplit.splitOrientation);
        
        // Calculate seat size
        const seatSize = 40;
        
        // Set crosshair position based on the initial split ratio
        const [firstPart] = initialSplit.splitRatio.split('/').map(Number);
        const percentage = firstPart / 100;
        
        if (initialSplit.splitOrientation === 'horizontal') {
          setCrosshairPosition(prev => ({
            ...prev,
            y: Math.round(layout.rows * percentage * seatSize),
          }));
        } else {
          setCrosshairPosition(prev => ({
            ...prev,
            x: Math.round(layout.seatsPerRow * percentage * seatSize),
          }));
        }
      }
    }, [initialSplit]);

    // Handle crosshair drag stop
    const handleDragStop = (e: any, d: { x: number; y: number }) => {
      // Constrain to grid boundaries
      const x = Math.max(0, Math.min(d.x, gridDimensions.width));
      const y = Math.max(0, Math.min(d.y, gridDimensions.height));
      
      setCrosshairPosition(prev => ({
        ...prev,
        x,
        y,
      }));
    };

    // Toggle split orientation
    const toggleSplitOrientation = () => {
      setSplitOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    };

    if (!isVisible) return null;

    return (
      <div className={cn("flex flex-col items-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md", className)}>
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
        </div>

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
                  const isInFront = rowIdx < crosshairPosition.y / seatSize;
                  const isInLeft = colIdx < crosshairPosition.x / seatSize;
                  
                  let seatColor = "bg-gray-200 dark:bg-gray-700";
                  if (splitOrientation === 'horizontal') {
                    seatColor = isInFront ? "bg-blue-100 dark:bg-blue-900" : "bg-amber-100 dark:bg-amber-900";
                  } else {
                    seatColor = isInLeft ? "bg-blue-100 dark:bg-blue-900" : "bg-amber-100 dark:bg-amber-900";
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
      </div>
    );
  }
);

JetSeatVisualizer.displayName = 'JetSeatVisualizer';

export default JetSeatVisualizer; 
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SeatLayoutConfiguratorProps {
  rows: number;
  seatsPerRow: number;
  skipPositions?: number[][];
  onChange: (layout: any) => void;
  className?: string;
}

/**
 * Seat Layout Configurator
 * 
 * A component that allows users to configure a seat layout by selecting
 * which positions should be skipped (for aisles, galleys, etc.)
 */
export function SeatLayoutConfigurator({
  rows,
  seatsPerRow,
  skipPositions = [],
  onChange,
  className
}: SeatLayoutConfiguratorProps) {
  const [selectedPositions, setSelectedPositions] = useState<number[][]>(skipPositions);
  
  // Update selected positions when skipPositions prop changes
  useEffect(() => {
    setSelectedPositions(skipPositions);
  }, [skipPositions]);
  
  // Generate a unique seat ID for a position
  const generateSeatId = (row: number, col: number) => {
    const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
    return `${rowLetter}${col + 1}`;
  };
  
  // Check if a position is selected (to be skipped)
  const isPositionSelected = (row: number, col: number) => {
    return selectedPositions.some(pos => pos[0] === row && pos[1] === col);
  };
  
  // Handle clicking on a seat to toggle selection
  const handleSeatClick = (row: number, col: number) => {
    const isSelected = isPositionSelected(row, col);
    let newSelectedPositions: number[][];
    
    if (isSelected) {
      // Remove this position from the selected positions
      newSelectedPositions = selectedPositions.filter(
        pos => !(pos[0] === row && pos[1] === col)
      );
    } else {
      // Add this position to the selected positions
      newSelectedPositions = [...selectedPositions, [row, col]];
    }
    
    setSelectedPositions(newSelectedPositions);
    
    // Call the onChange callback with the updated layout
    onChange({
      rows,
      seatsPerRow,
      layoutType: 'custom',
      skipPositions: newSelectedPositions
    });
  };
  
  // Calculate grid dimensions
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${seatsPerRow}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: '4px',
    width: '100%',
    maxWidth: `${seatsPerRow * 50}px`, // 50px per seat
    margin: '0 auto'
  };
  
  return (
    <div className={cn("p-2", className)}>
      <div style={gridStyle}>
        {Array.from({ length: rows }).map((_, rowIdx) =>
          Array.from({ length: seatsPerRow }).map((_, colIdx) => {
            const seatId = generateSeatId(rowIdx, colIdx);
            const isSelected = isPositionSelected(rowIdx, colIdx);
            
            return (
              <div
                key={`seat-${rowIdx}-${colIdx}`}
                className={cn(
                  "flex items-center justify-center rounded-md cursor-pointer border-2 transition-all h-12",
                  isSelected
                    ? "bg-slate-400/50 border-slate-400 text-slate-700 line-through"
                    : "bg-amber-500/20 border-amber-500/50 text-amber-950 hover:bg-amber-500/40 hover:border-amber-500/80"
                )}
                onClick={() => handleSeatClick(rowIdx, colIdx)}
              >
                <span className="font-medium text-sm">{seatId}</span>
              </div>
            );
          })
        )}
      </div>
      <div className="text-center mt-3 text-xs text-gray-500">
        {selectedPositions.length} seats excluded
      </div>
    </div>
  );
} 
import React, { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetSeatVisualizer, { JetSeatVisualizerRef, SeatLayout } from '../../../app/jetshare/components/JetSeatVisualizer';
import { action } from '@storybook/addon-actions';

/**
 * JetSeatVisualizer is an interactive component that allows users to select seats on an aircraft.
 * It supports different layout configurations and selection modes.
 */
const meta = {
  title: 'Jetshare/JetSeatVisualizer',
  component: JetSeatVisualizer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    jet_id: {
      control: 'text',
      description: 'Unique identifier for the jet',
    },
    defaultLayout: {
      control: 'object',
      description: 'Default seat layout configuration',
    },
    readOnly: {
      control: 'boolean',
      description: 'Set to true to disable seat selection',
    },
    showControls: {
      control: 'boolean',
      description: 'Show or hide control buttons',
    },
    showLegend: {
      control: 'boolean',
      description: 'Show or hide the legend',
    },
    showSummary: {
      control: 'boolean',
      description: 'Show or hide the selection summary',
    },
  },
} satisfies Meta<typeof JetSeatVisualizer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default JetSeatVisualizer with standard layout
 */
export const Default: Story = {
  args: {
    jet_id: 'demo-jet-1',
    defaultLayout: {
      rows: 6,
      seatsPerRow: 4,
      layoutType: 'standard',
    },
    onChange: action('seat-selection-changed'),
    showControls: true,
    showLegend: true,
    showSummary: true,
  },
};

/**
 * Luxury layout with fewer seats and more space
 */
export const LuxuryLayout: Story = {
  args: {
    jet_id: 'demo-jet-2',
    defaultLayout: {
      rows: 4,
      seatsPerRow: 2,
      layoutType: 'luxury',
    },
    onChange: action('seat-selection-changed'),
    showControls: true,
    showLegend: true,
    showSummary: true,
  },
};

/**
 * Custom layout with skipped positions (missing seats)
 */
export const CustomLayout: Story = {
  args: {
    jet_id: 'demo-jet-3',
    defaultLayout: {
      rows: 5,
      seatsPerRow: 4,
      layoutType: 'custom',
      seatMap: {
        skipPositions: [[0, 0], [0, 3], [4, 0], [4, 3]], // Skip corner seats
      },
    },
    onChange: action('seat-selection-changed'),
    showControls: true,
    showLegend: true,
    showSummary: true,
  },
};

/**
 * Read-only mode - seats cannot be selected
 */
export const ReadOnly: Story = {
  args: {
    jet_id: 'demo-jet-4',
    defaultLayout: {
      rows: 6,
      seatsPerRow: 4,
      layoutType: 'standard',
    },
    readOnly: true,
    initialSelection: {
      jet_id: 'demo-jet-4',
      selectedSeats: ['B2', 'B3', 'C2', 'C3'],
      totalSeats: 24,
      totalSelected: 4,
      selectionPercentage: 16.66,
    },
    showControls: false,
    showLegend: true,
    showSummary: true,
  },
};

/**
 * With pre-selected seats
 */
export const WithPreselectedSeats: Story = {
  args: {
    jet_id: 'demo-jet-5',
    defaultLayout: {
      rows: 6,
      seatsPerRow: 4,
      layoutType: 'standard',
    },
    onChange: action('seat-selection-changed'),
    initialSelection: {
      jet_id: 'demo-jet-5',
      selectedSeats: ['A1', 'A2', 'F3', 'F4'],
      totalSeats: 24,
      totalSelected: 4,
      selectionPercentage: 16.66,
    },
    showControls: true,
    showLegend: true,
    showSummary: true,
  },
};

/**
 * Compact view without controls or legend
 */
export const CompactView: Story = {
  args: {
    jet_id: 'demo-jet-6',
    defaultLayout: {
      rows: 4,
      seatsPerRow: 3,
      layoutType: 'standard',
    },
    onChange: action('seat-selection-changed'),
    showControls: false,
    showLegend: false,
    showSummary: false,
    className: 'max-w-[240px]',
  },
};

/**
 * Interactive example with component ref methods
 */
export const InteractiveWithRef: Story = {
  render: (args) => {
    // Use a function component to access the ref
    const JetSeatVisualizerWithRef = () => {
      const visualizerRef = useRef<JetSeatVisualizerRef>(null);
      
      const handleSelectAll = () => {
        if (visualizerRef.current) {
          const info = visualizerRef.current.getLayoutInfo();
          const allSeats: string[] = [];
          
          // Generate all seat IDs for this layout
          for (let row = 0; row < info.rows; row++) {
            for (let col = 0; col < info.seatsPerRow; col++) {
              const rowLetter = String.fromCharCode(65 + row);
              allSeats.push(`${rowLetter}${col + 1}`);
            }
          }
          
          visualizerRef.current.selectSeats(allSeats);
        }
      };
      
      const handleClearSelection = () => {
        if (visualizerRef.current) {
          visualizerRef.current.clearSelection();
        }
      };
      
      const toggleSelectionMode = () => {
        if (visualizerRef.current) {
          const info = visualizerRef.current.getLayoutInfo();
          console.log('Current layout info:', info);
          visualizerRef.current.setSelectionMode('drag');
        }
      };
      
      return (
        <div className="flex flex-col gap-4">
          <JetSeatVisualizer 
            {...args} 
            ref={visualizerRef} 
            onChange={action('seat-selection-changed')}
          />
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md"
            >
              Select All
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md"
            >
              Clear
            </button>
            <button
              onClick={toggleSelectionMode}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md"
            >
              Toggle Mode
            </button>
          </div>
        </div>
      );
    };
    
    return <JetSeatVisualizerWithRef />;
  },
  args: {
    jet_id: 'demo-jet-7',
    defaultLayout: {
      rows: 5,
      seatsPerRow: 4,
      layoutType: 'standard',
    },
    showControls: true,
    showLegend: true,
    showSummary: true,
  },
}; 
import React, { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetSeatVisualizer, { JetSeatVisualizerRef, SeatLayout, SeatConfiguration } from '../../../app/jetshare/components/JetSeatVisualizer';
import { action } from '@storybook/addon-actions';

/**
 * The JetSeatVisualizer component is a critical interactive tool that enables jet owners to visualize and configure 
 * how seats are arranged and selected within their aircraft for jet sharing purposes. This component is a key element 
 * in the jet sharing workflow, allowing owners who have already purchased jet capacity to determine precisely how they 
 * want to split and share their seats with others.
 * 
 * The visualizer dynamically adapts to different aircraft configurations through a sophisticated data flow:
 * 1. Custom layouts configured for a specific jet
 * 2. Jet interior data from the jet_interiors table
 * 3. Capacity information from the jets table
 * 4. Default layouts for common aircraft models
 */
const meta = {
  title: 'Jetshare/JetSeatVisualizer',
  component: JetSeatVisualizer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Jet Seat Visualizer

## Overview
The JetSeatVisualizer is a sophisticated component in the Jetstream platform that allows jet owners to visualize and configure how seats are arranged and split within their aircraft. This interactive tool provides both visual representation and functional seat selection capabilities.

## Primary Function
This component serves jet owners who have already purchased aircraft capacity and need to determine how they want to split and share seats for jetshare offerings. The visualizer displays the exact cabin configuration based on the specific aircraft model (identified by \`jet_id\`).

## Data Flow Architecture
The visualizer dynamically adapts to different aircraft configurations through a multi-layered data sourcing approach:

1. **Custom Layouts**: Retrieves custom layouts if configured for the specific jet
2. **Jet Interior Data**: Falls back to interior specifications from the \`jet_interiors\` table
3. **Jet Model Data**: Further falls back to capacity information from the \`jets\` table
4. **Default Layouts**: Uses predefined layouts for common aircraft models if no specific data exists

## Key Features
- **Interactive Seat Selection**: Tap individual seats or use drag-selection for multiple seats
- **Selection Modes**: Toggle between single-tap and multi-select drag modes
- **Layout Visualization**: Accurately depicts the actual aircraft cabin configuration
- **Skip Positions**: Handles irregular layouts through the \`skipPositions\` mechanism
- **Seat Counts**: Displays total available seats and currently selected seats
- **Selection Percentage**: Shows the percentage of selected seats
- **Responsive Design**: Adapts to different screen sizes while maintaining usability
- **Error Handling**: Graceful fallbacks when specific jet data cannot be retrieved

## Seat Layout Types
- **Standard**: Typical economy-style configuration for efficient capacity
- **Luxury**: Premium layout with more spacious seating arrangements
- **Custom**: Specialized configurations for unique aircraft interiors

## Usage in Jet Sharing
When creating a jet share listing, owners use this component to:
1. Visualize their aircraft's exact seating configuration
2. Select which seats they want to include in their sharing offer
3. Generate a seat map that will be displayed to potential buyers
4. Calculate pricing based on the number/percentage of seats offered
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    jet_id: {
      control: 'text',
      description: 'Unique identifier for the jet model or specific aircraft',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Required'
      }
    },
    defaultLayout: {
      control: 'object',
      description: 'Default seat layout configuration used as fallback if API retrieval fails',
      table: {
        type: { summary: 'SeatLayout' },
        defaultValue: { summary: '{ rows: 6, seatsPerRow: 4, layoutType: "standard" }' },
        category: 'Layout Configuration'
      }
    },
    onChange: {
      action: 'seat-selection-changed',
      description: 'Callback function invoked when seat selection changes',
      table: {
        type: { summary: '(config: SeatConfiguration) => void' },
        defaultValue: { summary: 'undefined' },
        category: 'Callbacks'
      }
    },
    initialSelection: {
      control: 'object',
      description: 'Pre-selected seats when the component first renders',
      table: {
        type: { summary: 'SeatConfiguration' },
        defaultValue: { summary: 'undefined' },
        category: 'Selection State'
      }
    },
    readOnly: {
      control: 'boolean',
      description: 'When true, prevents users from modifying seat selection',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Interaction Controls'
      }
    },
    showControls: {
      control: 'boolean',
      description: 'Show or hide the control buttons for selection management',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Display Options'
      }
    },
    showLegend: {
      control: 'boolean',
      description: 'Show or hide the seat status legend',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Display Options'
      }
    },
    showSummary: {
      control: 'boolean',
      description: 'Show or hide the selection summary',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Display Options'
      }
    },
    totalSeats: {
      control: 'number',
      description: 'Override the total number of seats (useful when exact layout is unknown)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 'undefined' },
        category: 'Layout Configuration'
      }
    },
    customLayout: {
      control: 'object',
      description: 'Directly provide a custom seat layout instead of fetching from API',
      table: {
        type: { summary: 'SeatLayout' },
        defaultValue: { summary: 'undefined' },
        category: 'Layout Configuration'
      }
    },
    forceExactLayout: {
      control: 'boolean',
      description: 'When true, forces the component to use the provided customLayout exactly without modifications',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Layout Configuration'
      }
    },
    onError: {
      action: 'error-occurred',
      description: 'Callback function invoked when an error occurs during layout fetching',
      table: {
        type: { summary: '(error: Error | string) => void' },
        defaultValue: { summary: 'undefined' },
        category: 'Callbacks'
      }
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names to apply to the component wrapper',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Styling'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JetSeatVisualizer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default JetSeatVisualizer with standard layout representing a mid-size private jet.
 * 
 * This configuration demonstrates the basic visualization capabilities with a 6-row, 4-seats-per-row layout.
 * The standard layout type is typically used for conventional jet configurations where seating is optimized for capacity.
 */
export const Default: Story = {
  args: {
    jet_id: 'demo-jet-1',
    defaultLayout: {
      rows: 6,
      seatsPerRow: 4,
      layoutType: 'standard',
      totalSeats: 24
    },
    onChange: action('seat-selection-changed'),
    showControls: true,
    showLegend: true,
    showSummary: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'A standard layout configuration for a mid-size private jet with 24 seats arranged in 6 rows of 4 seats each. This represents a typical charter jet configuration optimized for passenger capacity.'
      }
    }
  }
};

/**
 * Luxury layout with fewer seats and more space, typical of high-end private jets.
 * 
 * This configuration demonstrates how the visualization adapts to luxury aircraft with
 * more spacious seating arrangements and fewer seats per row.
 */
export const LuxuryLayout: Story = {
  args: {
    jet_id: 'demo-jet-2',
    defaultLayout: {
      rows: 4,
      seatsPerRow: 2,
      layoutType: 'luxury',
      totalSeats: 8
    },
    onChange: action('seat-selection-changed'),
    showControls: true,
    showLegend: true,
    showSummary: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'A luxury layout configuration with only 8 seats arranged in 4 rows of 2 seats each. This represents high-end private jets where comfort and space are prioritized over passenger capacity, offering a more exclusive experience.'
      }
    }
  }
};

/**
 * Custom layout with skipped positions (missing seats), representing specialized aircraft configurations.
 * 
 * This demonstrates the component\'s ability to handle irregular seating patterns through the skipPositions mechanism,
 * which is critical for accurately representing real aircraft interiors where certain positions may not have seats.
 */
export const CustomLayout: Story = {
  args: {
    jet_id: 'demo-jet-3',
    defaultLayout: {
      rows: 5,
      seatsPerRow: 4,
      layoutType: 'custom',
      totalSeats: 16,
      seatMap: {
        skipPositions: [[0, 0], [0, 3], [4, 0], [4, 3]], // Skip corner seats
      },
    },
    onChange: action('seat-selection-changed'),
    showControls: true,
    showLegend: true,
    showSummary: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'A custom layout that uses the skipPositions mechanism to create an irregular seating pattern. This example shows a 5-row, 4-seats-per-row grid where the corner seats have been removed, resulting in 16 total seats. This represents specialized aircraft configurations like those with lavatories, galleys, or entryways occupying certain positions.'
      }
    }
  }
};

/**
 * Gulfstream G650 Layout Example
 * 
 * This represents a realistic premium long-range business jet configuration with 19 seats,
 * demonstrating how the visualizer handles real-world aircraft models.
 */
export const GulfstreamG650: Story = {
  args: {
    jet_id: 'demo-g650',
    defaultLayout: {
      rows: 5,
      seatsPerRow: 4,
      layoutType: 'luxury',
      totalSeats: 19,
      seatMap: {
        skipPositions: [[4, 3]] // Skip last seat in last row
      }
    },
    onChange: action('seat-selection-changed'),
    showControls: true,
    showLegend: true,
    showSummary: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'This example represents a Gulfstream G650 long-range business jet with a luxury configuration of 19 seats. The layout uses 5 rows with 4 seats per row, with one position skipped in the last row. This accurately represents how the component adapts to specific real-world aircraft models.'
      }
    }
  }
};

/**
 * Read-only mode where seats cannot be selected.
 * 
 * This demonstrates how the visualizer can be used in non-interactive scenarios,
 * such as displaying someone else\'s seat selection or showing the current seat availability.
 */
export const ReadOnly: Story = {
  args: {
    jet_id: 'demo-jet-4',
    defaultLayout: {
      rows: 6,
      seatsPerRow: 4,
      layoutType: 'standard',
      totalSeats: 24
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
  parameters: {
    docs: {
      description: {
        story: 'The visualizer in read-only mode, where users cannot modify the seat selection. This mode is useful for viewing existing selections, such as when reviewing a booking or examining someone else\'s jet share offering. The example includes pre-selected seats to demonstrate how selections appear in this mode.'
      }
    }
  }
};

/**
 * With pre-selected seats to demonstrate initializing the component with an existing selection.
 * 
 * This is particularly important for editing scenarios, where a user returns to modify
 * a previously created seat selection.
 */
export const WithPreselectedSeats: Story = {
  args: {
    jet_id: 'demo-jet-5',
    defaultLayout: {
      rows: 6,
      seatsPerRow: 4,
      layoutType: 'standard',
      totalSeats: 24
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
  parameters: {
    docs: {
      description: {
        story: 'The visualizer initialized with pre-selected seats. This represents use cases such as editing an existing jet share listing or continuing from a saved selection. The initialSelection prop provides the component with an initial state that users can then modify.'
      }
    }
  }
};

/**
 * Compact view without controls or legend for space-constrained scenarios.
 * 
 * This demonstrates how the component can be adapted for display in smaller UI containers
 * or secondary contexts where full functionality isn't required.
 */
export const CompactView: Story = {
  args: {
    jet_id: 'demo-jet-6',
    defaultLayout: {
      rows: 4,
      seatsPerRow: 3,
      layoutType: 'standard',
      totalSeats: 12
    },
    onChange: action('seat-selection-changed'),
    showControls: false,
    showLegend: false,
    showSummary: false,
    className: 'max-w-[240px]',
  },
  parameters: {
    docs: {
      description: {
        story: 'A compact version of the visualizer with controls, legend, and summary disabled. This configuration is useful for constrained UI spaces such as mobile views, preview cards, or secondary contexts where a simplified representation is sufficient.'
      }
    }
  }
};

/**
 * Full-featured configuration with custom error handling.
 * 
 * This demonstrates how to implement error handling and provides a more complete
 * example of the visualizer with all features enabled.
 */
export const FullFeatured: Story = {
  args: {
    jet_id: 'gulfstream-g650',
    defaultLayout: {
      rows: 5,
      seatsPerRow: 4,
      layoutType: 'luxury',
      totalSeats: 19,
      seatMap: {
        skipPositions: [[4, 3]] // Skip last seat in last row
      }
    },
    onChange: action('seat-selection-changed'),
    onError: action('error-occurred'),
    showControls: true,
    showLegend: true,
    showSummary: true,
    initialSelection: {
      jet_id: 'gulfstream-g650',
      selectedSeats: ['A1', 'A4', 'C2', 'C3'],
      totalSeats: 19,
      totalSelected: 4,
      selectionPercentage: 21.05,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A complete configuration showcasing all available features of the JetSeatVisualizer. This example represents a Gulfstream G650 with luxury seating, pre-selected seats, and error handling. It demonstrates how the component would be used in a production environment with all options properly configured.'
      }
    }
  }
};

/**
 * Interactive example with component ref methods to demonstrate programmatic control.
 * 
 * This demonstrates how external systems (like the AI Concierge) can programmatically
 * control the JetSeatVisualizer through its ref interface.
 */
export const InteractiveWithRef: Story = {
  render: (args) => {
    // Use a function component to access the ref
    const JetSeatVisualizerWithRef = () => {
      const visualizerRef = useRef<JetSeatVisualizerRef>(null);
      const [selectionMode, setSelectionMode] = React.useState<'tap' | 'drag'>('tap');
      const [layoutInfo, setLayoutInfo] = React.useState<any>(null);
      
      const handleSelectAll = () => {
        if (visualizerRef.current) {
          const info = visualizerRef.current.getLayoutInfo();
          const allSeats: string[] = [];
          
          // Generate all seat IDs for this layout, accounting for skip positions
          for (let row = 0; row < info.rows; row++) {
            for (let col = 0; col < info.seatsPerRow; col++) {
              // Skip positions would be handled by the component internally
              const rowLetter = String.fromCharCode(65 + row);
              allSeats.push(`${rowLetter}${col + 1}`);
            }
          }
          
          visualizerRef.current.selectSeats(allSeats);
          setLayoutInfo(info);
        }
      };
      
      const handleClearSelection = () => {
        if (visualizerRef.current) {
          visualizerRef.current.clearSelection();
        }
      };
      
      const toggleSelectionMode = () => {
        if (visualizerRef.current) {
          const newMode = selectionMode === 'tap' ? 'drag' : 'tap';
          visualizerRef.current.setSelectionMode(newMode);
          setSelectionMode(newMode);
          
          const info = visualizerRef.current.getLayoutInfo();
          setLayoutInfo(info);
        }
      };
      
      const handleGetInfo = () => {
        if (visualizerRef.current) {
          const info = visualizerRef.current.getLayoutInfo();
          setLayoutInfo(info);
        }
      };
      
      return (
        <div className="flex flex-col gap-4">
          <JetSeatVisualizer 
            {...args} 
            ref={visualizerRef} 
            onChange={(config) => {
              action('seat-selection-changed')(config);
              setLayoutInfo(null); // Reset info to prompt user to get latest
            }}
          />
          
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Select All Seats
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Selection
            </button>
            <button
              onClick={toggleSelectionMode}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Toggle Mode ({selectionMode === 'tap' ? 'Tap' : 'Drag'})
            </button>
            <button
              onClick={handleGetInfo}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Get Layout Info
            </button>
          </div>
          
          {layoutInfo && (
            <div className="mt-3 p-3 bg-gray-800 rounded-md text-gray-200 text-sm">
              <h3 className="font-semibold mb-2">Layout Information:</h3>
              <pre className="overflow-auto max-h-40">
                {JSON.stringify(layoutInfo, null, 2)}
              </pre>
            </div>
          )}
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
      layoutType: 'luxury',
      totalSeats: 19,
      seatMap: {
        skipPositions: [[4, 3]] // Skip last seat in last row
      }
    },
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: `This example demonstrates how to programmatically control the JetSeatVisualizer using its ref interface. The component exposes methods like \`selectSeats\`, \`clearSelection\`, \`setSelectionMode\`, and \`getLayoutInfo\` that allow external systems (like the AI Concierge) to interact with the visualizer.

The buttons below the visualizer showcase these different ref methods in action, and the information panel displays the current layout information retrieved through the ref. This pattern is particularly useful for:

1. AI-driven interactions where the AI assistant needs to guide users through seat selection
2. Advanced UI patterns where seat selection is controlled by external UI elements
3. Integration with other components that need to control the seat visualization`
      }
    }
  }
};

/**
 * Mock API example that demonstrates how the component interacts with backend data.
 * 
 * This showcases how the JetSeatVisualizer fetches and uses seat layout data from the API,
 * which is essential for accurately representing specific aircraft configurations.
 */
export const WithMockApi: Story = {
  render: () => {
    const JetSeatVisualizerWithMockApi = () => {
      const [jetId, setJetId] = React.useState('gulfstream-g650');
      
      // Mock the fetch API to return different layouts based on jet_id
      React.useEffect(() => {
        const originalFetch = window.fetch;
        
        window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
          const url = typeof input === 'string' ? input : input.toString();
          
          if (url.includes('/api/jets/')) {
            // Different layout configurations based on the jet_id
            const layoutConfigs: Record<string, any> = {
              'gulfstream-g650': {
                rows: 5,
                seatsPerRow: 4,
                layoutType: 'luxury',
                totalSeats: 19,
                seatMap: {
                  skipPositions: [[4, 3]] // Skip last seat in last row
                }
              },
              'embraer-phenom-300': {
                rows: 3,
                seatsPerRow: 4,
                layoutType: 'standard',
                totalSeats: 10,
                seatMap: {
                  skipPositions: [[2, 2], [2, 3]] // Skip two seats in last row
                }
              },
              'cessna-citation': {
                rows: 3,
                seatsPerRow: 3,
                layoutType: 'standard',
                totalSeats: 8,
                seatMap: {
                  skipPositions: [[2, 2]] // Skip one seat in last row
                }
              }
            };
            
            // Get the layout config based on jet_id
            const urlJetId = url.split('/api/jets/')[1].split('?')[0];
            const layoutConfig = layoutConfigs[urlJetId] || layoutConfigs['gulfstream-g650'];
            
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                jet: {
                  id: urlJetId,
                  model: urlJetId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                  manufacturer: urlJetId.split('-')[0].charAt(0).toUpperCase() + urlJetId.split('-')[0].slice(1),
                  capacity: layoutConfig.totalSeats
                },
                interior: {
                  seats: layoutConfig.totalSeats.toString(),
                  cabin_configuration: layoutConfig.layoutType
                },
                seatLayout: layoutConfig
              })
            } as Response);
          }
          
          return originalFetch(input, init);
        }) as typeof window.fetch;
        
        return () => {
          window.fetch = originalFetch;
        };
      }, []);
      
      return (
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-gray-800 rounded-md">
            <h3 className="text-white font-semibold mb-2">Select Aircraft Model:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setJetId('gulfstream-g650')}
                className={`px-3 py-1 text-sm rounded-md ${jetId === 'gulfstream-g650' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
              >
                Gulfstream G650
              </button>
              <button
                onClick={() => setJetId('embraer-phenom-300')}
                className={`px-3 py-1 text-sm rounded-md ${jetId === 'embraer-phenom-300' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
              >
                Embraer Phenom 300
              </button>
              <button
                onClick={() => setJetId('cessna-citation')}
                className={`px-3 py-1 text-sm rounded-md ${jetId === 'cessna-citation' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
              >
                Cessna Citation
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Current Jet ID: <span className="font-mono">{jetId}</span>
            </p>
          </div>
          
          <JetSeatVisualizer
            jet_id={jetId}
            onChange={action('seat-selection-changed')}
          />
        </div>
      );
    };
    
    return <JetSeatVisualizerWithMockApi />;
  },
  args: {
    jet_id: 'gulfstream-g650'
  },
  parameters: {
    docs: {
      description: {
        story: `This example demonstrates how the JetSeatVisualizer interacts with the backend API to fetch seat layout data for different aircraft models. It uses a mock API implementation to simulate different responses based on the selected jet_id.

The buttons above the visualizer allow you to switch between different aircraft models, each with its own unique seating configuration:

1. **Gulfstream G650**: A luxury long-range business jet with 19 seats arranged in 5 rows
2. **Embraer Phenom 300**: A popular light jet with 10 seats and an irregular layout
3. **Cessna Citation**: A compact light jet with 8 seats

This example shows how the visualizer adapts to different aircraft configurations in real-time, which is essential for accurately representing specific jets in the sharing platform.`
      }
    }
  }
}; 
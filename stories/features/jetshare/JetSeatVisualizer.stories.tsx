import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetSeatVisualizer, { SeatConfiguration } from '../../../app/jetshare/components/JetSeatVisualizer';

/**
 * The JetSeatVisualizer component is a critical part of the jet sharing workflow, allowing jet owners
 * to visualize and configure how seats are arranged in their aircraft and select specific seats to include
 * in their sharing offers. This feature story focuses on how the component is used in real workflows.
 */

// Create a wrapper with robust mocked API responses
const JetSeatVisualizerWithMocks = ({ 
  jet_id = 'gulfstream-g650', 
  initialSelectedSeats = [], 
  readOnly = false, 
  showControls = true,
  totalSeats = 19,
  layoutType = 'luxury',
  scenario = 'create-offer'
}: {
  jet_id?: string;
  initialSelectedSeats?: string[];
  readOnly?: boolean;
  showControls?: boolean;
  totalSeats?: number;
  layoutType?: 'standard' | 'luxury' | 'custom';
  scenario?: 'create-offer' | 'view-booking' | 'edit-offer';
}) => {
  const [selectedSeats, setSelectedSeats] = React.useState<string[]>(initialSelectedSeats);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);
  
  // Mock the necessary fetch API responses
  React.useEffect(() => {
    // Original fetch function
    const originalFetch = window.fetch;
    
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.includes('/api/jets/')) {
        // Different layout configurations based on the jet model
        const layouts: Record<string, any> = {
          'gulfstream-g650': {
            rows: 5,
            seatsPerRow: 4,
            layoutType: layoutType,
            totalSeats: totalSeats,
            seatMap: {
              skipPositions: [[4, 3]] // Skip last seat in last row for G650
            }
          },
          'embraer-phenom-300': {
            rows: 3,
            seatsPerRow: 4,
            layoutType: layoutType,
            totalSeats: 10,
            seatMap: {
              skipPositions: [[2, 2], [2, 3]] // Skip two seats in last row
            }
          },
          'default-jet': {
            rows: 4,
            seatsPerRow: 3,
            layoutType: layoutType,
            totalSeats: totalSeats,
            seatMap: {
              skipPositions: []
            }
          }
        };
        
        // Get appropriate layout
        const urlJetId = url.split('/api/jets/')[1].split('?')[0];
        const layout = layouts[urlJetId] || layouts['default-jet'];
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            jet: {
              id: urlJetId,
              model: urlJetId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              manufacturer: urlJetId.split('-')[0].charAt(0).toUpperCase() + urlJetId.split('-')[0].slice(1),
              capacity: layout.totalSeats
            },
            interior: {
              seats: layout.totalSeats.toString(),
              cabin_configuration: layout.layoutType
            },
            seatLayout: layout
          })
        } as Response);
      }
      
      return originalFetch(input, init);
    }) as typeof window.fetch;
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [totalSeats, layoutType]);
  
  // Create initialSelection object if needed
  const initialSelection = initialSelectedSeats.length > 0 
    ? {
        jet_id,
        selectedSeats: initialSelectedSeats,
        totalSeats,
        totalSelected: initialSelectedSeats.length,
        selectionPercentage: Math.round((initialSelectedSeats.length / totalSeats) * 100)
      } 
    : undefined;
  
  // Handle selection changes
  const handleSelectionChange = (config: SeatConfiguration) => {
    console.log('Seat configuration changed:', config);
    setSelectedSeats(config.selectedSeats);
    setSaveStatus(null); // Reset save status when selection changes
  };
  
  // Handle save action
  const handleSaveSelection = () => {
    // Simulate API call to save selection
    setTimeout(() => {
      setSaveStatus('saved');
    }, 1000);
  };
  
  // Show appropriate UI based on scenario
  return (
    <div className="flex flex-col gap-4">
      {/* Contextual header based on scenario */}
      <div className="bg-gray-800 p-4 rounded-md shadow-md">
        {scenario === 'create-offer' && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Create Jet Share Offer</h3>
            <p className="text-gray-300 text-sm">Select the seats you wish to include in your jet share offering.</p>
          </div>
        )}
        
        {scenario === 'view-booking' && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Your Booking</h3>
            <p className="text-gray-300 text-sm">Your selected seats for this flight are highlighted below.</p>
            <div className="mt-2 flex gap-2">
              <span className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded">Flight #JS-2489</span>
              <span className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded">April 15, 2023</span>
            </div>
          </div>
        )}
        
        {scenario === 'edit-offer' && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Edit Jet Share Offer</h3>
            <p className="text-gray-300 text-sm">Modify the seats included in your jet share offering.</p>
            <div className="mt-2 flex gap-2">
              <span className="bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded">Offer #JSO-4721</span>
              <span className="bg-gray-700 text-blue-200 text-xs px-2 py-1 rounded">Active</span>
            </div>
          </div>
        )}
        
        {/* Seat Visualizer Component */}
        <JetSeatVisualizer 
          jet_id={jet_id}
          initialSelection={initialSelection}
          readOnly={readOnly}
          showControls={showControls}
          onChange={handleSelectionChange}
        />
        
        {/* Action footer based on scenario */}
        {!readOnly && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-300">
              {selectedSeats.length} seats selected 
              {totalSeats > 0 && ` (${Math.round((selectedSeats.length / totalSeats) * 100)}%)`}
            </div>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors text-sm"
                onClick={() => setSelectedSeats([])}
              >
                Reset
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                onClick={handleSaveSelection}
                disabled={selectedSeats.length === 0}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                ) : (
                  scenario === 'create-offer' ? 'Continue to Pricing' : 'Save Changes'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Price Estimate Panel (only for create-offer) */}
      {scenario === 'create-offer' && selectedSeats.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-md shadow-md">
          <h3 className="text-lg font-semibold text-white mb-2">Estimated Revenue</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 p-3 rounded-md">
              <span className="text-gray-400 text-xs block mb-1">Per Seat Price</span>
              <span className="text-white text-lg font-semibold">$4,500</span>
            </div>
            <div className="bg-gray-700 p-3 rounded-md">
              <span className="text-gray-400 text-xs block mb-1">Total Revenue</span>
              <span className="text-white text-lg font-semibold">${4500 * selectedSeats.length}</span>
            </div>
            <div className="bg-gray-700 p-3 rounded-md">
              <span className="text-gray-400 text-xs block mb-1">Seats Selected</span>
              <span className="text-white text-lg font-semibold">{selectedSeats.length} of {totalSeats}</span>
            </div>
            <div className="bg-gray-700 p-3 rounded-md">
              <span className="text-gray-400 text-xs block mb-1">Percentage Shared</span>
              <span className="text-white text-lg font-semibold">{Math.round((selectedSeats.length / totalSeats) * 100)}%</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Passenger Information (only for view-booking) */}
      {scenario === 'view-booking' && (
        <div className="bg-gray-800 p-4 rounded-md shadow-md">
          <h3 className="text-lg font-semibold text-white mb-3">Passenger Information</h3>
          <div className="space-y-2">
            {initialSelectedSeats.map((seat, index) => (
              <div key={seat} className="flex items-center p-2 bg-gray-700 rounded-md">
                <div className="bg-blue-600 text-white text-xs font-medium h-6 w-6 rounded-full flex items-center justify-center mr-3">
                  {seat}
                </div>
                <div>
                  <span className="text-white text-sm block">
                    {index === 0 ? 'John Doe (Primary)' : `Passenger ${index + 1}`}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {index === 0 ? 'TSA PreCheck: Yes • Meal: Vegetarian' : 'Pending Information'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const meta: Meta<typeof JetSeatVisualizer> = {
  title: 'Features/JetShare/JetSeatVisualizer',
  component: JetSeatVisualizer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Jet Seat Visualizer User Workflows

The JetSeatVisualizer is a critical component in the jet sharing platform, enabling different user workflows:

## For Jet Owners
Owners use this component to select which seats they want to offer in their jet sharing listings. The visualizer:
- Shows their exact aircraft configuration
- Lets them select seats to include in the offer
- Calculates pricing and revenue estimates based on selected seats
- Provides immediate visual feedback on seat allocation

## For Jet Share Buyers
Travelers use this component to:
- View available seats on a shared flight
- Select and book specific seats
- Understand the cabin layout before booking

## For Trip Management
After booking, passengers use this to:
- View their confirmed seats
- Add passenger information for each seat
- Request seat changes (if available)

## Key User Journeys
1. **Creating a jet share offer**: Owner selects which seats to share, visualizes the split, and prices accordingly
2. **Browsing available offers**: Potential buyers view available seats with accurate cabin representation
3. **Booking seats**: Travelers select specific seats during checkout
4. **Managing bookings**: Passengers view their seat assignments and add passenger details

This feature story demonstrates these workflows in context, showing how the JetSeatVisualizer functions in each scenario.
`
      }
    }
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ maxWidth: '100%', padding: '1rem', backgroundColor: '#0F1419' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JetSeatVisualizer>;

/**
 * This story demonstrates how jet owners create a new jet share offering
 * by selecting which seats they want to include in their listing.
 */
export const CreateJetShareOffer: Story = {
  render: () => (
    <JetSeatVisualizerWithMocks 
      jet_id="gulfstream-g650" 
      scenario="create-offer"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
### Creating a Jet Share Offer

This workflow shows how a jet owner selects seats to include in their jet share offering. Key aspects of this workflow:

1. **Owner Selects Seats**: The owner determines which seats they want to offer to other passengers
2. **Visual Confirmation**: The owner can see a visual representation of their selection
3. **Revenue Calculation**: As seats are selected, the system calculates potential revenue
4. **Simple Navigation**: Clear UI guides the owner through the selection process

In this example, we're showing a Gulfstream G650 with a luxury seating configuration. The owner can select any combination of the 19 available seats to share, with real-time feedback on the potential revenue from this offering.
        `
      }
    }
  }
};

/**
 * This story demonstrates how travelers view their booked seats
 * in a read-only mode after completing their purchase.
 */
export const ViewBookedSeats: Story = {
  render: () => (
    <JetSeatVisualizerWithMocks 
      jet_id="gulfstream-g650" 
      initialSelectedSeats={['A1', 'A2', 'B1', 'B2']} 
      readOnly={true}
      showControls={false}
      scenario="view-booking"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
### Viewing Booked Seats

This workflow shows how passengers view their seat assignments after booking. Key aspects:

1. **Read-Only Display**: Seat selection is disabled since seats are already confirmed
2. **Selected Seats**: The passenger's booked seats are clearly highlighted
3. **Flight Information**: Context about the booking is provided
4. **Passenger Details**: Information for each seat is displayed

The visualizer serves as a confirmation tool in this context, showing passengers exactly where they'll be seated on the aircraft. This helps them understand the cabin layout and their position within it.
        `
      }
    }
  }
};

/**
 * This story demonstrates how jet owners can edit an existing
 * jet share offer to modify which seats are included.
 */
export const EditJetShareOffer: Story = {
  render: () => (
    <JetSeatVisualizerWithMocks 
      jet_id="gulfstream-g650" 
      initialSelectedSeats={['C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'D4']} 
      scenario="edit-offer"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
### Editing a Jet Share Offer

This workflow shows how a jet owner modifies an existing jet share offering. Key aspects:

1. **Pre-Selected Seats**: The current offer's seats are pre-selected
2. **Interactive Modification**: The owner can add or remove seats from the offering
3. **Contextual Information**: Details about the current offer are provided
4. **Revenue Updates**: Estimated revenue updates as seat selection changes

This edit mode is crucial for owners who need to adjust their offerings based on demand, changing travel plans, or other factors. The visualizer makes it clear exactly which seats are being offered or removed from the listing.
        `
      }
    }
  }
};

/**
 * This story demonstrates a smaller aircraft model with
 * different seating configuration.
 */
export const EmbraerPhenomLayout: Story = {
  render: () => (
    <JetSeatVisualizerWithMocks 
      jet_id="embraer-phenom-300" 
      totalSeats={10}
      scenario="create-offer"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
### Different Aircraft Model

This example shows the JetSeatVisualizer adapting to a different aircraft model - an Embraer Phenom 300. The component:

1. **Adapts to Different Layouts**: Shows the correct seating configuration for this aircraft
2. **Handles Irregular Layouts**: Properly represents the 10-seat layout with skipped positions
3. **Maintains Functionality**: All selection features work with this different configuration

This demonstrates how the component handles multiple aircraft types in the fleet, ensuring accurate representation regardless of which jet is being shared.
        `
      }
    }
  }
};

/**
 * This story demonstrates a standard economy-style layout
 * with more seats, suitable for commercial configuration.
 */
export const StandardLayout: Story = {
  render: () => (
    <JetSeatVisualizerWithMocks 
      jet_id="default-jet" 
      totalSeats={24}
      layoutType="standard"
      scenario="create-offer"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
### Standard Layout Configuration

This example shows a standard economy-style seating layout with 24 seats. This configuration:

1. **Maximizes Capacity**: Represents aircraft optimized for passenger count
2. **Regular Grid Pattern**: Shows a more standardized seating arrangement
3. **Commercial Styling**: Reflects layouts more common in commercial configurations

Standard layouts are typically used for larger jets where maximizing passenger capacity is prioritized over luxury spacing. The visualizer adapts to show this more dense configuration while maintaining ease of selection.
        `
      }
    }
  }
}; 
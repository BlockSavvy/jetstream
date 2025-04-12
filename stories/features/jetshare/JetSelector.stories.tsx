import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetSelector from '../../../app/jetshare/components/JetSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * The JetSelector component provides a searchable dropdown for selecting
 * aircraft models with information about capacity, range, and other details.
 */

/**
 * The JetSelector component plays a critical role in the jet sharing workflow,
 * enabling users to select from available aircraft when creating listings or
 * booking flights. This feature story demonstrates how the component functions
 * in real-world user journeys.
 */

// Create a wrapper with robust mocked API responses for feature scenarios
const JetSelectorWithWorkflow = ({ 
  initialValue = '', 
  scenario = 'booking-flow',
  isDisabled = false
}: {
  initialValue?: string;
  scenario?: 'booking-flow' | 'create-listing' | 'jet-search';
  isDisabled?: boolean;
}) => {
  const [selectedJet, setSelectedJet] = useState(initialValue);
  const [jetDetails, setJetDetails] = useState<any>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Set up the mock API response
  React.useEffect(() => {
    // Original fetch function
    const originalFetch = window.fetch;
    
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.includes('/api/jetshare/getJets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            jets: [
              { 
                id: 'gulfstream-g650', 
                manufacturer: 'Gulfstream', 
                model: 'G650', 
                tail_number: 'N1JS',
                capacity: 19,
                range_nm: 7000,
                cruise_speed_kts: 516,
                is_popular: true,
                year: 2022,
                image_url: '/images/jets/gulfstream/g650.jpg'
              },
              { 
                id: 'bombardier-global-7500', 
                manufacturer: 'Bombardier', 
                model: 'Global 7500', 
                tail_number: 'N2JS',
                capacity: 19,
                range_nm: 7700,
                cruise_speed_kts: 516,
                is_popular: true,
                year: 2021
              },
              { 
                id: 'embraer-phenom-300e', 
                manufacturer: 'Embraer', 
                model: 'Phenom 300E', 
                tail_number: 'N3JS',
                capacity: 10,
                range_nm: 2010,
                cruise_speed_kts: 453,
                is_popular: true,
                year: 2023
              },
              { 
                id: 'cessna-citation-longitude', 
                manufacturer: 'Cessna', 
                model: 'Citation Longitude', 
                tail_number: 'N4JS',
                capacity: 12,
                range_nm: 3500,
                cruise_speed_kts: 476,
                year: 2020
              },
              { 
                id: 'dassault-falcon-8x', 
                manufacturer: 'Dassault', 
                model: 'Falcon 8X', 
                tail_number: 'N5JS',
                capacity: 16,
                range_nm: 6450,
                cruise_speed_kts: 425,
                year: 2022
              },
              { 
                id: 'other-custom', 
                manufacturer: 'Other', 
                model: 'Custom', 
                capacity: 8,
                range_nm: 3000
              }
            ]
          })
        } as Response);
      }
      
      return originalFetch(input, init);
    }) as typeof window.fetch;
    
    // Add event listener for selection changes
    const handleJetChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSelectedJet(customEvent.detail.value);
      setJetDetails(customEvent.detail);
    };
    
    window.addEventListener('jetchange', handleJetChange);
    
    // Cleanup
    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('jetchange', handleJetChange);
    };
  }, []);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };
  
  // Render UI based on scenario
  return (
    <div className="flex flex-col gap-6 bg-gray-900 p-6 rounded-xl max-w-full w-[600px]">
      {/* Scenario-specific header */}
      {scenario === 'booking-flow' && (
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-white mb-2">Book a Private Jet</h2>
          <p className="text-gray-300">Step 1 of 3: Select Your Aircraft</p>
          {formSubmitted && (
            <div className="mt-3 bg-green-900/30 border border-green-700/30 text-green-400 p-3 rounded-md text-sm">
              Aircraft selected! Proceeding to seat selection...
            </div>
          )}
        </div>
      )}
      
      {scenario === 'create-listing' && (
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-white mb-2">Create Jet Share Listing</h2>
          <p className="text-gray-300">Step 1 of 4: Select Your Aircraft</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-950/40 text-blue-300 border-blue-800">Jet Owner</Badge>
            <Badge variant="outline" className="bg-amber-950/30 text-amber-300 border-amber-800">Empty Leg</Badge>
          </div>
          {formSubmitted && (
            <div className="mt-3 bg-green-900/30 border border-green-700/30 text-green-400 p-3 rounded-md text-sm">
              Aircraft selected! Proceeding to route selection...
            </div>
          )}
        </div>
      )}
      
      {scenario === 'jet-search' && (
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-white mb-2">Search Available Jets</h2>
          <p className="text-gray-300">Filter listings by aircraft type</p>
          {formSubmitted && (
            <div className="mt-3 bg-green-900/30 border border-green-700/30 text-green-400 p-3 rounded-md text-sm">
              Search updated with selected aircraft filter!
            </div>
          )}
        </div>
      )}
      
      {/* Form with JetSelector component */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {scenario === 'booking-flow' ? 'Select Aircraft Model' : 
             scenario === 'create-listing' ? 'Your Aircraft' : 'Aircraft Type'}
          </label>
          <JetSelector 
            value={selectedJet} 
            disabled={isDisabled || formSubmitted}
            placeholder={scenario === 'jet-search' ? 'Any aircraft type' : 'Select aircraft model'}
          />
          {scenario === 'create-listing' && (
            <p className="mt-2 text-xs text-gray-400">
              Only aircraft you own or have permission to list will appear here.
            </p>
          )}
        </div>
        
        {/* Display details about selected jet when available */}
        {jetDetails && (
          <div className="bg-gray-800 rounded-md p-4 border border-gray-700">
            <h3 className="text-md font-semibold text-white mb-3">Aircraft Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400 block">Seats</span>
                <span className="text-white">{jetDetails.seatCapacity || '---'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Range</span>
                <span className="text-white">{jetDetails.range ? `${jetDetails.range} nm` : '---'}</span>
              </div>
              {scenario === 'booking-flow' && (
                <>
                  <div>
                    <span className="text-gray-400 block">Typical Charter Price</span>
                    <span className="text-white font-medium">$4,800/hour</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">JetShare Price</span>
                    <span className="text-green-400 font-medium">$2,100/hour</span>
                  </div>
                </>
              )}
              {scenario === 'create-listing' && (
                <>
                  <div>
                    <span className="text-gray-400 block">Operating Cost</span>
                    <span className="text-white font-medium">$3,400/hour</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Est. Revenue</span>
                    <span className="text-green-400 font-medium">$7,200/hour</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            disabled={formSubmitted}
          >
            {scenario === 'jet-search' ? 'Reset Filter' : 'Cancel'}
          </Button>
          
          <Button
            type="submit"
            disabled={!selectedJet || isDisabled || formSubmitted}
            className={`${!selectedJet ? 'opacity-50 cursor-not-allowed' : ''} bg-blue-600 text-white hover:bg-blue-700`}
          >
            {scenario === 'booking-flow' ? 'Continue to Seat Selection' : 
             scenario === 'create-listing' ? 'Next: Select Route' : 
             'Apply Filter'}
          </Button>
        </div>
      </form>
      
      {/* Related components that would appear in real scenarios */}
      {scenario === 'booking-flow' && !formSubmitted && selectedJet && (
        <div className="mt-4 bg-gray-800/50 rounded-md p-4 border border-gray-700">
          <h3 className="text-md font-semibold text-gray-300 mb-2">Upcoming Steps</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
            <li className="text-blue-400">Select aircraft type</li>
            <li>Choose available seats</li>
            <li>Confirm flight details</li>
          </ol>
        </div>
      )}
      
      {scenario === 'create-listing' && !formSubmitted && selectedJet && (
        <div className="mt-4 bg-gray-800/50 rounded-md p-4 border border-gray-700">
          <h3 className="text-md font-semibold text-gray-300 mb-2">Listing Preview</h3>
          <div className="p-3 bg-gray-700 rounded-md text-sm">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-950/40 text-blue-300 border-blue-800">Private Jet</Badge>
              <span className="text-white truncate">{selectedJet}</span>
            </div>
            <p className="text-gray-300">Complete next steps to add route, pricing and availability.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Stories configuration
const meta = {
  title: 'Features/Jetshare/JetSelector',
  component: JetSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# JetSelector in Workflows

This feature story demonstrates how the JetSelector component functions within real user journeys
in the Jetstream platform. The component is displayed in various contexts that reflect how users 
interact with it during crucial workflows.

## Contexts Demonstrated

1. **Booking Flow** - How travelers select an aircraft when booking a private jet
2. **Create Listing** - How jet owners specify their aircraft when creating a jet share listing
3. **Jet Search** - How users filter available jets by aircraft type

Each scenario shows appropriate contextual UI elements, related information, and user guidance
that would appear alongside the component in production.
`
      }
    }
  },
  argTypes: {
    value: { table: { disable: true } },
    disabled: { table: { disable: true } },
    className: { table: { disable: true } },
    id: { table: { disable: true } },
    onChangeValue: { table: { disable: true } },
    onChangeSeatCapacity: { table: { disable: true } },
    onCustomChangeValue: { table: { disable: true } },
    onBlur: { table: { disable: true } },
    placeholder: { table: { disable: true } },
  },
  decorators: [
    (Story) => <div className="bg-gray-950 p-6 rounded-xl"><Story /></div>,
  ],
} satisfies Meta<typeof JetSelector>;

export default meta;
type Story = StoryObj<typeof JetSelector>;

/**
 * The JetSelector in the context of a passenger booking flow. 
 * 
 * This demonstrates how the component appears in the first step of the booking
 * process, allowing travelers to select their preferred aircraft type before
 * proceeding to seat selection.
 */
export const BookingFlowScenario: Story = {
  args: {
    value: ''
  },
  render: () => <JetSelectorWithWorkflow scenario="booking-flow" />
};

/**
 * The JetSelector in the context of creating a jet share listing.
 * 
 * This demonstrates how jet owners use the component when creating
 * a listing to share capacity on their aircraft, specifying which
 * jet they're offering for sharing.
 */
export const CreateListingScenario: Story = {
  args: {
    value: ''
  },
  render: () => <JetSelectorWithWorkflow scenario="create-listing" />
};

/**
 * The JetSelector used as a search filter for available jets.
 * 
 * This demonstrates how the component functions as part of the
 * search interface, allowing users to filter available jet shares
 * by aircraft type.
 */
export const JetSearchScenario: Story = {
  args: {
    value: ''
  },
  render: () => <JetSelectorWithWorkflow scenario="jet-search" />
};

/**
 * The JetSelector with a pre-selected value in a booking flow.
 * 
 * This demonstrates how the component appears when the user returns
 * to a booking form with a previously selected aircraft, or when
 * coming from a page that already specified an aircraft preference.
 */
export const WithPreselectedAircraft: Story = {
  args: {
    value: 'Gulfstream G650'
  },
  render: () => <JetSelectorWithWorkflow 
    scenario="booking-flow" 
    initialValue="Gulfstream G650" 
  />
};

/**
 * The JetSelector in a disabled state, typically shown when a booking
 * is locked and cannot be modified, or when displaying details for reference.
 */
export const DisabledInWorkflow: Story = {
  args: {
    value: 'Bombardier Global 7500',
    disabled: true
  },
  render: () => <JetSelectorWithWorkflow 
    scenario="booking-flow" 
    initialValue="Bombardier Global 7500"
    isDisabled={true}
  />
}; 
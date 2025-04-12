import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import LocationAutocomplete from '../../../app/jetshare/components/LocationAutocomplete';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Calendar as CalendarIcon, MapPin, Plane } from 'lucide-react';
import JetSelector from '../../../app/jetshare/components/JetSelector';

/**
 * The LocationAutocomplete component plays a critical role in the jet sharing workflow,
 * enabling users to search and select departure and arrival locations for their flights.
 * This feature story demonstrates how the component functions in real-world user journeys.
 */

// Sample airport data for stories
const SAMPLE_AIRPORTS = [
  { 
    code: 'JFK', 
    name: 'John F. Kennedy International Airport', 
    city: 'New York', 
    country: 'United States',
    is_private: false,
    lat: 40.6413,
    lng: -73.7781
  },
  { 
    code: 'LAX', 
    name: 'Los Angeles International Airport', 
    city: 'Los Angeles', 
    country: 'United States',
    is_private: false,
    lat: 33.9416,
    lng: -118.4085
  },
  { 
    code: 'LHR', 
    name: 'London Heathrow Airport', 
    city: 'London', 
    country: 'United Kingdom',
    is_private: false,
    lat: 51.4700,
    lng: -0.4543
  },
  { 
    code: 'CDG', 
    name: 'Charles de Gaulle Airport', 
    city: 'Paris', 
    country: 'France',
    is_private: false,
    lat: 49.0097,
    lng: 2.5479
  },
  { 
    code: 'DXB', 
    name: 'Dubai International Airport', 
    city: 'Dubai', 
    country: 'United Arab Emirates',
    is_private: false,
    lat: 25.2532,
    lng: 55.3657
  },
  { 
    code: 'TEB', 
    name: 'Teterboro Airport', 
    city: 'Teterboro', 
    country: 'United States',
    is_private: true,
    lat: 40.8499,
    lng: -74.0608
  },
  { 
    code: 'VNY', 
    name: 'Van Nuys Airport', 
    city: 'Los Angeles', 
    country: 'United States',
    is_private: true,
    lat: 34.2096,
    lng: -118.4902
  },
  { 
    code: 'HPN', 
    name: 'Westchester County Airport', 
    city: 'White Plains', 
    country: 'United States',
    is_private: true,
    lat: 41.0671,
    lng: -73.7076
  }
];

// Create a wrapper with robust mocked for feature scenarios
const LocationAutocompleteWorkflow = ({ 
  scenario = 'flight-search',
  initialDeparture = '',
  initialArrival = '',
  showPrivateOnly = false
}: {
  scenario?: 'flight-search' | 'booking-form' | 'charter-request' | 'route-search';
  initialDeparture?: string;
  initialArrival?: string;
  showPrivateOnly?: boolean;
}) => {
  const [departureValue, setDepartureValue] = useState(initialDeparture);
  const [arrivalValue, setArrivalValue] = useState(initialArrival);
  const [aircraft, setAircraft] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Filter airports based on private airport setting
  const filteredAirports = showPrivateOnly 
    ? SAMPLE_AIRPORTS.filter(airport => airport.is_private) 
    : SAMPLE_AIRPORTS;
  
  // Set up event handlers
  React.useEffect(() => {
    const handleLocationChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.name === 'departure') {
        setDepartureValue(customEvent.detail.value);
        if (errors.departure) {
          setErrors(prev => ({ ...prev, departure: '' }));
        }
      } else if (customEvent.detail.name === 'arrival') {
        setArrivalValue(customEvent.detail.value);
        if (errors.arrival) {
          setErrors(prev => ({ ...prev, arrival: '' }));
        }
      }
    };
    
    const handleJetChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setAircraft(customEvent.detail.value);
      if (errors.aircraft) {
        setErrors(prev => ({ ...prev, aircraft: '' }));
      }
    };
    
    window.addEventListener('locationChange', handleLocationChange);
    window.addEventListener('jetchange', handleJetChange);
    
    return () => {
      window.removeEventListener('locationChange', handleLocationChange);
      window.removeEventListener('jetchange', handleJetChange);
    };
  }, [errors]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: {[key: string]: string} = {};
    
    if (!departureValue) {
      newErrors.departure = 'Departure location is required';
    }
    
    if (!arrivalValue) {
      newErrors.arrival = 'Arrival location is required';
    }
    
    if (scenario === 'charter-request' && !aircraft) {
      newErrors.aircraft = 'Aircraft selection is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Form is valid, proceed
    setFormSubmitted(true);
  };
  
  // Calculate distance between airports if both selected
  const calculateDistance = () => {
    const departureParts = departureValue.match(/\(([A-Z]{3})\)/);
    const arrivalParts = arrivalValue.match(/\(([A-Z]{3})\)/);
    
    if (departureParts && arrivalParts) {
      const departureCode = departureParts[1];
      const arrivalCode = arrivalParts[1];
      
      const departureAirport = SAMPLE_AIRPORTS.find(a => a.code === departureCode);
      const arrivalAirport = SAMPLE_AIRPORTS.find(a => a.code === arrivalCode);
      
      if (departureAirport?.lat && departureAirport?.lng && arrivalAirport?.lat && arrivalAirport?.lng) {
        // Simple distance calculation (not accurate for long flights but good enough for demo)
        const R = 3958.8; // Earth radius in miles
        const dLat = (arrivalAirport.lat - departureAirport.lat) * Math.PI / 180;
        const dLon = (arrivalAirport.lng - departureAirport.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(departureAirport.lat * Math.PI / 180) * Math.cos(arrivalAirport.lat * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return Math.round(distance);
      }
    }
    
    return null;
  };
  
  const distance = calculateDistance();
    
  // Render UI based on scenario
  return (
    <div className="flex flex-col gap-6 bg-gray-900 p-6 rounded-xl max-w-full w-[600px]">
      {/* Scenario-specific header */}
      {scenario === 'flight-search' && (
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-white mb-2">Find Private Jet Flights</h2>
          <p className="text-gray-300">Enter your travel details to search available flights</p>
          {formSubmitted && (
            <div className="mt-3 bg-green-900/30 border border-green-700/30 text-green-400 p-3 rounded-md text-sm">
              Search initiated! Finding flights from {departureValue} to {arrivalValue}...
            </div>
          )}
        </div>
      )}
      
      {scenario === 'booking-form' && (
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-white mb-2">Book Your Jet Share</h2>
          <p className="text-gray-300">Complete your flight information</p>
          {formSubmitted && (
            <div className="mt-3 bg-green-900/30 border border-green-700/30 text-green-400 p-3 rounded-md text-sm">
              Route selected! Proceeding to seat selection...
            </div>
          )}
        </div>
      )}
      
      {scenario === 'charter-request' && (
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-white mb-2">Request Private Charter</h2>
          <p className="text-gray-300">Provide your charter flight details</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-indigo-950/40 text-indigo-300 border-indigo-800">Full Charter</Badge>
            <Badge variant="outline" className="bg-purple-950/30 text-purple-300 border-purple-800">Custom Itinerary</Badge>
          </div>
          {formSubmitted && (
            <div className="mt-3 bg-green-900/30 border border-green-700/30 text-green-400 p-3 rounded-md text-sm">
              Charter request submitted! Our team will contact you shortly.
            </div>
          )}
        </div>
      )}
      
      {scenario === 'route-search' && (
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-white mb-2">Popular Routes</h2>
          <p className="text-gray-300">Find common jet share routes and average prices</p>
          {formSubmitted && (
            <div className="mt-3 bg-green-900/30 border border-green-700/30 text-green-400 p-3 rounded-md text-sm">
              Searching for route information between {departureValue} and {arrivalValue}...
            </div>
          )}
        </div>
      )}
      
      {/* Form with LocationAutocomplete components */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <LocationAutocomplete 
              value={departureValue} 
              placeholder="Where are you flying from?"
              label="Departure Location"
              airports={filteredAirports}
              popularLocations={['New York (JFK)', 'Los Angeles (LAX)', 'Teterboro (TEB)']}
              variant="departure"
              name="departure"
              error={errors.departure}
            />
          </div>
          
          <div>
            <LocationAutocomplete 
              value={arrivalValue} 
              placeholder="Where are you flying to?"
              label="Arrival Location"
              airports={filteredAirports}
              popularLocations={['London (LHR)', 'Paris (CDG)', 'Dubai (DXB)']}
              variant="arrival"
              name="arrival"
              error={errors.arrival}
            />
          </div>
        </div>
        
        {/* Display calculated distance if available */}
        {distance && departureValue && arrivalValue && (
          <div className="bg-gray-800/60 rounded-md p-3 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-900/40 flex items-center justify-center">
              <Plane className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Flight Distance</div>
              <div className="text-white font-medium">{distance} miles</div>
            </div>
            {scenario === 'booking-form' && (
              <div className="ml-auto">
                <div className="text-sm text-gray-400">Est. Flight Time</div>
                <div className="text-white font-medium">{Math.max(1, Math.round(distance / 400))}h {Math.round((distance % 400) / 400 * 60)}m</div>
              </div>
            )}
          </div>
        )}
        
        {/* Additional form fields based on scenario */}
        {scenario === 'charter-request' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-white mb-2">Preferred Aircraft</label>
            <JetSelector
              value={aircraft}
              placeholder="Select preferred aircraft"
            />
          </div>
        )}
        
        {scenario === 'booking-form' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Departure Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full h-12 rounded-lg border bg-gray-900/80 border-gray-700 text-white px-4"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                />
                <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                  <CalendarIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Number of Passengers</label>
              <select className="w-full h-12 rounded-lg border bg-gray-900/80 border-gray-700 text-white px-4">
                <option value="1">1 Passenger</option>
                <option value="2">2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4 Passengers</option>
                <option value="5">5+ Passengers</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            disabled={formSubmitted}
          >
            {scenario === 'route-search' ? 'Reset' : 'Clear'}
          </Button>
          
          <Button
            type="submit"
            disabled={formSubmitted}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {scenario === 'flight-search' ? 'Search Flights' : 
             scenario === 'booking-form' ? 'Continue to Booking' : 
             scenario === 'charter-request' ? 'Submit Request' :
             'Show Route Details'}
          </Button>
        </div>
      </form>
      
      {/* Additional content based on scenario */}
      {scenario === 'flight-search' && departureValue && arrivalValue && !formSubmitted && (
        <div className="mt-4 bg-gray-800/50 rounded-md p-4 border border-gray-700">
          <h3 className="text-md font-semibold text-gray-300 mb-2">Popular Flights</h3>
          <div className="text-xs text-blue-400 mb-3">Based on your search criteria</div>
          
          <div className="space-y-2">
            <div className="p-3 bg-gray-800 rounded-md hover:bg-gray-750 cursor-pointer transition-colors">
              <div className="flex justify-between mb-1">
                <div className="text-white font-medium">JetShare Economy</div>
                <div className="text-green-400 font-bold">$2,400</div>
              </div>
              <div className="text-gray-400 text-xs">Embraer Phenom 300 • 3 seats available</div>
            </div>
            
            <div className="p-3 bg-gray-800 rounded-md hover:bg-gray-750 cursor-pointer transition-colors">
              <div className="flex justify-between mb-1">
                <div className="text-white font-medium">JetShare Premium</div>
                <div className="text-green-400 font-bold">$3,800</div>
              </div>
              <div className="text-gray-400 text-xs">Gulfstream G650 • 4 seats available</div>
            </div>
          </div>
        </div>
      )}
      
      {scenario === 'route-search' && departureValue && arrivalValue && !formSubmitted && (
        <div className="mt-4 bg-gray-800/50 rounded-md p-4 border border-gray-700">
          <h3 className="text-md font-semibold text-gray-300 mb-2">Route Statistics</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-800 p-3 rounded-md">
              <div className="text-gray-400 text-xs">Avg. Price</div>
              <div className="text-white font-medium">${Math.round(distance ? distance * 3.2 : 3000)}</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-md">
              <div className="text-gray-400 text-xs">Weekly Flights</div>
              <div className="text-white font-medium">{Math.round(Math.random() * 20)}</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-md">
              <div className="text-gray-400 text-xs">Typical Aircraft</div>
              <div className="text-white font-medium">G650, Phenom 300</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stories configuration
const meta = {
  title: 'Features/Jetshare/LocationAutocomplete',
  component: LocationAutocomplete,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# LocationAutocomplete in Workflows

This feature story demonstrates how the LocationAutocomplete component is used within real user journeys
in the Jetstream platform. The component is shown in different contexts that illustrate how users
interact with location selection during critical workflows.

## Contexts Demonstrated

1. **Flight Search** - How users select departure and arrival locations when searching for available flights
2. **Booking Form** - How the component appears during the flight booking process
3. **Charter Request** - How the component works when users request a fully private charter
4. **Route Search** - How users can research popular routes and pricing information

Each scenario shows appropriate contextual UI elements, form validations, and intelligent features
like distance calculation based on the selected locations.
`
      }
    }
  },
  argTypes: {
    value: { table: { disable: true } },
    placeholder: { table: { disable: true } },
    label: { table: { disable: true } },
    airports: { table: { disable: true } },
    popularLocations: { table: { disable: true } },
    className: { table: { disable: true } },
    variant: { table: { disable: true } },
    error: { table: { disable: true } },
    name: { table: { disable: true } },
  },
  decorators: [
    (Story) => <div className="bg-gray-950 p-6 rounded-xl"><Story /></div>,
  ],
} satisfies Meta<typeof LocationAutocomplete>;

export default meta;
type Story = StoryObj<typeof LocationAutocomplete>;

/**
 * The LocationAutocomplete component in a flight search context.
 * 
 * This demonstrates how the component appears when users are searching
 * for available flights, entering departure and arrival locations
 * to find flight options.
 */
export const FlightSearchScenario: Story = {
  args: {
    value: ''
  },
  render: () => <LocationAutocompleteWorkflow scenario="flight-search" />
};

/**
 * The LocationAutocomplete in a booking form context.
 * 
 * This demonstrates how the component works within the flight booking
 * process, where users select their route as part of a larger form
 * that includes date selection and passenger count.
 */
export const BookingFormScenario: Story = {
  args: {
    value: ''
  },
  render: () => <LocationAutocompleteWorkflow scenario="booking-form" />
};

/**
 * The LocationAutocomplete in a charter request context.
 * 
 * This demonstrates how the component is used when requesting a
 * full private charter, combined with aircraft selection and additional
 * form fields specific to charter requests.
 */
export const CharterRequestScenario: Story = {
  args: {
    value: ''
  },
  render: () => <LocationAutocompleteWorkflow scenario="charter-request" />
};

/**
 * The LocationAutocomplete in a route search context.
 * 
 * This demonstrates how the component is used when researching
 * popular routes, showing statistics and information about
 * the selected route.
 */
export const RouteSearchScenario: Story = {
  args: {
    value: ''
  },
  render: () => <LocationAutocompleteWorkflow scenario="route-search" />
};

/**
 * The LocationAutocomplete with pre-selected locations.
 * 
 * This demonstrates how the component appears when locations have been
 * pre-selected, such as when returning to a form or when locations
 * are passed from a previous page.
 */
export const WithPreselectedLocations: Story = {
  args: {
    value: ''
  },
  render: () => <LocationAutocompleteWorkflow 
    scenario="flight-search" 
    initialDeparture="New York (JFK)"
    initialArrival="Los Angeles (LAX)"
  />
};

/**
 * The LocationAutocomplete configured for private airports only.
 * 
 * This demonstrates how the component can be configured to only show
 * private airports, which is relevant for certain types of premium
 * jet charter services.
 */
export const PrivateAirportsOnly: Story = {
  args: {
    value: ''
  },
  render: () => <LocationAutocompleteWorkflow 
    scenario="charter-request"
    showPrivateOnly={true}
  />
}; 
import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import LocationAutocomplete from '../../../app/jetshare/components/LocationAutocomplete';

const sampleAirports = [
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States' },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
  { code: 'SYD', name: 'Sydney Airport', city: 'Sydney', country: 'Australia' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { code: 'BCN', name: 'Barcelona–El Prat Airport', city: 'Barcelona', country: 'Spain' },
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
];

const samplePopularLocations = [
  'New York (JFK)',
  'London (LHR)',
  'Paris (CDG)',
  'Los Angeles (LAX)',
  'Tokyo (NRT)',
  'Sydney (SYD)',
];

/**
 * LocationAutocomplete is a specialized search input for airports and locations,
 * designed for the Jetshare mobile experience. It provides autocomplete functionality
 * for selecting departure and arrival locations.
 */
const meta = {
  title: 'Jetshare/LocationAutocomplete',
  component: LocationAutocomplete,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1A202C' },
        { name: 'light', value: '#F7FAFC' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current value of the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    label: {
      control: 'text',
      description: 'Label text displayed above the input',
    },
    variant: {
      control: 'radio',
      options: ['departure', 'arrival'],
      description: 'Visual style variant',
    },
    error: {
      control: 'text',
      description: 'Error message to display below the input',
    },
    airports: {
      control: 'object',
      description: 'List of airport objects for autocomplete',
    },
    popularLocations: {
      control: 'object',
      description: 'List of popular location strings',
    },
  },
} satisfies Meta<typeof LocationAutocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Departure location input with empty state
 */
export const DepartureEmpty: Story = {
  args: {
    value: '',
    placeholder: 'Enter departure city or airport',
    label: 'From',
    variant: 'departure',
    airports: sampleAirports,
    popularLocations: samplePopularLocations,
  },
};

/**
 * Arrival location input with empty state
 */
export const ArrivalEmpty: Story = {
  args: {
    value: '',
    placeholder: 'Enter arrival city or airport',
    label: 'To',
    variant: 'arrival',
    airports: sampleAirports,
    popularLocations: samplePopularLocations,
  },
};

/**
 * Departure with pre-selected value
 */
export const DepartureSelected: Story = {
  args: {
    value: 'New York (JFK)',
    placeholder: 'Enter departure city or airport',
    label: 'From',
    variant: 'departure',
    airports: sampleAirports,
    popularLocations: samplePopularLocations,
  },
};

/**
 * Arrival with pre-selected value
 */
export const ArrivalSelected: Story = {
  args: {
    value: 'London (LHR)',
    placeholder: 'Enter arrival city or airport',
    label: 'To',
    variant: 'arrival',
    airports: sampleAirports,
    popularLocations: samplePopularLocations,
  },
};

/**
 * Input with error state
 */
export const WithError: Story = {
  args: {
    value: '',
    placeholder: 'Enter city or airport',
    label: 'Location',
    variant: 'departure',
    airports: sampleAirports,
    popularLocations: samplePopularLocations,
    error: 'Please select a valid airport',
  },
};

/**
 * Interactive example with state management
 */
export const Interactive: Story = {
  render: () => {
    // Create a function component to manage state
    const InteractiveAutocomplete = () => {
      const [departureValue, setDepartureValue] = useState('');
      const [arrivalValue, setArrivalValue] = useState('');
      
      // Listen for custom events
      React.useEffect(() => {
        const handleLocationChange = (event: Event) => {
          const customEvent = event as CustomEvent;
          const { name, value } = customEvent.detail;
          
          if (name === 'departure') {
            setDepartureValue(value);
          } else if (name === 'arrival') {
            setArrivalValue(value);
          }
        };
        
        window.addEventListener('locationChange', handleLocationChange);
        
        return () => {
          window.removeEventListener('locationChange', handleLocationChange);
        };
      }, []);
      
      return (
        <div className="bg-gray-900 p-6 rounded-xl flex flex-col gap-4 w-[350px]">
          <h3 className="text-white text-xl font-bold mb-2">Book Your Flight</h3>
          
          <LocationAutocomplete
            value={departureValue}
            placeholder="Enter departure city or airport"
            label="From"
            variant="departure"
            airports={sampleAirports}
            popularLocations={samplePopularLocations}
            name="departure"
          />
          
          <LocationAutocomplete
            value={arrivalValue}
            placeholder="Enter arrival city or airport"
            label="To"
            variant="arrival"
            airports={sampleAirports}
            popularLocations={samplePopularLocations}
            name="arrival"
          />
          
          <div className="mt-2 flex justify-end">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              disabled={!departureValue || !arrivalValue}
            >
              Search Flights
            </button>
          </div>
        </div>
      );
    };
    
    return <InteractiveAutocomplete />;
  },
  args: {
    value: '',
    placeholder: 'Enter location',
    airports: sampleAirports,
    popularLocations: samplePopularLocations,
  },
}; 
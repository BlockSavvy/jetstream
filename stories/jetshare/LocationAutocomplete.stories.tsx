import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import LocationAutocomplete from '@/app/jetshare/components/LocationAutocomplete';
import { action } from '@storybook/addon-actions';

// Sample airport data for the stories
const SAMPLE_AIRPORTS = [
  { 
    code: 'JFK', 
    name: 'John F. Kennedy International Airport', 
    city: 'New York', 
    country: 'United States',
    is_private: false
  },
  { 
    code: 'LAX', 
    name: 'Los Angeles International Airport', 
    city: 'Los Angeles', 
    country: 'United States',
    is_private: false
  },
  { 
    code: 'LHR', 
    name: 'London Heathrow Airport', 
    city: 'London', 
    country: 'United Kingdom',
    is_private: false
  },
  { 
    code: 'CDG', 
    name: 'Charles de Gaulle Airport', 
    city: 'Paris', 
    country: 'France',
    is_private: false
  },
  { 
    code: 'DXB', 
    name: 'Dubai International Airport', 
    city: 'Dubai', 
    country: 'United Arab Emirates',
    is_private: false
  },
  { 
    code: 'HND', 
    name: 'Tokyo Haneda Airport', 
    city: 'Tokyo', 
    country: 'Japan',
    is_private: false
  },
  { 
    code: 'SFO', 
    name: 'San Francisco International Airport', 
    city: 'San Francisco', 
    country: 'United States',
    is_private: false
  },
  { 
    code: 'BOS', 
    name: 'Boston Logan International Airport', 
    city: 'Boston', 
    country: 'United States',
    is_private: false
  },
  { 
    code: 'TEB', 
    name: 'Teterboro Airport', 
    city: 'Teterboro', 
    country: 'United States',
    is_private: true
  },
  { 
    code: 'VNY', 
    name: 'Van Nuys Airport', 
    city: 'Los Angeles', 
    country: 'United States',
    is_private: true
  }
];

// Popular locations for quick selection
const POPULAR_LOCATIONS = [
  'New York (JFK)',
  'Los Angeles (LAX)',
  'London (LHR)',
  'Paris (CDG)',
  'Dubai (DXB)',
  'Tokyo (HND)'
];

/**
 * The LocationAutocomplete component provides a sophisticated search interface 
 * for finding airports and destinations. It integrates autocomplete suggestions, 
 * visual feedback, and supports both departure and arrival styling variants.
 * 
 * This component is a critical part of the flight booking process, enabling users 
 * to easily search and select from thousands of potential locations.
 */
const meta = {
  title: 'Jetshare/LocationAutocomplete',
  component: LocationAutocomplete,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Location Autocomplete

## Overview
The LocationAutocomplete component provides a sophisticated search interface for finding and selecting airports and destinations. It delivers instant feedback through an autocomplete dropdown, helping users quickly narrow down their choices from thousands of options.

## Primary Function
This component serves as the location selection method throughout the platform, appearing in:
- Flight search forms
- JetShare route selection
- Charter flight requests
- Trip planning interfaces

## Key Features
- **Intelligent Search**: Searches across airport codes, city names, and airport names
- **Visual Variants**: Different styling for departure and arrival locations
- **Popular Destinations**: Quick access to common locations
- **Clean Selection**: Formatted display of selected locations with airport codes
- **Error Handling**: Clear feedback for invalid selections
- **Responsive Design**: Adapts to different viewport sizes
- **Private Airport Support**: Distinguishes between commercial and private airports

## Usage Patterns
The component is typically used in pairs (departure and arrival) within flight search forms. It provides real-time feedback as users type, helping them quickly find their desired location without needing to know exact airport codes.

## Accessibility Considerations
- Full keyboard navigation support for dropdown items
- Clear visual distinction between departure and arrival variants
- Visible focus states and hover interactions
- Appropriate ARIA attributes for screen reader compatibility
- Animation considerations for reduced motion preferences
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'The currently selected location',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '' },
        category: 'Selection State'
      }
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text displayed when no location is selected',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Enter location' },
        category: 'Display Options'
      }
    },
    label: {
      control: 'text',
      description: 'Label text displayed above the input',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Display Options'
      }
    },
    airports: {
      control: 'object',
      description: 'Array of airport objects to search through',
      table: {
        type: { summary: 'Airport[]' },
        defaultValue: { summary: '[]' },
        category: 'Data Sources'
      }
    },
    popularLocations: {
      control: 'object',
      description: 'Array of popular location strings for quick selection',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '[]' },
        category: 'Data Sources'
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
    },
    variant: {
      control: { type: 'radio', options: ['departure', 'arrival'] },
      description: 'Visual styling variant for different location types',
      table: {
        type: { summary: "'departure' | 'arrival'" },
        defaultValue: { summary: "'departure'" },
        category: 'Styling'
      }
    },
    error: {
      control: 'text',
      description: 'Error message to display below the input',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Validation'
      }
    },
    name: {
      control: 'text',
      description: 'Name attribute for form identification',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'DOM Attributes'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="p-6 bg-gray-900 max-w-[500px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LocationAutocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view of the LocationAutocomplete component with departure styling.
 * 
 * This example demonstrates the component with no selected location,
 * displaying the placeholder text and ready for user interaction.
 */
export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Where are you flying from?',
    label: 'Departure',
    airports: SAMPLE_AIRPORTS,
    popularLocations: POPULAR_LOCATIONS,
    variant: 'departure'
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic implementation of the LocationAutocomplete component with departure styling. The component displays a placeholder and allows searching through a list of airports.'
      }
    }
  }
};

/**
 * The arrival variant of the LocationAutocomplete component.
 * 
 * This example demonstrates the component with arrival-specific styling,
 * using amber/gold colors instead of blue to help users distinguish
 * between departure and arrival fields.
 */
export const ArrivalVariant: Story = {
  args: {
    value: '',
    placeholder: 'Where are you flying to?',
    label: 'Arrival',
    airports: SAMPLE_AIRPORTS,
    popularLocations: POPULAR_LOCATIONS,
    variant: 'arrival'
  },
  parameters: {
    docs: {
      description: {
        story: 'The arrival variant uses amber/gold color styling instead of blue to provide a visual distinction between departure and arrival inputs.'
      }
    }
  }
};

/**
 * LocationAutocomplete with a pre-selected airport.
 * 
 * This example demonstrates how the component displays when a location
 * is already selected, showing the formatted display with city name and airport code.
 */
export const WithSelectedLocation: Story = {
  args: {
    value: 'New York (JFK)',
    placeholder: 'Where are you flying from?',
    label: 'Departure',
    airports: SAMPLE_AIRPORTS,
    popularLocations: POPULAR_LOCATIONS
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how the component displays a selected location, with the airport code highlighted within a badge for quick visual recognition.'
      }
    }
  }
};

/**
 * LocationAutocomplete in an error state.
 * 
 * This example demonstrates how the component displays validation errors,
 * typically used when a location is required but not provided, or when
 * an invalid location has been entered.
 */
export const WithError: Story = {
  args: {
    value: '',
    placeholder: 'Where are you flying from?',
    label: 'Departure',
    airports: SAMPLE_AIRPORTS,
    popularLocations: POPULAR_LOCATIONS,
    error: 'Departure location is required'
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the error state with a validation message, highlighting the input with a red border to indicate an issue that needs attention.'
      }
    }
  }
};

/**
 * Interactive LocationAutocomplete demonstrating the search workflow.
 * 
 * This example provides a fully functional implementation where users can
 * search for locations, select from the dropdown, and clear their selection.
 */
export const Interactive: Story = {
  args: {
    value: ''
  },
  render: () => {
    const [departureValue, setDepartureValue] = useState('');
    const [arrivalValue, setArrivalValue] = useState('');
    
    // Set up event handlers
    React.useEffect(() => {
      const handleLocationChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.name === 'departure') {
          setDepartureValue(customEvent.detail.value);
          action('departure-changed')(customEvent.detail.value);
        } else if (customEvent.detail.name === 'arrival') {
          setArrivalValue(customEvent.detail.value);
          action('arrival-changed')(customEvent.detail.value);
        }
      };
      
      window.addEventListener('locationChange', handleLocationChange);
      
      return () => {
        window.removeEventListener('locationChange', handleLocationChange);
      };
    }, []);
    
    return (
      <div className="space-y-6">
        <LocationAutocomplete
          value={departureValue}
          placeholder="Where are you flying from?"
          label="Departure"
          airports={SAMPLE_AIRPORTS}
          popularLocations={POPULAR_LOCATIONS}
          variant="departure"
          name="departure"
        />
        
        <LocationAutocomplete
          value={arrivalValue}
          placeholder="Where are you flying to?"
          label="Arrival"
          airports={SAMPLE_AIRPORTS}
          popularLocations={POPULAR_LOCATIONS}
          variant="arrival"
          name="arrival"
        />
        
        {(departureValue || arrivalValue) && (
          <div className="mt-4 p-3 bg-gray-800 rounded-md text-white text-sm">
            <div className="text-gray-400 text-xs mb-1">Selected Locations:</div>
            {departureValue && (
              <div><span className="text-blue-400">From:</span> {departureValue}</div>
            )}
            {arrivalValue && (
              <div><span className="text-amber-400">To:</span> {arrivalValue}</div>
            )}
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A fully interactive example with paired departure and arrival inputs, demonstrating the complete location selection workflow. Users can search through the sample airports and make selections for both fields.'
      }
    }
  }
};

/**
 * LocationAutocomplete with no airport data - falls back to popular locations.
 * 
 * This example demonstrates how the component behaves when no airport data
 * is available, falling back to using the popularLocations array.
 */
export const WithoutAirportData: Story = {
  args: {
    value: '',
    placeholder: 'Where are you flying from?',
    label: 'Departure',
    airports: [],
    popularLocations: POPULAR_LOCATIONS
  },
  parameters: {
    docs: {
      description: {
        story: 'When no airport data is available, the component falls back to the popularLocations array for search suggestions, ensuring users can still make selections even when the full airport database cannot be accessed.'
      }
    }
  }
};

/**
 * LocationAutocomplete with only private airports.
 * 
 * This example demonstrates the component configured to display
 * private airports that are typically used by private jets.
 */
export const PrivateAirports: Story = {
  args: {
    value: '',
    placeholder: 'Private airport',
    label: 'Private Jet Terminal',
    airports: SAMPLE_AIRPORTS.filter(airport => airport.is_private),
    popularLocations: ['Teterboro (TEB)', 'Van Nuys (VNY)']
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuration focused on private airports commonly used by private jets, demonstrating how the component can be used for specialized airport selections.'
      }
    }
  }
}; 
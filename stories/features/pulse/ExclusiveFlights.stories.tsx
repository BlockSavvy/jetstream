import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ExclusiveFlights } from '../../../stories/mocks/pulse/ExclusiveFlights';

// Mock data for exclusive flights
const mockExclusiveFlights = [
  {
    id: 'ex-1001',
    fromLocation: {
      name: 'Teterboro Airport',
      code: 'TEB',
      city: 'Teterboro',
      state: 'NJ',
      country: 'USA',
      iata: 'TEB',
      latitude: 40.8499,
      longitude: -74.0608,
    },
    toLocation: {
      name: 'Van Nuys Airport',
      code: 'VNY',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      iata: 'VNY',
      latitude: 34.2098,
      longitude: -118.4897,
    },
    departureTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    arrivalTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // 6 hours flight time
    basePrice: 42500,
    aiMatchScore: 98,
    availableSeats: 10,
    totalSeats: 14,
    jet: {
      id: 'jet-5001',
      model: 'Gulfstream G650',
      manufacturer: 'Gulfstream',
      imageUrl: 'https://example.com/g650.jpg',
      range: 7000,
      speed: 561,
      passengerCapacity: 14,
      amenities: ['Wi-Fi', 'Entertainment System', 'Full Kitchen', 'Bedroom', 'Shower', 'Conference Area'],
      yearManufactured: 2021,
    },
    isExclusive: true,
    exclusiveTag: 'VIP Access',
    exclusiveBenefits: [
      'Private terminal access',
      'Dedicated concierge',
      'Premium catering package',
      'Ground transportation included',
      'Flexible departure window'
    ],
    limitedTimeOffer: true,
    offerExpiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(), // 36 hours from now
  },
  {
    id: 'ex-1002',
    fromLocation: {
      name: 'Westchester County Airport',
      code: 'HPN',
      city: 'White Plains',
      state: 'NY',
      country: 'USA',
      iata: 'HPN',
      latitude: 41.0670,
      longitude: -73.7076,
    },
    toLocation: {
      name: 'Miami International Airport',
      code: 'MIA',
      city: 'Miami',
      state: 'FL',
      country: 'USA',
      iata: 'MIA',
      latitude: 25.7932,
      longitude: -80.2906,
    },
    departureTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    arrivalTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours flight time
    basePrice: 28500,
    aiMatchScore: 95,
    availableSeats: 8,
    totalSeats: 8,
    jet: {
      id: 'jet-5002',
      model: 'Cessna Citation X',
      manufacturer: 'Cessna',
      imageUrl: 'https://example.com/citationx.jpg',
      range: 3460,
      speed: 527,
      passengerCapacity: 8,
      amenities: ['Wi-Fi', 'Entertainment System', 'Refreshment Center', 'Executive Seating'],
      yearManufactured: 2020,
    },
    isExclusive: true,
    exclusiveTag: 'Members Only',
    exclusiveBenefits: [
      'Last-minute booking available',
      'Premium onboard experience',
      'Personalized service',
      'Priority scheduling'
    ],
    limitedTimeOffer: true,
    offerExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
  },
  {
    id: 'ex-1003',
    fromLocation: {
      name: 'San Francisco International Airport',
      code: 'SFO',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      iata: 'SFO',
      latitude: 37.6213,
      longitude: -122.3790,
    },
    toLocation: {
      name: 'Aspen/Pitkin County Airport',
      code: 'ASE',
      city: 'Aspen',
      state: 'CO',
      country: 'USA',
      iata: 'ASE',
      latitude: 39.2232,
      longitude: -106.8691,
    },
    departureTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    arrivalTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours flight time
    basePrice: 35700,
    aiMatchScore: 91,
    availableSeats: 6,
    totalSeats: 10,
    jet: {
      id: 'jet-5003',
      model: 'Bombardier Global 7500',
      manufacturer: 'Bombardier',
      imageUrl: 'https://example.com/global7500.jpg',
      range: 7700,
      speed: 593,
      passengerCapacity: 10,
      amenities: ['Wi-Fi', 'Entertainment System', 'Full Kitchen', 'Bedroom', 'Shower', 'Office Area'],
      yearManufactured: 2022,
    },
    isExclusive: true,
    exclusiveTag: 'Seasonal Special',
    exclusiveBenefits: [
      'Ski equipment transport included',
      'Helicopter transfer to resort available',
      'Extended baggage allowance',
      'Winter welcome package'
    ],
    limitedTimeOffer: true,
    offerExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours from now
  }
];

// Mock the fetch API for the component
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: mockExclusiveFlights }),
  })
) as jest.Mock;

/**
 * The ExclusiveFlights component showcases premium, limited-time flight opportunities
 * powered by Pulse AI's exclusive matching algorithm.
 * 
 * This component is designed to highlight high-end private jet opportunities that
 * are available exclusively to Jetstream members, often with additional benefits
 * and premium services. The AI-powered match score indicates how well each flight
 * aligns with the user's preferences and travel history.
 * 
 * The component features:
 * - Elegant, premium UI design for exclusive offerings
 * - AI match score highlighting compatibility with user preferences
 * - Limited-time offer countdown timers to create urgency
 * - Exclusive benefits clearly highlighted
 * - Detailed aircraft information for discerning travelers
 */
const meta: Meta<typeof ExclusiveFlights> = {
  title: 'Features/Pulse/ExclusiveFlights',
  component: ExclusiveFlights,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Exclusive Flights Component

The Exclusive Flights component showcases premium, high-demand flights with limited availability. This component is part of the Pulse AI system that identifies and promotes exclusive travel opportunities.

## Key Features:
- **Visual Flight Cards:** Rich media cards that highlight exclusive flight options with compelling imagery
- **Limited Time Offers:** Display time-sensitive flight opportunities that may not be available through regular channels
- **Dynamic Availability:** Real-time seat availability updates
- **Premium Styling:** High-end visual presentation that reflects the exclusive nature of these flights

## Integration with Pulse AI:
This component is integrated with the Pulse AI system to:
1. Identify high-demand routes with limited availability
2. Match exclusive opportunities with user preferences and history
3. Prioritize and showcase flights that align with user travel patterns

## Technical Implementation:
- Designed with Tailwind CSS for a modern, premium aesthetic
- Responsive card layout that adapts to various screen sizes
- Efficient lazy-loading of flight images
- Integration with booking systems for real-time availability
        `
      }
    },
    tags: ['autodocs'],
  },
  argTypes: {
    userId: { 
      control: 'text',
      description: 'Optional user ID for personalized flight suggestions' 
    },
    limit: { 
      control: { type: 'number', min: 1, max: 6 },
      description: 'Maximum number of exclusive flights to display' 
    },
    title: {
      control: 'text',
      description: 'Custom title for the exclusive flights section'
    }
  }
};

export default meta;
type Story = StoryObj<typeof ExclusiveFlights>;

// Default story
export const Default: Story = {
  args: {
    limit: 3
  }
};

// With custom title
export const CustomTitle: Story = {
  parameters: {
    docs: {
      description: {
        story: 'ExclusiveFlights with a custom title.'
      }
    }
  },
  args: {
    title: 'VIP Holiday Destinations',
    limit: 3
  }
};

// Show more flights
export const MoreFlights: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Showing a larger collection of exclusive flights.'
      }
    }
  },
  args: {
    limit: 6,
    title: 'Premium Winter Escapes'
  }
};

// Mobile view
export const MobileView: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile view of the Exclusive Flights component.'
      }
    }
  },
  args: {
    limit: 2
  }
}; 
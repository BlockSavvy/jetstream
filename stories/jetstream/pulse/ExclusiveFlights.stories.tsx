import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import ExclusiveFlights from '../../../app/pulse/components/ExclusiveFlights';

// This is a simple wrapper to mock the fetch API
const ExclusiveFlightsWithMockedAPI = () => {
  // Override fetch before component renders
  React.useEffect(() => {
    const originalFetch = window.fetch;
    
    // Mock data for the component
    const mockFlights = [
      {
        id: 'ex-1001',
        departure_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        arrival_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
        base_price: 42500,
        available_seats: 10,
        total_seats: 14,
        destination: {
          name: 'Van Nuys Airport',
          code: 'VNY',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          iata: 'VNY'
        },
        origin: {
          name: 'Teterboro Airport',
          code: 'TEB',
          city: 'Teterboro',
          state: 'NJ',
          country: 'USA',
          iata: 'TEB'
        },
        jets: {
          id: 'jet-5001',
          model: 'G650',
          manufacturer: 'Gulfstream',
          image_url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
          passenger_capacity: 14,
          year_manufactured: 2021
        }
      },
      {
        id: 'ex-1002',
        departure_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        arrival_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        base_price: 28500,
        available_seats: 2,
        total_seats: 8,
        destination: {
          name: 'Miami International Airport',
          code: 'MIA',
          city: 'Miami',
          state: 'FL',
          country: 'USA',
          iata: 'MIA'
        },
        origin: {
          name: 'Westchester County Airport',
          code: 'HPN',
          city: 'White Plains',
          state: 'NY',
          country: 'USA',
          iata: 'HPN'
        },
        jets: {
          id: 'jet-5002',
          model: 'Citation X',
          manufacturer: 'Cessna',
          image_url: 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=1936&auto=format&fit=crop&ixlib=rb-4.0.3',
          passenger_capacity: 8,
          year_manufactured: 2020
        }
      },
      {
        id: 'ex-1003',
        departure_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        arrival_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000).toISOString(),
        base_price: 35700,
        available_seats: 1,
        total_seats: 10,
        destination: {
          name: 'Aspen/Pitkin County Airport',
          code: 'ASE',
          city: 'Aspen',
          state: 'CO',
          country: 'USA',
          iata: 'ASE'
        },
        origin: {
          name: 'San Francisco International Airport',
          code: 'SFO',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          iata: 'SFO'
        },
        jets: {
          id: 'jet-5003',
          model: 'Global 7500',
          manufacturer: 'Bombardier',
          image_url: 'https://images.unsplash.com/photo-1530160919058-d31934f6a2e7?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3',
          passenger_capacity: 10,
          year_manufactured: 2022
        }
      }
    ];
    
    // Replace fetch with mocked version
    window.fetch = () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockFlights)
    } as Response);
    
    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return <ExclusiveFlights />;
};

// Loading state wrapper
const ExclusiveFlightsLoading = () => {
  React.useEffect(() => {
    const originalFetch = window.fetch;
    
    // Replace fetch with delayed version
    window.fetch = () => new Promise((resolve) => {
      // Long delay to keep the loading state visible
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve([])
        } as Response);
      }, 10000);
    });
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return <ExclusiveFlights />;
};

// Error state wrapper
const ExclusiveFlightsError = () => {
  React.useEffect(() => {
    const originalFetch = window.fetch;
    
    // Create a proper mock response for error case
    const mockErrorResponse = new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
    
    // Replace fetch with error version
    window.fetch = () => Promise.resolve(mockErrorResponse);
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return <ExclusiveFlights />;
};

/**
 * The ExclusiveFlights component showcases premium, limited-time flight opportunities
 * powered by Pulse AI's exclusive matching algorithm.
 * 
 * This component is designed to highlight high-end private jet opportunities that
 * are available exclusively to Jetstream members, often with additional benefits
 * and premium services including NFT-tokenized tickets for verifiable ownership.
 */
const meta: Meta = {
  title: 'Features/Pulse/ExclusiveFlights',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Exclusive Flights Component

The Exclusive Flights component showcases premium, high-demand flights with limited availability. This component is part of the Pulse AI system that identifies and promotes exclusive travel opportunities with NFT-tokenized tickets.

## Key Features:
- **NFT-Tokenized Tickets:** Blockchain-backed flight tickets providing verifiable ownership and transferability
- **Visual Flight Cards:** Rich media cards that highlight exclusive flight options with compelling imagery
- **Limited Time Offers:** Display time-sensitive flight opportunities that may not be available through regular channels
- **Dynamic Availability:** Real-time seat availability updates
- **Premium Styling:** High-end visual presentation that reflects the exclusive nature of these flights

## Integration with Pulse AI:
This component is integrated with the Pulse AI system to:
1. Identify high-demand routes with limited availability
2. Match exclusive opportunities with user preferences and history
3. Prioritize and showcase flights that align with user travel patterns
4. Track event-specific flight opportunities (music festivals, conferences, etc.)

## Technical Implementation:
- Designed with Tailwind CSS for a modern, premium aesthetic
- Responsive card layout that adapts to various screen sizes
- Efficient lazy-loading of flight images
- Integration with booking systems for real-time availability
- Blockchain integration for NFT-tokenized tickets
        `
      }
    },
    tags: ['autodocs'],
  }
};

export default meta;
type Story = StoryObj;

// Default story with mocked data
export const Default: Story = {
  render: () => <ExclusiveFlightsWithMockedAPI />
};

// Loading state story
export const Loading: Story = {
  render: () => <ExclusiveFlightsLoading />,
  parameters: {
    docs: {
      description: {
        story: 'The loading state of the ExclusiveFlights component while waiting for data to load.'
      }
    }
  }
};

// Error state story
export const Error: Story = {
  render: () => <ExclusiveFlightsError />,
  parameters: {
    docs: {
      description: {
        story: 'The error state of the ExclusiveFlights component when data fetching fails.'
      }
    }
  }
}; 
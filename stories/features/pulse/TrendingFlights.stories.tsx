import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import TrendingFlights from '../../../app/pulse/components/TrendingFlights';

// This is a simple wrapper to mock the fetch API
const TrendingFlightsWithMockedAPI = () => {
  // Override fetch before component renders
  React.useEffect(() => {
    const originalFetch = window.fetch;
    
    // Mock data for the component
    const mockFlights = [
      {
        id: '1',
        departure_time: '2023-12-15T09:00:00Z',
        arrival_time: '2023-12-15T12:00:00Z',
        base_price: 18000,
        available_seats: 2,
        origin: { 
          city: 'New York',
          code: 'JFK'
        },
        destination: { 
          city: 'Miami',
          code: 'MIA'
        },
        jets: {
          id: 'jet1',
          model: 'G550',
          capacity: 12,
          image_url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3'
        }
      },
      {
        id: '2',
        departure_time: '2023-12-16T14:30:00Z',
        arrival_time: '2023-12-16T16:45:00Z',
        base_price: 22000,
        available_seats: 4,
        origin: { 
          city: 'Los Angeles',
          code: 'LAX'
        },
        destination: { 
          city: 'Las Vegas',
          code: 'LAS'
        },
        jets: {
          id: 'jet2',
          model: 'Citation X',
          capacity: 8,
          image_url: 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=1936&auto=format&fit=crop&ixlib=rb-4.0.3'
        }
      },
      {
        id: '3',
        departure_time: '2023-12-17T07:15:00Z',
        arrival_time: '2023-12-17T10:30:00Z',
        base_price: 25000,
        available_seats: 1,
        origin: { 
          city: 'Chicago',
          code: 'ORD'
        },
        destination: { 
          city: 'Aspen',
          code: 'ASE'
        },
        jets: {
          id: 'jet3',
          model: 'G600',
          capacity: 14,
          image_url: 'https://images.unsplash.com/photo-1530160919058-d31934f6a2e7?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3'
        }
      },
      {
        id: '4',
        departure_time: '2023-12-18T11:00:00Z',
        arrival_time: '2023-12-18T14:15:00Z',
        base_price: 19500,
        available_seats: 6,
        origin: { 
          city: 'San Francisco',
          code: 'SFO'
        },
        destination: { 
          city: 'Maui',
          code: 'OGG'
        },
        jets: {
          id: 'jet4',
          model: 'Global 7500',
          capacity: 16,
          image_url: 'https://images.unsplash.com/photo-1608497651329-b82f29745511?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3'
        }
      },
      {
        id: '5',
        departure_time: '2023-12-19T09:30:00Z',
        arrival_time: '2023-12-19T11:45:00Z',
        base_price: 21000,
        available_seats: 3,
        origin: { 
          city: 'Boston',
          code: 'BOS'
        },
        destination: { 
          city: 'Washington D.C.',
          code: 'IAD'
        },
        jets: {
          id: 'jet5',
          model: 'Falcon 8X',
          capacity: 10,
          image_url: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3'
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
  
  return <TrendingFlights />;
};

// Loading state wrapper
const TrendingFlightsLoading = () => {
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
  
  return <TrendingFlights />;
};

// Error state wrapper
const TrendingFlightsError = () => {
  React.useEffect(() => {
    const originalFetch = window.fetch;
    
    // Replace fetch with error version
    window.fetch = () => Promise.resolve({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Failed to fetch flights'))
    } as Response);
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  return <TrendingFlights />;
};

/**
 * The TrendingFlights component displays AI-recommended flight options
 * based on user preferences and trending destinations. It's a key part of the
 * Pulse AI matching system that showcases personalized flight recommendations.
 */
const meta = {
  title: 'Features/Pulse/TrendingFlights',
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0F1419' },
        { name: 'light', value: '#F7FAFC' },
      ],
    },
    docs: {
      description: {
        component: `
# Trending Flights Component

This component displays AI-powered flight recommendations in a carousel format. It uses the Pulse AI matching system to identify and display flights that match user preferences.

## Key Features:
- **AI Match Scoring**: Dynamic scoring system to show how well each flight matches user preferences
- **Responsive Carousel**: Horizontal scrolling display for efficient browsing
- **Urgency Indicators**: Visual cues that highlight limited availability
- **Price Integration**: Clear display of pricing with traditional and token-based options
- **Visual Cards**: Rich media presentation of flight options with dynamic data

## Integration with Pulse AI:
The component integrates with the Pulse AI system to:
1. Analyze user preferences and travel history
2. Identify trending destinations among similar users
3. Calculate personalized match scores based on multiple factors
4. Prioritize flights based on relevance and availability

## Technical Implementation:
- Built with a responsive carousel layout using Radix UI
- Optimized for both desktop and mobile viewing experiences
- Employs dynamic image loading for jet visuals
- Features real-time integration with flight inventory systems
`
      }
    }
  },
  decorators: [
    (Story) => (
      <div style={{ width: '1200px', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

// Default story with mocked data
export const Default: Story = {
  render: () => <TrendingFlightsWithMockedAPI />
};

// Loading state story
export const Loading: Story = {
  render: () => <TrendingFlightsLoading />,
  parameters: {
    docs: {
      description: {
        story: 'The loading state of the TrendingFlights component while waiting for data to load.'
      }
    }
  }
};

// Error state story
export const Error: Story = {
  render: () => <TrendingFlightsError />,
  parameters: {
    docs: {
      description: {
        story: 'The error state of the TrendingFlights component when data fetching fails.'
      }
    }
  }
}; 
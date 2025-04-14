import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PulseRecommendations from '../../../app/dashboard/components/PulseRecommendations';

// This is a wrapper to mock the auth provider and fetch API
const PulseRecommendationsWithMockedAPI = () => {
  // Mock the useAuth hook
  React.useEffect(() => {
    // Mock the useAuth hook
    const originalUseAuth = require('@/components/auth-provider').useAuth;
    require('@/components/auth-provider').useAuth = () => ({
      user: { id: 'user-123', email: 'test@example.com' },
      isLoading: false,
    });
    
    // Mock the useUserProfile hook
    const originalUseUserProfile = require('@/hooks/useUserProfile').useUserProfile;
    require('@/hooks/useUserProfile').useUserProfile = () => ({
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        preferredAirports: ['JFK', 'LAX'],
        preferredDestinations: ['MIA', 'LAS'],
      },
      isLoading: false,
    });
    
    // Override fetch before component renders
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
      }
    ];
    
    // Replace fetch with mocked version
    window.fetch = () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockFlights)
    } as Response);
    
    // Cleanup function to restore original fetch and hooks
    return () => {
      window.fetch = originalFetch;
      require('@/components/auth-provider').useAuth = originalUseAuth;
      require('@/hooks/useUserProfile').useUserProfile = originalUseUserProfile;
    };
  }, []);
  
  return <PulseRecommendations />;
};

// Loading state wrapper
const PulseRecommendationsLoading = () => {
  React.useEffect(() => {
    // Mock the useAuth hook
    const originalUseAuth = require('@/components/auth-provider').useAuth;
    require('@/components/auth-provider').useAuth = () => ({
      user: { id: 'user-123', email: 'test@example.com' },
      isLoading: false,
    });
    
    // Mock the useUserProfile hook
    const originalUseUserProfile = require('@/hooks/useUserProfile').useUserProfile;
    require('@/hooks/useUserProfile').useUserProfile = () => ({
      profile: null,
      isLoading: true,
    });
    
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
      require('@/components/auth-provider').useAuth = originalUseAuth;
      require('@/hooks/useUserProfile').useUserProfile = originalUseUserProfile;
    };
  }, []);
  
  return <PulseRecommendations />;
};

// Empty state wrapper
const PulseRecommendationsEmpty = () => {
  React.useEffect(() => {
    // Mock the useAuth hook
    const originalUseAuth = require('@/components/auth-provider').useAuth;
    require('@/components/auth-provider').useAuth = () => ({
      user: { id: 'user-123', email: 'test@example.com' },
      isLoading: false,
    });
    
    // Mock the useUserProfile hook
    const originalUseUserProfile = require('@/hooks/useUserProfile').useUserProfile;
    require('@/hooks/useUserProfile').useUserProfile = () => ({
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        // No preferences set
      },
      isLoading: false,
    });
    
    const originalFetch = window.fetch;
    
    // Return empty array to show no recommendations
    window.fetch = () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    } as Response);
    
    return () => {
      window.fetch = originalFetch;
      require('@/components/auth-provider').useAuth = originalUseAuth;
      require('@/hooks/useUserProfile').useUserProfile = originalUseUserProfile;
    };
  }, []);
  
  return <PulseRecommendations />;
};

/**
 * The PulseRecommendations component displays personalized flight recommendations
 * on the user dashboard based on their Pulse AI preferences.
 */
const meta: Meta<typeof PulseRecommendations> = {
  title: 'Features/Pulse/PulseRecommendations',
  component: PulseRecommendations,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'dark', value: '#0F1419' },
        { name: 'light', value: '#F7FAFC' },
      ],
    },
    docs: {
      description: {
        component: `
# Pulse Recommendations Component

This component displays AI-powered flight recommendations on the user dashboard. It uses the Pulse AI matching system to show personalized flight options based on user preferences and travel history.

## Key Features:
- **Dashboard Integration**: Designed to be displayed prominently on the user dashboard
- **AI Match Scoring**: Shows personalized match percentage for each recommendation
- **Compact Display**: Efficiently presents multiple recommendations in a limited space
- **Quick Booking**: Direct booking access through prominent call-to-action
- **Fallback States**: Handles loading and empty states gracefully

## User Experience:
The component is designed to provide users with a quick overview of their personalized flight opportunities without overwhelming them. It features:
- Clear match scoring to highlight relevance
- Essential flight details in a compact format
- Quick access to booking flow
- Visual distinction between recommendations

## Technical Implementation:
- Integrates with user authentication system
- Fetches personalized recommendations from the API
- Calculates match scores based on multiple factors
- Handles various state transitions smoothly
`
      }
    }
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: '400px', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PulseRecommendations>;

// Default story with mocked data
export const Default: Story = {
  render: () => <PulseRecommendationsWithMockedAPI />,
  parameters: {
    docs: {
      description: {
        story: 'The default state of the PulseRecommendations component showing personalized flight recommendations on the dashboard.'
      }
    }
  }
};

// Loading state story
export const Loading: Story = {
  render: () => <PulseRecommendationsLoading />,
  parameters: {
    docs: {
      description: {
        story: 'The loading state of the PulseRecommendations component while recommendations are being fetched.'
      }
    }
  }
};

// Empty state story
export const Empty: Story = {
  render: () => <PulseRecommendationsEmpty />,
  parameters: {
    docs: {
      description: {
        story: 'The empty state of the PulseRecommendations component when no recommendations are available or user preferences are not set.'
      }
    }
  }
}; 
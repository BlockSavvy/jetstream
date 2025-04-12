import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetShareListingsContent from '../../../app/jetshare/components/JetShareListingsContent';

/**
 * The JetShareListingsContent component displays available jet share offers
 * in a grid layout, with filtering, sorting, and detailed information for each listing.
 */

// Mock data for jet share offers
const mockOffers = [
  {
    id: '1',
    departure_time: '2023-12-15T09:00:00Z',
    arrival_time: '2023-12-15T12:00:00Z',
    departure_location: 'New York (JFK)',
    arrival_location: 'Miami (MIA)',
    status: 'open',
    aircraft_model: 'Gulfstream G650',
    jet_id: 'g650-1',
    total_seats: 16,
    available_seats: 8,
    total_flight_cost: 45000,
    requested_share_amount: 22500,
    created_at: '2023-11-20T14:30:00Z',
    user: {
      id: 'user-456',
      first_name: 'Emma',
      last_name: 'Thompson',
      email: 'emma@example.com',
      avatar_url: 'https://randomuser.me/api/portraits/women/32.jpg',
      verification_status: 'verified'
    },
    jet: {
      id: 'g650-1',
      manufacturer: 'Gulfstream',
      model: 'G650',
      image_url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      capacity: 16,
      range_nm: 7000,
      cruise_speed_kts: 516
    }
  },
  {
    id: '2',
    departure_time: '2023-12-18T14:30:00Z',
    arrival_time: '2023-12-18T16:45:00Z',
    departure_location: 'Los Angeles (LAX)',
    arrival_location: 'Las Vegas (LAS)',
    status: 'open',
    aircraft_model: 'Cessna Citation X',
    jet_id: 'citation-1',
    total_seats: 8,
    available_seats: 4,
    total_flight_cost: 28000,
    requested_share_amount: 14000,
    created_at: '2023-11-22T10:15:00Z',
    user: {
      id: 'user-789',
      first_name: 'Michael',
      last_name: 'Rodriguez',
      email: 'michael@example.com',
      avatar_url: 'https://randomuser.me/api/portraits/men/45.jpg',
      verification_status: 'verified'
    },
    jet: {
      id: 'citation-1',
      manufacturer: 'Cessna',
      model: 'Citation X',
      image_url: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      capacity: 8,
      range_nm: 3700,
      cruise_speed_kts: 527
    }
  },
  {
    id: '3',
    departure_time: '2023-12-20T08:15:00Z',
    arrival_time: '2023-12-20T11:30:00Z',
    departure_location: 'Chicago (ORD)',
    arrival_location: 'Aspen (ASE)',
    status: 'open',
    aircraft_model: 'Bombardier Global 7500',
    jet_id: 'global-1',
    total_seats: 19,
    available_seats: 10,
    total_flight_cost: 65000,
    requested_share_amount: 32500,
    created_at: '2023-11-25T09:45:00Z',
    user: {
      id: 'user-123',
      first_name: 'James',
      last_name: 'Wilson',
      email: 'james@example.com',
      avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg',
      verification_status: 'pending'
    },
    jet: {
      id: 'global-1',
      manufacturer: 'Bombardier',
      model: 'Global 7500',
      image_url: 'https://images.unsplash.com/photo-1577387197562-a0929cfcbb9b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3',
      capacity: 19,
      range_nm: 7700,
      cruise_speed_kts: 516
    }
  }
];

// Create a wrapper with mocked auth and API
const JetShareListingsContentWithMocks = ({ variant = 'default' }) => {
  // Mock the necessary providers and hooks
  React.useEffect(() => {
    // Mock the auth provider
    const originalUseAuth = require('@/components/auth-provider').useAuth;
    require('@/components/auth-provider').useAuth = () => ({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
      refreshSession: () => Promise.resolve(),
    });
    
    // Mock Next.js router and search params
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: (url: string) => console.log(`Navigation to: ${url}`),
        replace: (url: string) => console.log(`Replace navigation to: ${url}`),
      }),
      useSearchParams: () => ({
        get: (param: string) => null,
      }),
    }));
    
    // Mock the createClient function
    const originalCreateClient = require('@/lib/supabase').createClient;
    require('@/lib/supabase').createClient = () => ({
      auth: {
        getSession: () => Promise.resolve({ data: { session: { access_token: 'test-token', user: { id: 'user-123' } } } }),
      },
    });
    
    // Mock fetch requests
    const originalFetch = window.fetch;
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.includes('/api/jetshare/offers') || url.includes('/api/jetshare/listings')) {
        // Handle different variants
        if (variant === 'empty') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          } as Response);
        } 
        
        if (variant === 'loading') {
          // Return a promise that never resolves to keep loading state
          return new Promise(() => {});
        }
        
        // Default variant with mock data
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOffers)
        } as Response);
      }
      
      return originalFetch(input, init);
    }) as typeof window.fetch;
    
    return () => {
      require('@/components/auth-provider').useAuth = originalUseAuth;
      require('@/lib/supabase').createClient = originalCreateClient;
      window.fetch = originalFetch;
      jest.resetAllMocks();
    };
  }, [variant]);
  
  return <JetShareListingsContent />;
};

const meta: Meta<typeof JetShareListingsContent> = {
  title: 'Features/JetShare/JetShareListingsContent',
  component: JetShareListingsContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# JetShare Listings Content Component

This component displays available jet share listings in a grid layout, allowing users to browse, filter, and interact with jet share offers from other users.

## Key Features:
- **Listing Cards**: Visual display of available jet share offers with key details
- **Filtering System**: Ability to filter by location, date, price range, and more
- **Sorting Options**: Sort listings by different criteria (date, price, etc.)
- **Search Functionality**: Search across all listings by keyword
- **Detailed View**: Modal with comprehensive information about each listing
- **Interactive Actions**: Ability to request more information or book directly
- **Responsive Design**: Adapts to various screen sizes with appropriate layouts

## User Experience:
The component is designed to provide an intuitive browsing experience with:
- Clear visual hierarchy of listing information
- Quick-access filtering and sorting controls
- Streamlined booking process
- Visual indicators for availability and status
- User verification badges for trust and safety

## Technical Implementation:
- Real-time data fetching and filtering
- Optimized rendering for large listing sets
- Integrated authentication checks for booking actions
- Responsive grid system for different devices
- Advanced filter state management
`
      }
    }
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ maxWidth: '100%', backgroundColor: '#f9fafb' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JetShareListingsContent>;

// Default story
export const Default: Story = {
  render: () => <JetShareListingsContentWithMocks variant="default" />,
  parameters: {
    docs: {
      description: {
        story: 'The default state of the JetShareListingsContent component showing available jet share listings.'
      }
    }
  }
};

// Loading state story
export const Loading: Story = {
  render: () => <JetShareListingsContentWithMocks variant="loading" />,
  parameters: {
    docs: {
      description: {
        story: 'The loading state of the JetShareListingsContent component while fetching listings data.'
      }
    }
  }
};

// Empty state story
export const Empty: Story = {
  render: () => <JetShareListingsContentWithMocks variant="empty" />,
  parameters: {
    docs: {
      description: {
        story: 'The empty state of the JetShareListingsContent component when no listings are available.'
      }
    }
  }
}; 
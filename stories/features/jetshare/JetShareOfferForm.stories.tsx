import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetShareOfferForm from '../../../app/jetshare/components/JetShareOfferForm';

/**
 * The JetShareOfferForm component provides a multi-step form for users to
 * create or edit jet share offers. It captures flight details, aircraft selection,
 * seat configuration, and cost sharing options.
 */

// Create a wrapper with mocked provider
const JetShareOfferFormWithMocks = ({ editOfferId = null }: { editOfferId?: string | null }) => {
  // Mock the necessary providers and hooks
  React.useEffect(() => {
    // Mock the auth provider
    const originalUseAuth = require('@/components/auth-provider').useAuth;
    require('@/components/auth-provider').useAuth = () => ({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
    });
    
    // Mock Next.js router
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: (url: string) => console.log(`Navigation to: ${url}`),
      }),
    }));
    
    // Mock the createClientComponentClient function
    const originalCreateClient = require('@supabase/auth-helpers-nextjs').createClientComponentClient;
    require('@supabase/auth-helpers-nextjs').createClientComponentClient = () => ({
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: 'user-123', email: 'test@example.com' } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => Promise.resolve({ data: { id: 'new-offer-id' }, error: null }),
        update: () => Promise.resolve({ data: { id: 'updated-offer-id' }, error: null }),
      }),
    });
    
    // Mock fetch requests for airports
    const originalFetch = window.fetch;
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.includes('/api/airports')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
            { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
            { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'USA' },
            { code: 'ORD', name: 'Chicago O\'Hare International Airport', city: 'Chicago', country: 'USA' },
            { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'UK' },
          ])
        } as Response);
      }
      
      if (url.includes('/api/jets') || url.includes('/api/aircraft')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'jet1', manufacturer: 'Gulfstream', model: 'G650', display_name: 'Gulfstream G650', seat_capacity: 16 },
            { id: 'jet2', manufacturer: 'Bombardier', model: 'Global 7500', display_name: 'Bombardier Global 7500', seat_capacity: 19 },
            { id: 'jet3', manufacturer: 'Dassault', model: 'Falcon 8X', display_name: 'Dassault Falcon 8X', seat_capacity: 14 },
            { id: 'jet4', manufacturer: 'Cessna', model: 'Citation Longitude', display_name: 'Cessna Citation Longitude', seat_capacity: 12 },
          ])
        } as Response);
      }
      
      if (editOfferId && url.includes(`/api/jetshare/offers/${editOfferId}`)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: editOfferId,
            departure_time: '2023-12-15T09:00:00Z',
            departure_location: 'New York (JFK)',
            arrival_location: 'Miami (MIA)',
            aircraft_model: 'Gulfstream G650',
            jet_id: 'jet1',
            total_seats: 16,
            available_seats: 8,
            total_flight_cost: 45000,
            requested_share_amount: 22500,
            seat_split_configuration: {
              jetId: 'jet1',
              splitOrientation: 'horizontal',
              splitRatio: '50/50',
              splitPercentage: 50,
              allocatedSeats: {
                front: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'],
                back: ['E1', 'E2', 'F1', 'F2', 'G1', 'G2', 'H1', 'H2']
              }
            }
          })
        } as Response);
      }
      
      return originalFetch(input, init);
    }) as typeof window.fetch;
    
    return () => {
      require('@/components/auth-provider').useAuth = originalUseAuth;
      require('@supabase/auth-helpers-nextjs').createClientComponentClient = originalCreateClient;
      window.fetch = originalFetch;
      jest.resetAllMocks();
    };
  }, [editOfferId]);
  
  return <JetShareOfferForm editOfferId={editOfferId} />;
};

const meta: Meta<typeof JetShareOfferForm> = {
  title: 'Features/JetShare/JetShareOfferForm',
  component: JetShareOfferForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# JetShare Offer Form Component

This component provides a comprehensive multi-step form for users to create or edit jet share offers. It guides users through entering flight details, selecting aircraft, configuring seat allocation, and setting up cost sharing options.

## Key Features:
- **Multi-Step Interface**: Breaks down the complex process into manageable sections
- **Interactive Visualizations**: Visual seat selection and configuration
- **Dynamic Pricing**: Real-time calculation of costs and share amounts
- **Form Validation**: Comprehensive validation for all required fields
- **Location Autocomplete**: Airport selection with autocomplete
- **Edit Mode**: Supports both creating new offers and editing existing ones

## User Experience:
The form is designed with a focus on usability and clarity, featuring:
- Step-by-step progression with clear navigation
- Visual feedback on selections and configurations
- Interactive elements for complex selections
- Responsive design for both desktop and mobile use
- Contextual help and information

## Technical Implementation:
- Built with React Hook Form for state management
- Uses Zod for schema validation
- Implements dynamic API integrations for data
- Features interactive visualizations with custom components
- Handles complex data structures for seat configurations
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
type Story = StoryObj<typeof JetShareOfferForm>;

// Default story (create mode)
export const Default: Story = {
  render: () => <JetShareOfferFormWithMocks />,
  parameters: {
    docs: {
      description: {
        story: 'The default state of the JetShareOfferForm component for creating a new jet share offer.'
      }
    }
  }
};

// Edit mode story
export const EditMode: Story = {
  render: () => <JetShareOfferFormWithMocks editOfferId="existing-offer-123" />,
  parameters: {
    docs: {
      description: {
        story: 'The edit mode of the JetShareOfferForm component loaded with existing offer data.'
      }
    }
  }
}; 
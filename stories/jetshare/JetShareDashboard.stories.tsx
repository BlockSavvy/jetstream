import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetShareDashboard from '@/app/jetshare/components/JetShareDashboard';
import { action } from '@storybook/addon-actions';

/**
 * The JetShareDashboard component provides a centralized interface for users to manage their 
 * jet sharing activities. It displays comprehensive information about offers, bookings, 
 * completed flights, transactions, and key metrics in a tabbed interface.
 * 
 * This component is essential for the jet sharing platform, serving as the main control center 
 * for users to track and manage all aspects of their private jet sharing experience.
 */
const meta = {
  title: 'Jetshare/JetShareDashboard',
  component: JetShareDashboard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# JetShare Dashboard

## Overview
The JetShareDashboard is the central control center of the Jetstream platform's jet sharing experience. It provides a comprehensive interface for users to track and manage all aspects of their private jet sharing activities, from offers they've posted to bookings they've made.

## Primary Function
This component serves as the main management interface for users, allowing them to:
- View a summary of their jet sharing statistics
- Track offers they've created for others to book
- Monitor bookings they've made on other users' jets
- Access transaction history and financial details
- View completed flights and access boarding passes

## Key Features
- **Tabbed Interface**: Clean organization of different data types
- **Dashboard Overview**: Quick statistics and recent activity
- **Offers Management**: Track and manage offers posted for others
- **Bookings Management**: Monitor and manage flights booked from others
- **Completed Flights**: Access past flight details and boarding passes
- **Transaction History**: Track all financial transactions
- **Interactive Cards**: Rich display of flight details with action buttons
- **Status Indicators**: Visual indicators for different flight statuses
- **Loading States**: Skeleton loaders during data fetching
- **Error Handling**: Graceful display of error messages

## Data Architecture
The dashboard implements a resilient data fetching strategy:
1. Attempts to use authenticated sessions from Supabase
2. Falls back to localStorage user identification if session is unavailable
3. Uses the auth context as a final fallback
4. Implements appropriate error handling for all data fetching scenarios

## Usage Patterns
This component is typically the central hub that users return to after completing actions like creating an offer, making a booking, or completing a payment. It serves as both an entry point to other workflows and a comprehensive overview of all user activity.
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    initialTab: {
      control: { type: 'radio', options: ['dashboard', 'offers', 'bookings', 'transactions'] },
      description: 'The initially active tab when the dashboard loads',
      table: {
        type: { summary: '"dashboard" | "offers" | "bookings" | "transactions"' },
        defaultValue: { summary: '"dashboard"' },
        category: 'Navigation'
      }
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display at the top of the dashboard',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Notifications'
      }
    },
    successMessage: {
      control: 'text',
      description: 'Success message to display via toast notification',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Notifications'
      }
    }
  }
} satisfies Meta<typeof JetShareDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for the stories
const MOCK_OFFERS = [
  {
    id: 'offer1',
    status: 'open',
    departure_location: 'New York (JFK)',
    arrival_location: 'Los Angeles (LAX)',
    flight_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    total_flight_cost: 25000,
    requested_share_amount: 8500,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    jet_type: 'Gulfstream G650',
    user_id: 'user1',
    user: { id: 'user1', first_name: 'John', last_name: 'Smith' }
  },
  {
    id: 'offer2',
    status: 'open',
    departure_location: 'London (LHR)',
    arrival_location: 'Paris (CDG)',
    flight_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    total_flight_cost: 18000,
    requested_share_amount: 6000,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    jet_type: 'Embraer Phenom 300',
    user_id: 'user1',
    user: { id: 'user1', first_name: 'John', last_name: 'Smith' }
  }
];

const MOCK_BOOKINGS = [
  {
    id: 'booking1',
    status: 'accepted',
    departure_location: 'Miami (MIA)',
    arrival_location: 'Bahamas (NAS)',
    flight_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    total_flight_cost: 15000,
    requested_share_amount: 5000,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    jet_type: 'Citation XLS+',
    user_id: 'user2',
    matched_user_id: 'user1',
    matched_user: { id: 'user1', first_name: 'John', last_name: 'Smith' },
    user: { id: 'user2', first_name: 'Sarah', last_name: 'Johnson' }
  }
];

const MOCK_COMPLETED = [
  {
    id: 'completed1',
    status: 'completed',
    departure_location: 'San Francisco (SFO)',
    arrival_location: 'Las Vegas (LAS)',
    flight_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    total_flight_cost: 12000,
    requested_share_amount: 4000,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    jet_type: 'Learjet 75',
    user_id: 'user1',
    matched_user_id: 'user3',
    matched_user: { id: 'user3', first_name: 'Alex', last_name: 'Williams' },
    user: { id: 'user1', first_name: 'John', last_name: 'Smith' }
  }
];

const MOCK_TRANSACTIONS = [
  {
    id: 'tx1',
    amount: 5000,
    status: 'completed',
    payment_method: 'card',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    payer_id: 'user1',
    recipient_id: 'user3',
    offer_id: 'completed1',
    payer_user: { id: 'user1', first_name: 'John', last_name: 'Smith' },
    recipient_user: { id: 'user3', first_name: 'Alex', last_name: 'Williams' },
    offer: {
      departure_location: 'San Francisco (SFO)',
      arrival_location: 'Las Vegas (LAS)',
      flight_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'tx2',
    amount: 6500,
    status: 'completed',
    payment_method: 'crypto',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    payer_id: 'user3',
    recipient_id: 'user1',
    offer_id: 'oldoffer1',
    payer_user: { id: 'user3', first_name: 'Alex', last_name: 'Williams' },
    recipient_user: { id: 'user1', first_name: 'John', last_name: 'Smith' },
    offer: {
      departure_location: 'Denver (DEN)',
      arrival_location: 'Chicago (ORD)',
      flight_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
];

const MOCK_STATS = {
  totalOffers: 15,
  totalBookings: 8,
  totalSpent: 35000,
  totalEarned: 48500
};

/**
 * Default view of the JetShareDashboard showing the dashboard overview tab.
 * 
 * This example demonstrates the component with populated data, showing statistics,
 * recent transactions, and access to offers, bookings, and transaction history.
 */
export const Default: Story = {
  args: {
    initialTab: 'dashboard'
  },
  render: () => {
    // Mock the API calls
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getOffers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              offers: [...MOCK_OFFERS, ...MOCK_BOOKINGS, ...MOCK_COMPLETED]
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/getTransactions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              transactions: MOCK_TRANSACTIONS
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: MOCK_STATS
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Create auth context mock
      Object.defineProperty(window, 'user', {
        value: { id: 'user1', first_name: 'John', last_name: 'Smith' }
      });
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user1');
      }
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetShareDashboard initialTab="dashboard" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Default implementation of the JetShareDashboard showing the overview tab with statistics and recent activity. All tabs are populated with mock data for a complete experience.'
      }
    }
  }
};

/**
 * JetShareDashboard focused on the offers tab.
 * 
 * This example shows the dashboard with the offers tab active, displaying
 * the jet share offers the user has created for others to book.
 */
export const OffersTab: Story = {
  args: {
    initialTab: 'offers'
  },
  render: () => {
    // Mock the API calls
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getOffers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              offers: [...MOCK_OFFERS, ...MOCK_BOOKINGS, ...MOCK_COMPLETED]
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/getTransactions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              transactions: MOCK_TRANSACTIONS
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: MOCK_STATS
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user1');
      }
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetShareDashboard initialTab="offers" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays the JetShareDashboard with the offers tab active, showing the jet shares that the user has created and posted for others to book.'
      }
    }
  }
};

/**
 * JetShareDashboard focused on the bookings tab.
 * 
 * This example shows the dashboard with the bookings tab active, displaying
 * the jet shares the user has booked from other users, including accepted
 * and completed flights.
 */
export const BookingsTab: Story = {
  args: {
    initialTab: 'bookings'
  },
  render: () => {
    // Mock the API calls
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getOffers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              offers: [...MOCK_OFFERS, ...MOCK_BOOKINGS, ...MOCK_COMPLETED]
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/getTransactions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              transactions: MOCK_TRANSACTIONS
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: MOCK_STATS
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user1');
      }
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetShareDashboard initialTab="bookings" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the JetShareDashboard with the bookings tab active, displaying flights the user has booked from other jet owners, including completed flights and access to boarding passes.'
      }
    }
  }
};

/**
 * JetShareDashboard focused on the transactions tab.
 * 
 * This example shows the dashboard with the transactions tab active, displaying
 * the user's financial transaction history related to jet sharing.
 */
export const TransactionsTab: Story = {
  args: {
    initialTab: 'transactions'
  },
  render: () => {
    // Mock the API calls
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getOffers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              offers: [...MOCK_OFFERS, ...MOCK_BOOKINGS, ...MOCK_COMPLETED]
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/getTransactions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              transactions: MOCK_TRANSACTIONS
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: MOCK_STATS
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user1');
      }
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetShareDashboard initialTab="transactions" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays the JetShareDashboard with the transactions tab active, showing the user\'s financial history related to jet sharing, including payments made and received.'
      }
    }
  }
};

/**
 * JetShareDashboard in a loading state.
 * 
 * This example demonstrates how the dashboard looks during the data loading phase,
 * showing skeleton loaders in place of actual content.
 */
export const LoadingState: Story = {
  args: {
    initialTab: 'dashboard'
  },
  render: () => {
    // Mock a slow API response
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare')) {
          // Return a promise that never resolves to maintain loading state
          return new Promise(() => {});
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user1');
      }
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetShareDashboard initialTab="dashboard" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the JetShareDashboard in a loading state, with skeleton loaders displayed while data is being fetched from the API.'
      }
    }
  }
};

/**
 * JetShareDashboard with an error message.
 * 
 * This example shows how the dashboard displays an error message when something
 * goes wrong, such as an API failure or authentication issue.
 */
export const WithError: Story = {
  args: {
    initialTab: 'dashboard',
    errorMessage: 'Unable to load your dashboard data. Please try again later.'
  },
  render: () => {
    // Mock API failure
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getOffers')) {
          return Promise.reject(new Error('Failed to fetch offers'));
        }
        
        if (url.includes('/api/jetshare/getTransactions')) {
          return Promise.reject(new Error('Failed to fetch transactions'));
        }
        
        if (url.includes('/api/jetshare/stats')) {
          return Promise.reject(new Error('Failed to fetch stats'));
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user1');
      }
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetShareDashboard
      initialTab="dashboard"
      errorMessage="Unable to load your dashboard data. Please try again later."
    />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the JetShareDashboard handles and displays error messages when API calls fail or other issues occur.'
      }
    }
  }
};

/**
 * JetShareDashboard with a success message toast.
 * 
 * This example shows how the dashboard displays a success toast notification,
 * typically after completing an action like a successful booking.
 */
export const WithSuccessMessage: Story = {
  args: {
    initialTab: 'bookings',
    successMessage: 'Your booking has been completed successfully!'
  },
  render: () => {
    // Mock the API calls
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getOffers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              offers: [...MOCK_OFFERS, ...MOCK_BOOKINGS, ...MOCK_COMPLETED]
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/getTransactions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              transactions: MOCK_TRANSACTIONS
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: MOCK_STATS
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user1');
      }
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetShareDashboard
      initialTab="bookings"
      successMessage="Your booking has been completed successfully!"
    />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the JetShareDashboard displaying a success message toast notification, which typically appears after completing an action like booking a flight or creating an offer.'
      }
    }
  }
};

/**
 * Empty state JetShareDashboard for new users.
 * 
 * This example shows how the dashboard appears for new users who haven't
 * created any offers or made any bookings yet.
 */
export const EmptyState: Story = {
  args: {
    initialTab: 'dashboard'
  },
  render: () => {
    // Mock empty API responses
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getOffers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              offers: []
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/getTransactions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              transactions: []
            })
          } as Response);
        }
        
        if (url.includes('/api/jetshare/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              stats: {
                totalOffers: 0,
                totalBookings: 0,
                totalSpent: 0,
                totalEarned: 0
              }
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user1');
      }
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetShareDashboard initialTab="dashboard" />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays the JetShareDashboard in its empty state for new users who haven\'t yet created any offers or made any bookings, showing appropriate call-to-action buttons.'
      }
    }
  }
}; 
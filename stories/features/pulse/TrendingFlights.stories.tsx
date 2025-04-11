import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import TrendingFlights from '../../../app/pulse/components/TrendingFlights';

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
      image_url: '/images/jets/g550.jpg'
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
      image_url: '/images/jets/citation-x.jpg'
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
      image_url: '/images/jets/g600.jpg'
    }
  }
];

// Mock the fetch API for the component
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockFlights)
  })
) as jest.Mock;

/**
 * The TrendingFlights component displays AI-recommended flight options
 * based on user preferences and trending destinations. It's a key part of the
 * Pulse AI matching system that showcases personalized flight recommendations.
 */
const meta = {
  title: 'Features/Pulse AI/TrendingFlights',
  component: TrendingFlights,
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
        component: 'This component displays AI-powered flight recommendations in a carousel format. It uses the Pulse AI system to identify and display flights that match user preferences.'
      }
    }
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '1200px', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TrendingFlights>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state showing the trending flights
 */
export const Default: Story = {
  args: {},
};

/**
 * Note: This component makes API calls to fetch flight data in production.
 * In Storybook, we mock these API calls to show sample data. 
 * 
 * Key Features:
 * - AI match scoring for personalized recommendations
 * - Responsive carousel display of trending flights
 * - Dynamic urgency messaging based on availability
 * - Integrated with user preferences from the Pulse system
 */ 
import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetSharePaymentForm from '@/app/jetshare/components/JetSharePaymentForm';
import { action } from '@storybook/addon-actions';

/**
 * The JetSharePaymentForm component handles payment processing for jet share bookings.
 * It supports multiple payment methods and shows order summary information.
 */
const meta = {
  title: 'JetShare/JetSharePaymentForm',
  component: JetSharePaymentForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# JetShare Payment Form

## Overview
The JetSharePaymentForm handles the payment processing step of the jet sharing booking flow, allowing users to securely complete their transaction.

## Primary Function
This component serves as the payment interface, providing:
- Multiple payment methods
- Order summary
- Secure payment processing
- Confirmation messaging
`
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof JetSharePaymentForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for the stories
const MOCK_OFFER = {
  id: 'offer123',
  status: 'accepted' as const,
  departure_location: 'New York (JFK)',
  arrival_location: 'Los Angeles (LAX)',
  flight_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  departure_time: '10:00 AM',
  arrival_time: '1:30 PM',
  total_flight_cost: 25000,
  requested_share_amount: 8500,
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  jet_type: 'Gulfstream G650',
  user_id: 'user1',
  matched_user_id: 'user2',
  selected_seats: ['A1', 'A2'],
  total_seats: 16,
  requested_seats: 2,
  user: { 
    id: 'user1', 
    first_name: 'John', 
    last_name: 'Smith',
    email: 'john@example.com'
  },
  matched_user: {
    id: 'user2',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com'
  }
};

/**
 * Default view of the JetSharePaymentForm showing the standard payment flow
 * with multiple payment methods and order summary.
 */
export const Default: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: (args) => {
    // Mock the fetch API
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/process-payment')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              message: 'Payment processed successfully',
              data: {
                transaction_id: 'tx123',
                amount: MOCK_OFFER.requested_share_amount,
                status: 'completed'
              }
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetSharePaymentForm offer={args.offer} />;
  }
};

/**
 * The JetSharePaymentForm in test mode, which shows additional debugging
 * information and allows for test payments without actual transactions.
 */
export const TestMode: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: (args) => {
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/process-payment')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              message: 'Test payment processed successfully',
              data: {
                transaction_id: 'test_tx123',
                amount: MOCK_OFFER.requested_share_amount,
                status: 'completed',
                test: true
              }
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetSharePaymentForm offer={args.offer} />;
  }
}; 
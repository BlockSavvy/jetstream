import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BoardingPassButton from '@/app/jetshare/components/BoardingPassButton';
import { action } from '@storybook/addon-actions';

/**
 * The BoardingPassButton component provides convenient access to digital boarding passes
 * for booked flights. It handles the generation and download of boarding passes in
 * different formats, including PDF documents and mobile wallet passes.
 * 
 * This component is essential for the post-booking experience, allowing travelers to
 * easily access their flight credentials for a seamless travel experience.
 */
const meta = {
  title: 'Jetshare/BoardingPassButton',
  component: BoardingPassButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Boarding Pass Button

## Overview
The BoardingPassButton component provides a simple, elegant interface for passengers to access their digital boarding passes. It handles the generation and delivery of boarding pass documents in multiple formats for a seamless travel experience.

## Primary Function
This component serves as a quick access point for boarding passes, appearing in:
- Flight detail pages
- Confirmation emails
- User dashboards
- Transaction receipts
- Mobile device wallets

## Key Features
- **Multi-format Support**: Generates both standard PDF boarding passes and mobile wallet passes
- **Apple Wallet Integration**: One-click addition to iOS Wallet app
- **Graceful Error Handling**: Clear feedback when boarding pass generation fails
- **Loading States**: Visual feedback during document generation
- **Test Mode Support**: Special handling for development environments
- **Responsive Design**: Works seamlessly across device sizes

## Technical Implementation
The component implements a robust boarding pass delivery workflow:
1. Makes API requests to the boarding pass generation service
2. Processes and validates response data
3. Opens the appropriate document in a new browser tab or triggers wallet download
4. Provides clear success/error feedback via toast notifications

## Usage Guidelines
This component should be displayed prominently after successful booking or payment completion. It should be accessible anywhere users might need to retrieve their boarding pass, especially in:
- Pre-flight reminder emails
- Booking details pages
- Flight status updates
- Digital receipt pages
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    offerId: {
      control: 'text',
      description: 'Unique identifier for the flight offer',
      table: {
        type: { summary: 'string' },
        category: 'Required'
      }
    },
    transactionId: {
      control: 'text',
      description: 'Optional transaction ID for the booking payment',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Optional Identifiers'
      }
    },
    isTestMode: {
      control: 'boolean',
      description: 'Indicates whether the button should operate in test mode',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Environment'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900 rounded-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BoardingPassButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view of the BoardingPassButton.
 * 
 * This example demonstrates the component in its standard configuration,
 * ready to generate and download a boarding pass.
 */
export const Default: Story = {
  args: {
    offerId: 'offer123',
    isTestMode: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Default implementation of the BoardingPassButton component showing both the standard boarding pass download and Apple Wallet buttons.'
      }
    }
  }
};

/**
 * BoardingPassButton in loading state while generating the pass.
 * 
 * This example demonstrates the button during the loading state
 * when a boarding pass is being generated.
 */
export const Loading: Story = {
  args: {
    offerId: 'offer123',
    isTestMode: true
  },
  render: (args) => {
    // Mock loading state
    React.useEffect(() => {
      // Mock API calls
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/generateBoardingPass')) {
          // Return a promise that never resolves to maintain loading state
          return new Promise(() => {});
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Simulate button click to trigger loading state
      setTimeout(() => {
        const downloadButton = document.querySelector('button');
        if (downloadButton) {
          downloadButton.click();
        }
      }, 500);
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <BoardingPassButton {...args} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the BoardingPassButton in the loading state, displayed while the boarding pass is being generated on the server.'
      }
    }
  }
};

/**
 * BoardingPassButton in test mode.
 * 
 * This example demonstrates the button in test mode, where it generates
 * mock boarding passes for testing and development.
 */
export const TestMode: Story = {
  args: {
    offerId: 'test-offer-456',
    isTestMode: true
  },
  parameters: {
    docs: {
      description: {
        story: 'The BoardingPassButton in test mode, which generates simulated boarding passes for development and testing purposes.'
      }
    }
  }
};

/**
 * BoardingPassButton using transaction ID for identification.
 * 
 * This example demonstrates the button using a transaction ID instead of an
 * offer ID to generate the boarding pass.
 */
export const WithTransactionId: Story = {
  args: {
    offerId: 'offer123',
    transactionId: 'tx789',
    isTestMode: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the BoardingPassButton using a transaction ID instead of an offer ID to generate the boarding pass, which is useful in post-payment contexts.'
      }
    }
  }
};

/**
 * BoardingPassButton with successful API response.
 * 
 * This example demonstrates the button with a mocked successful response
 * from the boarding pass generation API.
 */
export const SuccessfulGeneration: Story = {
  args: {
    offerId: 'offer123',
    isTestMode: true
  },
  render: (args) => {
    // Mock successful API response
    React.useEffect(() => {
      // Mock API calls
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/generateBoardingPass')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              downloadUrl: 'https://example.com/boardingpass.pdf',
              walletUrl: 'https://example.com/boardingpass.pkpass',
              boardingPass: {
                passengerId: 'pax123',
                flightNumber: 'JS1234',
                departureTime: new Date().toISOString(),
                boardingTime: new Date().toISOString(),
                gate: 'G12',
                seat: '3A'
              }
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Set up a mock window.open to prevent actual navigation
      const originalOpen = window.open;
      window.open = (url?: string | URL, target?: string, features?: string) => {
        action('window.open')(url, target, features);
        return null;
      };
      
      return () => {
        window.fetch = originalFetch;
        window.open = originalOpen;
      };
    }, []);
    
    return <BoardingPassButton {...args} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the BoardingPassButton with a mocked successful response from the boarding pass generation API. In a real application, this would open the boarding pass in a new tab.'
      }
    }
  }
};

/**
 * BoardingPassButton with error handling.
 * 
 * This example demonstrates how the button handles and displays errors
 * when boarding pass generation fails.
 */
export const WithError: Story = {
  args: {
    offerId: 'invalid-offer',
    isTestMode: true
  },
  render: (args) => {
    // Mock error API response
    React.useEffect(() => {
      // Mock API calls
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/generateBoardingPass')) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({
              success: false,
              message: 'Failed to generate boarding pass',
              error: 'Offer not found or boarding pass not available yet'
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Simulate button click to trigger error state
      setTimeout(() => {
        const downloadButton = document.querySelector('button');
        if (downloadButton) {
          downloadButton.click();
        }
      }, 500);
      
      // Mock toast functionality
      if (typeof window !== 'undefined' && !window.hasOwnProperty('toast')) {
        Object.defineProperty(window, 'toast', {
          value: {
            error: (message: string) => {
              action('toast.error')(message);
              
              // Create a visual error message for storybook demonstration
              const errorToast = document.createElement('div');
              errorToast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg';
              errorToast.textContent = message;
              document.body.appendChild(errorToast);
              
              setTimeout(() => {
                errorToast.remove();
              }, 3000);
            }
          }
        });
      }
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <BoardingPassButton {...args} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the BoardingPassButton handles and displays errors when boarding pass generation fails, providing clear feedback to the user.'
      }
    }
  }
}; 
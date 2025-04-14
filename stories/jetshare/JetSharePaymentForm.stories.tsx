import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetSharePaymentForm from '../../../app/jetshare/components/JetSharePaymentForm';
import { action } from '@storybook/addon-actions';

/**
 * The JetSharePaymentForm component handles the payment processing workflow for jet share bookings.
 * It provides a secure, multi-step interface for users to review their booking details and
 * complete the payment process using various payment methods.
 * 
 * This component is critical for completing the booking journey in the jet sharing platform,
 * providing a seamless checkout experience for users.
 */
const meta = {
  title: 'Jetshare/JetSharePaymentForm',
  component: JetSharePaymentForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# JetShare Payment Form

## Overview
The JetSharePaymentForm is a comprehensive payment processing component for the Jetstream platform. It guides users through a multi-step workflow to securely complete payments for jet share bookings, supporting both credit card and cryptocurrency payment methods.

## Primary Function
This component serves as the final step in the booking process, allowing users to:
- Review booking details before payment
- Select their preferred payment method
- Enter or select payment information securely
- Complete the transaction
- Receive confirmation of successful payment

## Key Features
- **Multi-step Workflow**: Guides users through the payment process systematically
- **Booking Review**: Clear summary of flight details and costs before payment
- **Multiple Payment Methods**: Support for credit cards and cryptocurrency
- **Saved Payment Methods**: Option to use previously saved payment information
- **Secure Processing**: Handling of sensitive payment data
- **Error Handling**: Clear feedback for payment issues
- **Success Confirmation**: Confirmation of successful transactions
- **Test Mode Support**: Special handling for development and testing scenarios

## Payment Flow Architecture
The payment form implements a robust payment processing workflow:
1. **Confirmation Step**: Review booking details and costs
2. **Payment Method Selection**: Choose between card payment and cryptocurrency
3. **Payment Details**: Enter card information or initiate crypto payment
4. **Processing**: Secure handling of the payment transaction
5. **Confirmation**: Success notification and booking confirmation

## Security Considerations
- Implements proper validation of card details
- Never sends raw card details directly to the server
- Uses tokenization for secure payment processing
- Provides clear error handling for failed payments
- Implements authentication verification before processing

## Usage Patterns
This component is the final step in the booking workflow, accessed after a user has selected a jet share and confirmed their interest in booking. Upon successful payment, users are redirected to a confirmation page and can access their booking details and boarding pass.
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {}
} satisfies Meta<typeof JetSharePaymentForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock offer data for the stories
const MOCK_OFFER = {
  id: 'offer123',
  departure_location: 'New York (JFK)',
  arrival_location: 'Los Angeles (LAX)',
  flight_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  departure_time: '10:00 AM',
  total_flight_cost: 24000,
  requested_share_amount: 8000,
  user_id: 'user1',
  user: {
    id: 'user1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john@example.com'
  },
  matched_user_id: 'user2',
  matched_user: {
    id: 'user2',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com'
  },
  jet_type: 'Gulfstream G650',
  status: 'accepted' as const,
  total_seats: 16,
  requested_seats: 2,
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
};

/**
 * Default view of the JetSharePaymentForm in the confirmation step.
 * 
 * This example demonstrates the first step of the payment process where
 * users can review their booking details before proceeding to payment.
 */
export const Default: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: () => {
    // Mock necessary APIs and authentication
    React.useEffect(() => {
      // Setup auth mocks
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user2');
      }
      
      // Mock auth context
      Object.defineProperty(window, 'user', {
        value: { id: 'user2', first_name: 'Jane', last_name: 'Doe' }
      });
      
      // Mock API calls
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
                status: 'completed',
                redirect_url: '/jetshare/payment/success'
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
    
    return <JetSharePaymentForm offer={MOCK_OFFER} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Default implementation showing the first step of the payment process where users review their booking details before proceeding to payment.'
      }
    }
  }
};

/**
 * JetSharePaymentForm in the credit card payment step.
 * 
 * This example demonstrates the form with card payment method selected,
 * showing the credit card input fields for the user to complete.
 */
export const CardPaymentStep: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: () => {
    // Mock necessary APIs and authentication
    React.useEffect(() => {
      // Setup auth mocks
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user2');
        // Set payment step to card details
        localStorage.setItem('payment_step', 'details');
        localStorage.setItem('payment_method', 'card');
      }
      
      // Mock auth context
      Object.defineProperty(window, 'user', {
        value: { id: 'user2', first_name: 'Jane', last_name: 'Doe' }
      });
      
      // Mock API calls
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
                status: 'completed',
                redirect_url: '/jetshare/payment/success'
              }
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Simulate selection of card payment method
      setTimeout(() => {
        const methodButton = document.querySelector('[data-payment-method="card"]');
        if (methodButton) {
          (methodButton as HTMLElement).click();
        }
      }, 500);
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetSharePaymentForm offer={MOCK_OFFER} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the payment form with credit card payment method selected, displaying the card input fields where users can enter their payment information.'
      }
    }
  }
};

/**
 * JetSharePaymentForm with saved payment methods.
 * 
 * This example shows the payment form with previously saved payment methods
 * that the user can select instead of entering new card details.
 */
export const WithSavedPaymentMethods: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: () => {
    // Mock necessary APIs and authentication
    React.useEffect(() => {
      // Setup auth mocks
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user2');
        // Set payment step to card details with saved methods
        localStorage.setItem('payment_step', 'details');
        localStorage.setItem('payment_method', 'card');
        localStorage.setItem('has_saved_methods', 'true');
      }
      
      // Mock auth context
      Object.defineProperty(window, 'user', {
        value: { id: 'user2', first_name: 'Jane', last_name: 'Doe' }
      });
      
      // Mock API calls
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
                status: 'completed',
                redirect_url: '/jetshare/payment/success'
              }
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Simulate selection of card payment method with saved methods
      setTimeout(() => {
        const methodButton = document.querySelector('[data-payment-method="card"]');
        if (methodButton) {
          (methodButton as HTMLElement).click();
        }
      }, 500);
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetSharePaymentForm offer={MOCK_OFFER} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the payment form with previously saved payment methods that the user can select instead of entering new card details.'
      }
    }
  }
};

/**
 * JetSharePaymentForm with cryptocurrency payment selected.
 * 
 * This example shows the payment form with cryptocurrency as the selected
 * payment method, ready for the user to initiate a crypto payment.
 */
export const CryptoPayment: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: () => {
    // Mock necessary APIs and authentication
    React.useEffect(() => {
      // Setup auth mocks
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user2');
        // Set payment step to crypto
        localStorage.setItem('payment_step', 'method');
        localStorage.setItem('payment_method', 'crypto');
      }
      
      // Mock auth context
      Object.defineProperty(window, 'user', {
        value: { id: 'user2', first_name: 'Jane', last_name: 'Doe' }
      });
      
      // Mock API calls
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/process-payment')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              message: 'Crypto payment initiated',
              data: {
                transaction_id: 'crypto_tx123',
                amount: MOCK_OFFER.requested_share_amount,
                status: 'pending',
                redirect_url: '/jetshare/crypto-payment'
              }
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Simulate selection of crypto payment method
      setTimeout(() => {
        const methodButton = document.querySelector('[data-payment-method="crypto"]');
        if (methodButton) {
          (methodButton as HTMLElement).click();
        }
      }, 500);
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetSharePaymentForm offer={MOCK_OFFER} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the payment form with cryptocurrency as the selected payment method, ready for the user to initiate a crypto payment.'
      }
    }
  }
};

/**
 * JetSharePaymentForm in a processing state during payment submission.
 * 
 * This example demonstrates the loading/processing state shown while
 * the payment is being processed by the payment gateway.
 */
export const ProcessingState: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: () => {
    // Mock necessary APIs and authentication
    React.useEffect(() => {
      // Setup auth mocks
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user2');
        // Set payment to processing state
        localStorage.setItem('payment_step', 'processing');
        localStorage.setItem('payment_method', 'card');
      }
      
      // Mock auth context
      Object.defineProperty(window, 'user', {
        value: { id: 'user2', first_name: 'Jane', last_name: 'Doe' }
      });
      
      // Mock API calls with delay
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/process-payment')) {
          // Return a promise that resolves after a delay
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  message: 'Payment processed successfully',
                  data: {
                    transaction_id: 'tx123',
                    amount: MOCK_OFFER.requested_share_amount,
                    status: 'completed',
                    redirect_url: '/jetshare/payment/success'
                  }
                })
              } as Response);
            }, 10000); // Long delay to maintain processing state
          });
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Simulate submission of payment form
      setTimeout(() => {
        const submitButton = document.querySelector('form button[type="submit"]');
        if (submitButton) {
          (submitButton as HTMLElement).click();
        }
      }, 1000);
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetSharePaymentForm offer={MOCK_OFFER} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the loading/processing state of the payment form while a payment is being processed by the payment gateway.'
      }
    }
  }
};

/**
 * JetSharePaymentForm with an error state.
 * 
 * This example shows how the payment form handles and displays errors,
 * such as declined payments or validation failures.
 */
export const WithError: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: () => {
    // Mock necessary APIs and authentication
    React.useEffect(() => {
      // Setup auth mocks
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'user2');
        localStorage.setItem('payment_step', 'details');
        localStorage.setItem('payment_method', 'card');
        localStorage.setItem('payment_error', 'Your card was declined');
      }
      
      // Mock auth context
      Object.defineProperty(window, 'user', {
        value: { id: 'user2', first_name: 'Jane', last_name: 'Doe' }
      });
      
      // Mock API calls with error
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/process-payment')) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({
              success: false,
              message: 'Your card was declined',
              error: 'Payment failed: Card declined'
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Simulate error state
      setTimeout(() => {
        const methodButton = document.querySelector('[data-payment-method="card"]');
        if (methodButton) {
          (methodButton as HTMLElement).click();
        }
        
        // Inject error message
        const errorElement = document.createElement('div');
        errorElement.className = 'text-red-500 text-sm mt-2';
        errorElement.textContent = 'Your card was declined. Please try a different payment method.';
        
        const formElement = document.querySelector('form');
        if (formElement) {
          formElement.appendChild(errorElement);
        }
      }, 1000);
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetSharePaymentForm offer={MOCK_OFFER} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how the payment form handles and displays errors, such as declined payments or validation failures.'
      }
    }
  }
};

/**
 * JetSharePaymentForm with authentication error.
 * 
 * This example demonstrates how the payment form handles authentication issues,
 * prompting the user to log in again before completing the payment.
 */
export const AuthenticationError: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: () => {
    // Mock necessary APIs and authentication
    React.useEffect(() => {
      // Setup auth mocks - missing auth
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('jetstream_user_id');
        localStorage.setItem('payment_step', 'auth_error');
      }
      
      // Mock API calls with auth error
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/process-payment')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({
              success: false,
              message: 'Authentication required',
              error: 'Unauthorized',
              action: {
                type: 'login',
                returnUrl: `/jetshare/payment/${MOCK_OFFER.id}`
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
    
    return <JetSharePaymentForm offer={MOCK_OFFER} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the payment form handles authentication issues, prompting the user to log in again before completing the payment.'
      }
    }
  }
};

/**
 * JetSharePaymentForm in test mode.
 * 
 * This example shows the payment form in test mode, with special handling
 * for development and testing environments.
 */
export const TestMode: Story = {
  args: {
    offer: MOCK_OFFER
  },
  render: () => {
    // Mock necessary APIs and authentication
    React.useEffect(() => {
      // Setup auth mocks
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jetstream_user_id', 'test-user-123');
        localStorage.setItem('payment_step', 'details');
        localStorage.setItem('payment_method', 'card');
        localStorage.setItem('is_test_mode', 'true');
      }
      
      // Mock auth context
      Object.defineProperty(window, 'user', {
        value: { id: 'test-user-123', first_name: 'Test', last_name: 'User' }
      });
      
      // Set environment to test mode
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development'
      });
      
      // Mock API calls
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
                test: true,
                redirect_url: `/jetshare/payment/success?offer_id=${MOCK_OFFER.id}&test=true`
              }
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Simulate selection of card payment method
      setTimeout(() => {
        const methodButton = document.querySelector('[data-payment-method="card"]');
        if (methodButton) {
          (methodButton as HTMLElement).click();
        }
      }, 500);
      
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return <JetSharePaymentForm offer={MOCK_OFFER} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the payment form in test mode, with special handling for development and testing environments. Test mode displays additional information and allows for simulated payments without real transactions.'
      }
    }
  }
}; 
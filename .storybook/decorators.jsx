import React from 'react';
import { fn } from '@storybook/test';

// Ensure React is available globally
if (typeof window !== 'undefined') {
  window.React = React;
}

// Create a mock version of the AuthContext for Storybook stories
const mockAuthContext = {
  user: { 
    id: 'mocked-user-id', 
    email: 'test@example.com',
    app_metadata: { provider: 'email' },
    user_metadata: { name: 'Test User' }
  },
  session: { 
    access_token: 'mocked-access-token',
    refresh_token: 'mocked-refresh-token',
    expires_at: Date.now() + 3600000,
    user: {
      id: 'mocked-user-id', 
      email: 'test@example.com',
      app_metadata: { provider: 'email' },
      user_metadata: { name: 'Test User' }
    }
  },
  loading: false,
  signUp: fn(),
  signIn: fn(),
  signOut: fn(),
  resetPassword: fn(),
  refreshSession: fn().mockResolvedValue(true),
  sessionError: null
};

// Mock AuthContext for components that use useAuth()
const AuthContext = React.createContext(mockAuthContext);

// Export a mock AuthProvider component
export const MockAuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Decorator to wrap stories with MockAuthProvider
export const withAuthProvider = (Story) => (
  <MockAuthProvider>
    <Story />
  </MockAuthProvider>
);

// Mock hook implementation
export const useAuth = () => React.useContext(AuthContext);

// Useful mock responses for different API endpoints
export const mockApiResponses = {
  jets: [
    { id: 'jet1', name: 'Gulfstream G650', seats: 16, icon: '/images/jets/g650.svg' },
    { id: 'jet2', name: 'Bombardier Global 7500', seats: 19, icon: '/images/jets/global7500.svg' },
  ],
  layouts: {
    'jet1': { rows: 6, seatsPerRow: 4, layoutType: 'standard' },
    'jet2': { rows: 5, seatsPerRow: 5, layoutType: 'luxury' }
  }
};

// Mock fetch for components that need API data
export const withMockApiData = (Story, { parameters }) => {
  // Save the original fetch
  const originalFetch = window.fetch;

  // Create a mock fetch
  window.fetch = async (url, options) => {
    console.log('[Storybook Mock API] Fetch request:', url);
    
    if (url.includes('/api/jets/')) {
      const jetId = url.split('/').pop().split('?')[0];
      return {
        ok: true,
        json: async () => ({ id: jetId, name: `Mock Jet ${jetId}`, seatLayout: mockApiResponses.layouts[jetId] || mockApiResponses.layouts['jet1'] })
      };
    }
    
    if (url.includes('/api/jets')) {
      return {
        ok: true,
        json: async () => ({ jets: mockApiResponses.jets })
      };
    }
    
    // Add more mock endpoints as needed
    
    // Fall back to original fetch for other URLs
    return originalFetch(url, options);
  };
  
  return <Story />;
};

// Export all decorators
export { React }; 
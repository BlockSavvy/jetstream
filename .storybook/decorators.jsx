import React from 'react';
import { fn } from '@storybook/test';

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
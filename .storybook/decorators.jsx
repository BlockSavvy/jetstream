import React from 'react';

// Mock authentication context
const mockAuthContext = {
  user: { 
    id: 'mock-user-id', 
    email: 'test@example.com',
    app_metadata: { provider: 'email' },
    user_metadata: { name: 'Mock User' }
  },
  session: { 
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000,
    user: { id: 'mock-user-id' }
  },
  loading: false,
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  signUp: () => Promise.resolve(),
  resetPassword: () => Promise.resolve(),
  refreshSession: () => Promise.resolve(),
  sessionError: null
};

// Create context
const AuthContext = React.createContext(mockAuthContext);

// Export useAuth hook for components
export const useAuth = () => React.useContext(AuthContext);

// Auth provider component
export const MockAuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Decorator to wrap stories with auth provider
export const withAuthProvider = (Story) => (
  <MockAuthProvider>
    <Story />
  </MockAuthProvider>
);

// Export mock utils
export const utils = {
  cn: (...classNames) => classNames.filter(Boolean).join(' '),
  formatDate: (date) => date ? new Date(date).toLocaleDateString() : '',
  formatCurrency: (amount) => `$${Number(amount).toFixed(2)}`
};

// Export mock supabase
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: mockAuthContext.session } }),
    signInWithPassword: () => Promise.resolve({ data: { session: mockAuthContext.session } }),
    signOut: () => Promise.resolve()
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: {} })
      })
    }),
    insert: () => Promise.resolve({ data: {} }),
    update: () => Promise.resolve({ data: {} })
  })
}; 
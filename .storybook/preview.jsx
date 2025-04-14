import React from 'react';
import '../app/globals.css';

// Add global React reference - needs to be available before any component modules are loaded
if (typeof window !== 'undefined') {
  window.React = React;
  window.global = window;
}

// Basic mock auth context
const mockUser = { id: 'mock-user', email: 'user@example.com' };
const mockSession = { access_token: 'mock-token', user: mockUser };

const AuthContext = React.createContext({
  user: mockUser,
  session: mockSession,
  loading: false,
  signIn: () => Promise.resolve({ data: { user: mockUser, session: mockSession } }),
  signOut: () => Promise.resolve(),
});

// Export for components that need it
export const useAuth = () => React.useContext(AuthContext);

// Export mock supabase
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: mockSession } }),
    signInWithPassword: () => Promise.resolve({ data: { user: mockUser, session: mockSession } })
  }
};

// Wrapper component
const MockAuthProvider = ({ children }) => (
  <AuthContext.Provider value={AuthContext._currentValue || {
    user: mockUser,
    session: mockSession,
    loading: false,
    signIn: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
  }}>
    {children}
  </AuthContext.Provider>
);

// Global Storybook parameters
export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
};

// Global decorators
export const decorators = [
  (Story) => (
    <MockAuthProvider>
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    </MockAuthProvider>
  ),
]; 
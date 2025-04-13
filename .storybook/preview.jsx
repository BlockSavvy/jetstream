import React from 'react';
import '../app/globals.css';

// Make React available globally (for components that don't explicitly import it)
window.React = React;

// Simple mock of auth context for components that need it
const AuthContext = React.createContext({
  user: { id: 'mock-user', email: 'user@example.com' },
  session: { access_token: 'mock-token' },
  loading: false,
  signIn: () => {},
  signOut: () => {},
});

// Export for components that import it
export const useAuth = () => React.useContext(AuthContext);

// Mock auth provider component
const MockAuthProvider = ({ children }) => (
  <AuthContext.Provider value={AuthContext._currentValue}>
    {children}
  </AuthContext.Provider>
);

// Add global configuration for stories
export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
};

// Add global decorators
export const decorators = [
  // Wrap all stories with auth context
  (Story) => (
    <MockAuthProvider>
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    </MockAuthProvider>
  ),
]; 
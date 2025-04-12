import React from 'react';
import '../app/globals.css';
import { withAuthProvider } from './decorators.jsx';

// Global React availability
if (typeof window !== 'undefined') {
  window.React = React;
  window.process = window.process || {};
  window.process.env = {
    NODE_ENV: 'development',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-key'
  };
}

export const decorators = [
  withAuthProvider,
  (Story) => (
    <div style={{ margin: '1rem' }}>
      <Story />
    </div>
  ),
];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
};

export default {
  decorators,
  parameters
}; 
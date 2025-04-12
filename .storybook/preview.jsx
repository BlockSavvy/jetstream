import '../app/globals.css';
import React from 'react';
import { withAuthProvider, withMockApiData } from './decorators.jsx';

// Ensure React is available globally
if (typeof window !== 'undefined') {
  window.React = React;
  
  // Setup process.env for components that need it
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  window.process.env.NODE_ENV = 'development';
  window.process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';
}

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Core UI',
          'Features',
          'JetShare',
          'Components'
        ],
      },
    },
    // Improve accessibility checking
    a11y: {
      config: {
        rules: [
          {
            // You can disable specific rules for certain scenarios
          },
        ],
      },
    },
  },
  decorators: [
    withAuthProvider,
    withMockApiData,
    (Story) => (
      <div style={{ margin: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview; 
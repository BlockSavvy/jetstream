import '../app/globals.css';
import { withAuthProvider } from './decorators.jsx';
import { withReactDecorator, withRouter } from './decorator-fixes.jsx';
import React from 'react';
import * as NextImage from 'next/image';

// Add the RouterContext import
import { RouterContext } from 'next/dist/shared/lib/router-context.js';

// Fix for Next.js Image component
const OriginalNextImage = NextImage.default;

Object.defineProperty(NextImage, 'default', {
  configurable: true,
  value: (props) => <OriginalNextImage {...props} unoptimized />,
});

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
    nextRouter: {
      Provider: RouterContext.Provider,
      path: '/',
      asPath: '/',
      query: {},
      push() {},
    },
  },
  decorators: [
    withReactDecorator,
    withRouter,
    withAuthProvider,
    (Story) => (
      <div style={{ margin: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

// Add global React reference to window for components that expect it
if (typeof window !== 'undefined') {
  window.React = React;
  
  // Add process.env mock for components that use it
  window.process = {
    ...window.process,
    env: {
      NODE_ENV: 'development',
      NEXT_PUBLIC_SUPABASE_URL: 'mocked-url',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mocked-key',
    },
  };
}

export default preview; 
import type { Preview } from '@storybook/react'
import '../app/globals.css'
import { withAuthProvider } from './decorators.jsx'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    // Ensure actions are always visible in the actions panel
    actions: { argTypesRegex: '^on[A-Z].*' },
    // Improve accessibility checking
    a11y: {
      config: {
        rules: [
          {
            // You can disable specific rules for certain scenarios
            // Example: "color-contrast": { enabled: false }
          },
        ],
      },
    },
  },
  decorators: [
    withAuthProvider,
  ],
};

export default preview;
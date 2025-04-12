import '../app/globals.css';
import { withAuthProvider } from './decorators.jsx';

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
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
  ],
};

export default preview; 
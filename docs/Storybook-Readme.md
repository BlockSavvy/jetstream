# Jetstream UI Component Documentation

This documentation suite provides a comprehensive guide to all UI components used in the Jetstream application. The documentation is built using Storybook, a powerful tool for developing UI components in isolation.

## Getting Started

### Running Storybook Locally

To run Storybook locally, use the following command:

```bash
npm run storybook
```

This will start Storybook on port 6006. Open your browser and navigate to [http://localhost:6006](http://localhost:6006) to view the component library.

### Building Storybook

To create a static build of Storybook for deployment:

```bash
npm run build-storybook
```

The built files will be generated in the `storybook-static` directory.

## Documentation Structure

The documentation is organized by component type:

1. **UI Components** - Core UI elements like buttons, cards, and inputs
2. **Layout Components** - Components that handle page structure and arrangement
3. **Form Components** - Components specifically designed for form inputs and validation
4. **Navigation Components** - Navbars, menus, and other navigation elements
5. **Feedback Components** - Alerts, toasts, and other user feedback mechanisms

Each component documentation includes:

- A visual demonstration of all variants
- Interactive controls to modify props and see changes in real-time
- Code examples for implementation
- Accessibility guidelines and testing
- Usage notes and best practices

## Adding New Components to Storybook

Follow these steps to document a new component:

1. Create a `.stories.tsx` file in the appropriate directory under `/stories/components/`
2. Define the component metadata and stories
3. Add appropriate controls using `argTypes`
4. Include comprehensive documentation using JSDoc comments
5. Run Storybook to verify your documentation

Example structure:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from '@/components/your-component';

const meta = {
  title: 'Category/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls for each prop
  },
} satisfies Meta<typeof YourComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Define stories with different states and variants
export const Default: Story = {
  args: {
    // Default props
  },
};
```

## Component Guidelines

When creating or modifying components, follow these guidelines:

1. **Accessibility** - Ensure all components meet WCAG 2.1 AA standards
2. **Responsiveness** - Components should adapt to different screen sizes
3. **Theming** - Support light and dark mode themes
4. **Reusability** - Components should be flexible and reusable across different contexts
5. **Documentation** - Provide clear documentation of props, usage, and edge cases

## Testing Components

All components should include:

1. Basic rendering tests
2. Interaction tests for interactive components
3. Accessibility testing using the a11y addon

## Additional Resources

- [Storybook Official Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Component-Driven Development](https://www.componentdriven.org/)
- [Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/)

## Troubleshooting

If you encounter issues with Storybook:

1. Ensure all dependencies are installed (`npm install`)
2. Check for conflicts in `.storybook/main.ts` configuration
3. Verify that imports are correctly defined in your stories
4. Consult the error messages in the browser console or terminal

For additional help, please contact the development team. 
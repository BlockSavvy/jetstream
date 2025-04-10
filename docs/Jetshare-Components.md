# Jetshare Components Documentation Guide

## Overview

Jetshare is a mobile-first feature of the Jetstream platform that enables users to book and share private jet flights. This guide explains how to document Jetshare components in Storybook.

## Component Architecture

Jetshare components follow a mobile-first design philosophy and are organized into several key categories:

1. **Core UI Components** - Base components specific to Jetshare
2. **Form Components** - Specialized inputs for booking and scheduling
3. **Visualization Components** - Components that provide visual representations of jets and seating
4. **Payment Components** - Secure components for handling payments and transactions

## Creating Storybook Stories for Jetshare Components

### File Structure

Jetshare component stories should be placed in the `stories/components/jetshare` directory and follow this naming pattern:

- `ComponentName.stories.tsx` - For component stories
- `ComponentName.mdx` - For component documentation

### Story Organization

Each component story file should include:

1. **Import statements** - Import the component and any dependencies
2. **Sample data** - Create realistic test data to demonstrate the component
3. **Meta configuration** - Define the component's metadata and documentation
4. **Basic examples** - Show the component in its default state
5. **Variant examples** - Demonstrate different component configurations
6. **Interactive examples** - Show how the component behaves with user interaction

### Example Story Template

```tsx
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import YourComponent from '../../../app/jetshare/components/YourComponent';

// Sample data for stories
const sampleData = [
  // Your test data here
];

/**
 * Component description
 */
const meta = {
  title: 'Jetshare/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1A202C' }, // Jetshare uses a dark theme
        { name: 'light', value: '#F7FAFC' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls for your component props
  },
} satisfies Meta<typeof YourComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic example
export const Default: Story = {
  args: {
    // Default props
  },
};

// Variant examples
export const Variant1: Story = {
  args: {
    // Variant props
  },
};

// Interactive example
export const Interactive: Story = {
  render: (args) => {
    // Create a function component if you need state
    return (
      <YourComponent {...args} />
    );
  },
  args: {
    // Base props
  },
};
```

## Mobile Testing and Responsiveness

Since Jetshare is mobile-first, stories should validate that components work well at multiple screen sizes:

1. Use the Storybook viewport addon to test components at different screen sizes
2. Include responsive testing in your component stories
3. Document any mobile-specific behavior in the component's MDX documentation

## Accessibility Considerations

All Jetshare components should be accessible and stories should verify:

1. Proper contrast ratios against dark backgrounds
2. Touch target sizes are appropriate for mobile use
3. Components work with screen readers and assistive technologies

## Handling Complex Components

For complex components like JetSeatVisualizer or LocationAutocomplete:

1. Break down the component into logical sections in your documentation
2. Use multiple stories to showcase different aspects of functionality
3. Provide mock data that demonstrates realistic use cases
4. Document any initialization or integration requirements

## Mocking Backend Dependencies

Many Jetshare components interact with backend services. In Storybook:

1. Use mock data to simulate API responses
2. Document the expected data format
3. Show error states and loading states
4. For components that require authentication, document how to mock auth context

## Example Components

The following Jetshare components have already been documented and can serve as references:

1. **JetSeatVisualizer** - Demonstrates interactive seat selection
2. **LocationAutocomplete** - Shows search and autocomplete functionality

## Adding New Components

When adding a new Jetshare component to Storybook:

1. Create the story file in the appropriate directory
2. Add it to the Jetshare section in Storybook
3. Include appropriate tests and documentation
4. Update this guide if necessary to cover new patterns or requirements 
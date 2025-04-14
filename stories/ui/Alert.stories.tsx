import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

/**
 * Alert component for displaying important messages to users.
 * Can be used for notifications, errors, warnings, and success messages.
 */
const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
    className: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default alert with title and description
 */
export const Default: Story = {
  render: () => (
    <Alert className="w-[450px]">
      <AlertTitle>Default Alert</AlertTitle>
      <AlertDescription>
        This is a default alert with standard styling.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * Destructive alert for errors or important warnings
 */
export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-[450px]">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        An error has occurred. Please try again later.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * Alert with icon
 */
export const WithIcon: Story = {
  render: () => (
    <Alert className="w-[450px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>
        This alert includes an information icon for enhanced visual cues.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * Alert with custom styling
 */
export const CustomStyling: Story = {
  render: () => (
    <Alert className="w-[450px] border-blue-500 bg-blue-50 text-blue-700">
      <AlertTitle className="text-blue-800">Custom Alert</AlertTitle>
      <AlertDescription className="text-blue-600">
        This alert uses custom colors and styling to match specific design requirements.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * Alert with longer content
 */
export const LongContent: Story = {
  render: () => (
    <Alert className="w-[450px]">
      <AlertTitle>Long Content Alert</AlertTitle>
      <AlertDescription>
        This alert contains a longer description to demonstrate how the component
        handles multi-line content. The alert should expand vertically to accommodate
        the content while maintaining proper padding and spacing. This ensures that
        all text remains readable and the alert maintains its visual integrity.
      </AlertDescription>
    </Alert>
  ),
}; 
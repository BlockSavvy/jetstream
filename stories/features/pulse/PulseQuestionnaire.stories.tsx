import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PulseQuestionnaire from '../../../app/pulse/components/PulseQuestionnaire';

/**
 * The PulseQuestionnaire component is a multi-step form that collects user preferences
 * for travel interests, social preferences, destinations, and more. It's a key part of the
 * Pulse AI matching system that helps tailor recommendations to user preferences.
 */
const meta = {
  title: 'Features/Pulse AI/PulseQuestionnaire',
  component: PulseQuestionnaire,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#121212' },
        { name: 'light', value: '#F7FAFC' },
      ],
    },
    // This component needs authentication context
    docs: {
      description: {
        component: 'This component requires AuthProvider context in production. For Storybook display, the authentication is mocked.'
      }
    }
  },
  tags: ['autodocs'],
  // This component may not work perfectly in isolation due to auth dependencies
  decorators: [
    (Story) => (
      // Adding a mock wrapper to simulate authentication context
      <div style={{ width: '800px', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PulseQuestionnaire>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view of the questionnaire
 */
export const Default: Story = {
  args: {},
};

/**
 * Note: Due to the multi-step nature of this component and its integration with authentication
 * and API services, the full interactive experience would require additional mocking that
 * goes beyond the typical Storybook setup. This story provides a visual reference for the
 * component's appearance, but interactions may not fully function as they would in the app.
 * 
 * To explore the full functionality, please run the application with appropriate authentication.
 */ 
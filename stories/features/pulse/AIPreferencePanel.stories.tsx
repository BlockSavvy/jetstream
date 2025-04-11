import { Meta, StoryObj } from '@storybook/react';
import { AIPreferencePanel } from '../../../stories/mocks/pulse/AIPreferencePanel';
import React, { useEffect } from 'react';

/**
 * Custom wrapper to simulate preferences data since the component doesn't 
 * accept initial preferences directly
 */
const AIPreferencePanelWrapper = (props: any) => {
  // In a real implementation, this would set the preferences via context or API
  // but for storybook purposes, we're just displaying the component
  return <AIPreferencePanel {...props} />;
};

const meta: Meta<typeof AIPreferencePanel> = {
  title: 'Features/Pulse/AIPreferencePanel',
  component: AIPreferencePanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# AI Preference Panel Component

The AI Preference Panel allows users to set their travel preferences for the Pulse AI matching system. This component serves as the input mechanism for configuring personalized flight recommendations.

## Key Features:
- **Trip Preference Sliders:** Interactive sliders for setting relative importance of price, comfort, and speed
- **Personal Preference Toggles:** Switches for enabling/disabling preferences like entertainment, workspace, and sleep amenities
- **Real-time Updates:** Changes in preferences immediately affect the match results display
- **Persistent User Settings:** Ability to save preferences to user profiles

## Integration with Pulse AI:
This component works with the AIMatchResults component to form a complete recommendation system:
1. Users configure their preferences using this panel
2. The Pulse AI processes these preferences
3. The AIMatchResults component displays matching flights

## Technical Implementation:
- Built with styled-components for consistent theming
- Uses React hooks for efficient state management
- Designed for accessibility with keyboard navigation support
- Responsive design that adapts to different screen sizes

## Usage Notes:
The component loads preferences based on the userId provided, or falls back to default preferences.
Changes to preferences are reported via the onPreferenceChange callback.
        `
      }
    },
    tags: ['autodocs'],
  },
  argTypes: {
    userId: { 
      control: 'text',
      description: 'Optional user ID for loading saved preferences' 
    },
    onPreferenceChange: { 
      action: 'preference changed',
      description: 'Callback triggered when preferences are updated' 
    },
    className: {
      control: 'text',
      description: 'Optional CSS class name for styling the component'
    }
  }
};

export default meta;
type Story = StoryObj<typeof AIPreferencePanel>;

// Default story
export const Default: Story = {
  args: {
    userId: 'default-user'
  }
};

// Comfort-focused preferences example
export const ComfortFocused: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Example of a user with comfort-focused preferences. In a real implementation, these preferences would be loaded from the user profile.'
      }
    }
  },
  args: {
    userId: 'comfort-user'
  }
};

// Budget-focused preferences example
export const BudgetFocused: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Example of a user with budget-focused preferences. In a real implementation, these preferences would be loaded from the user profile.'
      }
    }
  },
  args: {
    userId: 'budget-user'
  }
};

// With callback handling
export const WithCallbackHandling: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Example showing how to handle preference change callbacks.'
      }
    }
  },
  args: {
    userId: 'callback-user',
    onPreferenceChange: (preferences) => {
      console.log('Preferences updated:', preferences);
    }
  }
};

// Mobile view
export const MobileView: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile view of the AI Preference Panel component.'
      }
    }
  },
  args: {
    userId: 'mobile-user'
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}; 
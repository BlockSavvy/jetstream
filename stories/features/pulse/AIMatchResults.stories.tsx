import { Meta, StoryObj } from '@storybook/react';
import { AIMatchResults } from '../../../stories/mocks/pulse/AIMatchResults';

const meta: Meta<typeof AIMatchResults> = {
  title: 'Features/Pulse/AIMatchResults',
  component: AIMatchResults,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# AI Match Results Component

The AI Match Results component displays personalized flight options based on user preferences. It serves as a visual output for the Pulse AI matching system.

## Key Features:
- **Dynamic Flight Cards:** Displays flight options with color-coded match scores based on user's preferences.
- **Visual Match Indicators:** Color-coded indicators show how well each flight matches the user's preferences.
- **Flight Details Display:** Includes essential information like departure/arrival locations, times, aircraft type, amenities, and pricing.
- **Loading & Empty States:** Proper handling of loading and empty states for better user experience.

## Integration with Pulse AI:
This component works in tandem with the AIPreferencePanel component to create a complete AI flight recommendation system:
1. Users set their preferences using the AIPreferencePanel
2. The Pulse AI system processes these preferences
3. The AIMatchResults component displays personalized flight recommendations

## Technical Implementation:
- Designed with Tailwind CSS for a clean, maintainable UI
- Fully responsive design that works across devices
- Efficient state management with React hooks
- Mock data generation for demonstration purposes
- Simulated API integration for real-world application
        `
      }
    },
    tags: ['autodocs'],
  },
  argTypes: {
    userId: { 
      control: 'text',
      description: 'Optional user ID for personalized recommendations' 
    },
    preferences: { 
      control: 'object',
      description: 'User preferences object that affects match scoring' 
    },
    loading: { 
      control: 'boolean',
      description: 'Forces the component into a loading state' 
    }
  }
};

export default meta;
type Story = StoryObj<typeof AIMatchResults>;

// Mock preference data
const defaultPreferences = {
  tripPreferences: [
    { id: 'price', enabled: true, value: 70 },
    { id: 'comfort', enabled: true, value: 50 },
    { id: 'speed', enabled: true, value: 30 }
  ],
  personalPreferences: [
    { id: 'entertainment', enabled: true },
    { id: 'workspace', enabled: true },
    { id: 'sleep', enabled: false }
  ]
};

// Higher comfort preferences
const comfortPreferences = {
  tripPreferences: [
    { id: 'price', enabled: true, value: 30 },
    { id: 'comfort', enabled: true, value: 90 },
    { id: 'speed', enabled: true, value: 40 }
  ],
  personalPreferences: [
    { id: 'entertainment', enabled: true },
    { id: 'workspace', enabled: true },
    { id: 'sleep', enabled: true }
  ]
};

// Budget-focused preferences
const budgetPreferences = {
  tripPreferences: [
    { id: 'price', enabled: true, value: 95 },
    { id: 'comfort', enabled: true, value: 20 },
    { id: 'speed', enabled: true, value: 50 }
  ],
  personalPreferences: [
    { id: 'entertainment', enabled: false },
    { id: 'workspace', enabled: true },
    { id: 'sleep', enabled: false }
  ]
};

// Default story
export const Default: Story = {
  args: {
    preferences: defaultPreferences
  }
};

// Loading state story
export const Loading: Story = {
  args: {
    loading: true
  }
};

// Empty results story
export const EmptyResults: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Empty state shown when no flights match the user preferences.'
      }
    }
  },
  args: {
    // Empty preferences would result in no matches in a real implementation
    preferences: { tripPreferences: [], personalPreferences: [] }
  }
};

// Comfort-focused preferences
export const ComfortFocused: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Shows results when user prioritizes comfort over price.'
      }
    }
  },
  args: {
    preferences: comfortPreferences,
    userId: 'comfort-user'
  }
};

// Budget-focused preferences
export const BudgetFocused: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Shows results when user prioritizes low prices over comfort.'
      }
    }
  },
  args: {
    preferences: budgetPreferences,
    userId: 'budget-user'
  }
};

// Mobile view with custom container width
export const MobileView: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile view of the AI Match Results component.'
      }
    }
  },
  args: {
    preferences: defaultPreferences
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
}; 
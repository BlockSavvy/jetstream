import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PulseQuestionnaire from '@/app/pulse/components/PulseQuestionnaire';

// Create a mock AuthProvider wrapper for the component
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Mock user and authentication context
  const mockAuthContext = {
    user: {
      id: 'mock-user-123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'user'
    },
    loading: false,
    error: null,
    login: async () => {},
    logout: async () => {},
    signup: async () => {},
    resetPassword: async () => {}
  };

  // Mock the useAuth hook that the component will call
  React.useEffect(() => {
    // @ts-ignore - Mocking global hook
    window.useAuth = () => mockAuthContext;
    
    return () => {
      // @ts-ignore - Cleanup
      delete window.useAuth;
    };
  }, []);

  // Mock the useUserProfile hook
  React.useEffect(() => {
    const mockProfile = {
      travel_preferences: {
        travel_interests: ["Business", "Tech", "Luxury"],
        social_preferences: ["Networking", "Professional"],
        preferred_destinations: ["Miami", "New York", "London"],
        urgency_preferences: ["Advanced"],
        crew_specializations: ["Business Networking", "Live Podcasts"],
        captain_specializations: ["Business", "Luxury"],
        professional_preference: "Both",
        prefer_dedicated_captain: true
      }
    };
    
    // @ts-ignore - Mocking global hook
    window.useUserProfile = () => ({
      profile: mockProfile,
      loading: false,
      error: null,
      updateProfile: async () => mockProfile
    });
    
    return () => {
      // @ts-ignore - Cleanup
      delete window.useUserProfile;
    };
  }, []);
  
  return <>{children}</>;
};

/**
 * The PulseQuestionnaire component is a multi-step form that collects user preferences
 * for travel interests, social preferences, destinations, and more. It's a key part of the
 * Pulse AI matching system that helps tailor recommendations to user preferences.
 */
const meta = {
  title: 'Features/Pulse/PulseQuestionnaire',
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#121212' },
        { name: 'light', value: '#F7FAFC' },
      ],
    },
    docs: {
      description: {
        component: `
# Pulse Questionnaire Component

The Pulse Questionnaire is a multi-step form that collects user preferences to power the AI matching system. These preferences are used to generate personalized flight recommendations.

## Key Features:
- **Multi-step Form**: Progressive disclosure of questions to improve user experience
- **Preference Collection**: Gathers data on travel interests, social preferences, and destinations
- **Professional Preferences**: Captures preferences for crew and captain specializations
- **Integrated Matching**: Feeds directly into the Pulse AI matching algorithm
- **Progress Tracking**: Visual indication of questionnaire progress
- **Responsive Design**: Adapts to various screen sizes for mobile and desktop use

## Integration with Pulse AI:
This questionnaire is the primary data source for the Pulse AI system, allowing it to:
1. Build a user preference profile
2. Match against available flights and experiences
3. Calculate compatibility scores for recommendations
4. Identify travel patterns and preferences

## Technical Implementation:
- Built with a step-by-step wizard interface using Framer Motion animations
- Stores preferences in user profiles for persistent personalization
- Features real-time validation and feedback
- Supports both authenticated and guest user experiences
`
      }
    }
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: '800px', maxWidth: '100%' }}>
        <MockAuthProvider>
          <Story />
        </MockAuthProvider>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

// Default view of the questionnaire
export const Default: Story = {
  render: () => <PulseQuestionnaire />,
  parameters: {
    docs: {
      description: {
        story: 'The default state of the PulseQuestionnaire showing the first step of the preference collection process.'
      }
    }
  }
};

// Note: Due to the complexity of this component with authentication dependencies,
// interactions in Storybook may be limited. The component is best experienced
// in the full application environment. 
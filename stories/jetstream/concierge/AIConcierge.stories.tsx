import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AIConcierge from '@/app/components/voice/AIConcierge';

/**
 * The AIConcierge component is the central AI-powered conversational interface for the Jetstream platform.
 * It provides context-aware assistance across different areas of the application, including JetShare,
 * admin functions, and general Jetstream services.
 */
const meta: Meta<typeof AIConcierge> = {
  title: 'Features/Concierge/AIConcierge',
  component: AIConcierge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# AI Concierge Component

The AI Concierge is an advanced conversational interface that provides personalized travel assistance to Jetstream users. It serves as a virtual travel assistant capable of answering questions, making recommendations, and helping users complete tasks through natural language.

## Key Features:
- **Contextual Awareness:** Understands user history, preferences, and current booking state
- **Multi-turn Conversations:** Maintains context across multiple interactions
- **Task Completion:** Can perform actions like searching flights, providing information, and making suggestions
- **Personalization:** Adapts responses based on user profile and preferences
- **Rich Response Types:** Supports text, structured data, visual components, and actions

## Technical Implementation:
- Built with a streaming response architecture for real-time interaction
- Uses advanced LLM technology with a travel-specific knowledge base
- Features conversation history management with session persistence
- Integrates with Jetstream booking, membership, and flight systems
- Includes typing indicators, error states, and fallback handlers

## Usage Notes:
The AIConcierge component is self-contained and manages its own state internally. It automatically detects the current application context (JetShare, admin, JetStream) and adapts its behavior accordingly.
        `
      }
    },
    tags: ['autodocs'],
  },
  // Note: AIConcierge doesn't accept external props as it manages its state internally
  argTypes: {}
};

export default meta;
type Story = StoryObj<typeof AIConcierge>;

// Default story - shows the AI Concierge in its default state
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The default AI Concierge interface as it appears to users. The component automatically detects the current application context and adapts accordingly.'
      }
    }
  }
};

// Mobile view - shows how the component appears on mobile devices
export const MobileView: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile view of the AI Concierge component, with adaptive layout for smaller screens.'
      }
    }
  }
};

// For demonstration purposes only - these states would normally be managed internally by the component
// These variants help demonstrate what different states of the component might look like
export const ConversationExample: Story = {
  parameters: {
    docs: {
      description: {
        story: `
This example illustrates what the Concierge looks like during an active conversation. In the actual application, the conversation is managed by the component's internal state.

Example conversation:
- User: "I need to fly from New York to Los Angeles next Tuesday."
- Concierge: "I'd be happy to help you find a flight from New York to Los Angeles next Tuesday. Could you please specify your preferred departure time and how many passengers will be traveling?"
        `
      }
    }
  }
};

// Loading state example
export const LoadingExample: Story = {
  parameters: {
    docs: {
      description: {
        story: `
This example illustrates what the Concierge looks like when processing a request. The loading state is managed internally by the component.

Example scenario:
- User asks: "What's the best time to fly to Miami to avoid traffic?"
- Concierge shows a loading indicator while processing the request
        `
      }
    }
  }
}; 
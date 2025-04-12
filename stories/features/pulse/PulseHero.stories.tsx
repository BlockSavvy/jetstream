import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PulseHero from '../../../app/pulse/components/PulseHero';

/**
 * The PulseHero component serves as the main hero section for the Pulse AI feature.
 * It introduces users to the Pulse AI flight recommendation system with a visually
 * appealing background and a call-to-action to start using the service.
 */
const meta: Meta<typeof PulseHero> = {
  title: 'Features/Pulse/PulseHero',
  component: PulseHero,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Pulse Hero Component

This component serves as the striking hero section for the Pulse AI feature, designed to create an impactful first impression and drive user engagement with the flight recommendation system.

## Key Features:
- **Visual Impact**: Large hero image with luxury private jet visuals
- **Gradient Text**: Premium feel with gradient text styling
- **CTA Button**: Clear call-to-action to guide users to the questionnaire
- **Responsive Design**: Fully responsive across all device sizes
- **Animation**: Subtle motion effects to enhance user experience

## User Interaction:
The component features a prominent "Find Your Pulse" button that smoothly scrolls users to the Pulse questionnaire section, beginning their journey with the recommendation engine.

## Technical Implementation:
- Built with Framer Motion for smooth animations
- Uses Next.js Image component for optimized image loading
- Implements responsive typography and spacing
- Features subtle background effects for visual depth
`
      }
    }
  },
};

export default meta;
type Story = StoryObj<typeof PulseHero>;

// Default story
export const Default: Story = {
  render: () => <PulseHero />,
  parameters: {
    docs: {
      description: {
        story: 'The default state of the PulseHero component showcasing the hero section with background image, text, and call-to-action button.'
      }
    }
  }
}; 
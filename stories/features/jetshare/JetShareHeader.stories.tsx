import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetShareHeader from '../../../app/jetshare/components/JetShareHeader';

/**
 * The JetShareHeader component serves as the main navigation header
 * for the JetShare mobile app, providing access to all major sections
 * and features of the application.
 */

// Create a wrapper with mocked Next.js and authentication
const JetShareHeaderWithMocks = ({ authenticated = false, path = '/jetshare' }) => {
  // Mock the usePathname hook
  React.useEffect(() => {
    // Mock Next.js hooks
    jest.mock('next/navigation', () => ({
      usePathname: () => path,
      useRouter: () => ({
        push: (url: string) => console.log(`Navigation to: ${url}`),
      }),
    }));
    
    // Mock Auth provider
    jest.mock('@/components/auth-provider', () => ({
      useAuth: () => ({
        user: authenticated ? { id: 'test-user-id', email: 'test@example.com' } : null,
        loading: false,
        signOut: () => Promise.resolve(),
      }),
    }));
    
    return () => {
      jest.resetAllMocks();
    };
  }, [authenticated, path]);
  
  return <JetShareHeader />;
};

// Wrapper for the mobile menu open state
const JetShareHeaderMobileMenu = () => {
  // Override the useState hook to force the mobile menu to be open
  React.useEffect(() => {
    // Save original useState
    const originalUseState = React.useState;
    
    // Mock useState to always return true for the mobile menu state
    // @ts-ignore - We're deliberately mocking the React.useState function
    React.useState = function mockedUseState(initialState: any) {
      if (initialState === false) {
        return [true, () => {}];
      }
      return originalUseState(initialState);
    };
    
    return () => {
      React.useState = originalUseState;
    };
  }, []);
  
  return <JetShareHeader />;
};

const meta: Meta<typeof JetShareHeader> = {
  title: 'Features/JetShare/JetShareHeader',
  component: JetShareHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# JetShare Header Component

This component serves as the primary navigation element for the JetShare mobile application, enabling users to navigate between different sections and manage their authentication state.

## Key Features:
- **Responsive Design**: Adapts between desktop and mobile layouts
- **Dynamic Navigation**: Shows different options based on authentication state
- **Mobile-First UI**: Optimized for mobile devices with a collapsible menu
- **Authentication Integration**: Displays sign-in/sign-out options based on user state
- **Active State Indication**: Highlights the current section

## User Experience:
The header is designed to provide intuitive navigation while maintaining a clean, unobtrusive interface. It features:
- Clear visual hierarchy with prominent branding
- Consistent placement of navigation items
- Smooth transitions between states
- Appropriate visual feedback for interactions
- Easy access to authentication actions

## Technical Implementation:
- Integrates with Next.js routing for navigation
- Connects to authentication provider for user state
- Uses local storage as fallback for auth state
- Implements responsive design principles
- Features smooth animations for mobile menu
`
      }
    }
  },
};

export default meta;
type Story = StoryObj<typeof JetShareHeader>;

// Default story (unauthenticated)
export const Default: Story = {
  render: () => <JetShareHeaderWithMocks authenticated={false} path="/jetshare" />,
  parameters: {
    docs: {
      description: {
        story: 'The default unauthenticated state of the JetShareHeader component showing navigation options available to all users.'
      }
    }
  }
};

// Authenticated user story
export const Authenticated: Story = {
  render: () => <JetShareHeaderWithMocks authenticated={true} path="/jetshare" />,
  parameters: {
    docs: {
      description: {
        story: 'The authenticated state of the JetShareHeader component showing additional navigation options available to signed-in users.'
      }
    }
  }
};

// Mobile menu open story
export const MobileMenu: Story = {
  render: () => <JetShareHeaderMobileMenu />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'The mobile view of the JetShareHeader component with the menu expanded, showing all navigation options in a stacked layout.'
      }
    }
  }
}; 
import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import JetSelector from '@/app/jetshare/components/JetSelector';
import { action } from '@storybook/addon-actions';

/**
 * The JetSelector component is a sophisticated dropdown control that allows users to select
 * from available aircraft models. It provides rich visual information about each jet,
 * including capacity, range, and thumbnail images, to help users make informed decisions.
 * 
 * This component is critical for the jet sharing platform, as it enables users to specify
 * which aircraft they want to book or share with others.
 */
const meta = {
  title: 'Jetshare/JetSelector',
  component: JetSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Jet Selector

## Overview
The JetSelector is a specialized dropdown component for the Jetstream platform that allows users to search and select from available aircraft models. It provides rich visual feedback about each jet option including thumbnail images, seat capacity, and range information.

## Primary Function
This component serves as the primary aircraft selection method throughout the platform, appearing in:
- Flight booking forms
- JetShare listing creation
- Charter flight requests
- Search filters

## Key Features
- **Visual Selection**: Thumbnail previews of available aircraft
- **Filtration Options**: Filter jets by manufacturer, capacity, and more
- **Search Capability**: Text search for quick model location
- **Custom Input**: Support for custom aircraft specifications
- **Rich Information**: Shows seat capacity, range, and other specifications
- **Responsive Design**: Adapts to different viewport sizes
- **API Integration**: Dynamically loads available aircraft from backend services

## Usage Patterns
This component is typically used in multi-step forms where aircraft selection is a key decision point. The selected aircraft then influences subsequent options like seat selection, route planning, and pricing calculations.

## Accessibility Considerations
- Full keyboard navigation support
- ARIA attributes for screen reader compatibility
- Visible focus states
- Color contrast compliance
- Fallback text for images
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'The currently selected aircraft model',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '' },
        category: 'Selection State'
      }
    },
    disabled: {
      control: 'boolean',
      description: 'When true, prevents user interaction with the selector',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Interaction Controls'
      }
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names to apply to the component wrapper',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Styling'
      }
    },
    id: {
      control: 'text',
      description: 'HTML ID attribute for the component',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'DOM Attributes'
      }
    },
    onChangeValue: {
      description: 'Serializable value for SSR compatibility; used with onChangeSeatCapacity',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Callbacks'
      }
    },
    onChangeSeatCapacity: {
      description: 'Serializable seat capacity value for SSR compatibility',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 'undefined' },
        category: 'Callbacks'
      }
    },
    onCustomChangeValue: {
      description: 'Serializable value for custom aircraft input for SSR compatibility',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
        category: 'Callbacks'
      }
    },
    onBlur: {
      action: 'blurred',
      description: 'Callback function triggered when the component loses focus',
      table: {
        type: { summary: '() => void' },
        defaultValue: { summary: 'undefined' },
        category: 'Callbacks'
      }
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text displayed when no selection is made',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"Select aircraft model"' },
        category: 'Display Options'
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="p-6 bg-gray-900 max-w-[500px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof JetSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view of the JetSelector with standard configuration.
 * 
 * This example demonstrates the component with no initial selection,
 * showing the placeholder text and ready for user interaction.
 */
export const Default: Story = {
  args: {
    value: '',
    disabled: false,
    placeholder: 'Select aircraft model',
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic implementation of the JetSelector with default settings. The component displays a placeholder and is ready for user interaction.'
      }
    }
  }
};

/**
 * The JetSelector in a disabled state, preventing user interaction.
 * 
 * This example shows how the component appears when the disabled
 * property is set to true, typically used when the form is processing
 * or when the selection should be view-only.
 */
export const Disabled: Story = {
  args: {
    value: '',
    disabled: true,
    placeholder: 'Aircraft selection unavailable',
  },
  parameters: {
    docs: {
      description: {
        story: 'The disabled state prevents user interaction with the component, useful for read-only views or during form processing.'
      }
    }
  }
};

/**
 * JetSelector with a pre-selected value.
 * 
 * This example demonstrates how the component displays when an aircraft
 * is already selected, showing the model name and additional information.
 */
export const WithSelection: Story = {
  args: {
    value: 'Gulfstream G650'
  },
  render: () => {
    // Mock the selection event to display the component correctly
    React.useEffect(() => {
      // Mock fetch replacement for the API
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getJets')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              jets: [
                { 
                  id: 'gulfstream-g650', 
                  manufacturer: 'Gulfstream', 
                  model: 'G650', 
                  tail_number: 'N1JS',
                  capacity: 19,
                  range_nm: 7000,
                  cruise_speed_kts: 516,
                  is_popular: true,
                  year: 2022
                }
              ]
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Create a custom event to trigger the selection display
      setTimeout(() => {
        const jetChangeEvent = new CustomEvent('jetchange', {
          detail: {
            value: 'Gulfstream G650',
            jetId: 'gulfstream-g650',
            seatCapacity: 19,
            range: 7000,
            image_url: '/images/jets/gulfstream/g650.jpg'
          }
        });
        window.dispatchEvent(jetChangeEvent);
      }, 500);
      
      // Cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return (
      <JetSelector
        value="Gulfstream G650"
        disabled={false}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the JetSelector with a pre-selected aircraft, showing the visual representation of the selected model with its capacity and range information.'
      }
    }
  }
};

/**
 * Interactive JetSelector demonstrating the selection workflow.
 * 
 * This example showcases a fully interactive instance where users can
 * open the dropdown, search, filter, and select aircraft models.
 */
export const Interactive: Story = {
  args: {
    value: ''
  },
  render: () => {
    const [value, setValue] = useState('');
    
    // Set up mock API response
    React.useEffect(() => {
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getJets')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              jets: [
                { 
                  id: 'gulfstream-g650', 
                  manufacturer: 'Gulfstream', 
                  model: 'G650', 
                  tail_number: 'N1JS',
                  capacity: 19,
                  range_nm: 7000,
                  cruise_speed_kts: 516,
                  is_popular: true,
                  year: 2022
                },
                { 
                  id: 'bombardier-global-7500', 
                  manufacturer: 'Bombardier', 
                  model: 'Global 7500', 
                  tail_number: 'N2JS',
                  capacity: 19,
                  range_nm: 7700,
                  cruise_speed_kts: 516,
                  is_popular: true,
                  year: 2021
                },
                { 
                  id: 'embraer-phenom-300e', 
                  manufacturer: 'Embraer', 
                  model: 'Phenom 300E', 
                  tail_number: 'N3JS',
                  capacity: 10,
                  range_nm: 2010,
                  cruise_speed_kts: 453,
                  is_popular: true,
                  year: 2023
                },
                { 
                  id: 'cessna-citation-longitude', 
                  manufacturer: 'Cessna', 
                  model: 'Citation Longitude', 
                  tail_number: 'N4JS',
                  capacity: 12,
                  range_nm: 3500,
                  cruise_speed_kts: 476,
                  year: 2020
                },
                { 
                  id: 'dassault-falcon-8x', 
                  manufacturer: 'Dassault', 
                  model: 'Falcon 8X', 
                  tail_number: 'N5JS',
                  capacity: 16,
                  range_nm: 6450,
                  cruise_speed_kts: 425,
                  year: 2022
                }
              ]
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Add event listener for selection changes
      const handleJetChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        setValue(customEvent.detail.value);
        action('jet-selected')(customEvent.detail);
      };
      
      window.addEventListener('jetchange', handleJetChange);
      
      // Cleanup
      return () => {
        window.fetch = originalFetch;
        window.removeEventListener('jetchange', handleJetChange);
      };
    }, []);
    
    return (
      <div className="space-y-6">
        <JetSelector
          value={value}
          disabled={false}
          placeholder="Select from premium jets"
        />
        
        {value && (
          <div className="mt-4 p-3 bg-blue-900/30 rounded-md text-white text-sm">
            <strong>Selected:</strong> {value}
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive example with a mock API that loads several aircraft options. Users can open the dropdown, search for models, filter by seat capacity, and make a selection.'
      }
    }
  }
};

/**
 * JetSelector with a "Custom" aircraft option selected, showing the additional input field.
 * 
 * This example demonstrates how the component looks when a custom aircraft option is
 * selected, displaying the additional input field for the user to specify their aircraft.
 */
export const WithCustomInput: Story = {
  args: {
    value: 'Other Custom'
  },
  render: () => {
    React.useEffect(() => {
      // Mock fetch replacement
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getJets')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              jets: [
                { 
                  id: 'other-custom', 
                  manufacturer: 'Other', 
                  model: 'Custom', 
                  capacity: 8,
                  range_nm: 3000
                }
              ]
            })
          } as Response);
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return (
      <JetSelector
        value="Other Custom"
        disabled={false}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the JetSelector with the "Custom" aircraft option selected, which displays an additional input field for entering a custom aircraft model that might not be in the standard inventory.'
      }
    }
  }
};

/**
 * JetSelector demonstrating a loading state while fetching aircraft data.
 * 
 * This example shows how the component displays during the API loading phase,
 * typically when first mounted and waiting for aircraft data to be fetched.
 */
export const Loading: Story = {
  args: {
    value: ''
  },
  render: () => {
    React.useEffect(() => {
      // Mock a slow-loading API response
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getJets')) {
          // Return a promise that never resolves to maintain loading state
          return new Promise(() => {});
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return (
      <JetSelector
        value=""
        disabled={false}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the JetSelector in its loading state, showing a skeleton loading indicator while aircraft data is being fetched from the API.'
      }
    }
  }
};

/**
 * JetSelector demonstrating error handling when API calls fail.
 * 
 * This example shows how the component behaves when aircraft data cannot be
 * retrieved, falling back to a set of default aircraft options.
 */
export const WithApiError: Story = {
  args: {
    value: ''
  },
  render: () => {
    React.useEffect(() => {
      // Mock a failing API
      const originalFetch = window.fetch;
      
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (url.includes('/api/jetshare/getJets')) {
          return Promise.reject(new Error('API Error: Failed to fetch jet data'));
        }
        
        return originalFetch(input, init);
      }) as typeof window.fetch;
      
      // Cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }, []);
    
    return (
      <JetSelector
        value=""
        disabled={false}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how the JetSelector handles API errors by displaying fallback jet options and an error message, ensuring users can still make selections even when network issues occur.'
      }
    }
  }
}; 
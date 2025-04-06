# JetSeatVisualizer Component Documentation

The `JetSeatVisualizer` component provides an interactive way for users to visualize and configure seat splits for jet sharing offers. This component allows users to specify which seats they want to share by creating either a horizontal (front/back) or vertical (left/right) split.

## Features

- **Dynamic Seat Layout**: Renders a seat grid based on the selected jet model
- **Interactive Split Adjustment**: Draggable crosshair interface for intuitive split configuration
- **Real-time Feedback**: Visual highlighting of which seats belong to each section
- **Embedding-Ready Data**: Outputs structured JSON for AI and embedding systems
- **Touch-Enabled**: Designed for both desktop and mobile interactions
- **AI Concierge Integration**: Exposes methods for programmatic control through the AI Concierge

## Basic Usage

```tsx
import JetSeatVisualizer, { SplitConfiguration } from './JetSeatVisualizer';

function MyComponent() {
  // Handle configuration changes
  const handleSplitConfigurationChange = (config: SplitConfiguration) => {
    console.log('New configuration:', config);
    // Save to form state or send to API
  };

  return (
    <JetSeatVisualizer 
      jetId="gulfstream-g650"
      onChange={handleSplitConfigurationChange}
    />
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `jetId` | string | Identifier for the jet model to visualize |
| `defaultLayout` | SeatLayout (optional) | Default seat layout if jet data can't be fetched |
| `onChange` | function (optional) | Callback when configuration changes |
| `initialSplit` | SplitConfiguration (optional) | Initial split configuration |
| `readOnly` | boolean (optional) | Whether the visualizer is interactive or just for display |
| `className` | string (optional) | Additional CSS classes |

## Using with the AI Concierge

The JetSeatVisualizer component is designed to be programmatically controlled by the AI Concierge system using refs. This allows the Concierge to open the visualizer during a conversation when a user needs to configure seat splits.

### Invoking from the Concierge

```tsx
import { useRef } from 'react';
import JetSeatVisualizer, { JetSeatVisualizerRef } from './JetSeatVisualizer';

function ConciergeChat() {
  // Create a ref to access visualizer methods
  const visualizerRef = useRef<JetSeatVisualizerRef>(null);
  
  // Function to be called from the AI Concierge
  const handleConciergeRequest = (action: string) => {
    if (action === 'open-seat-visualizer') {
      visualizerRef.current?.openVisualizer();
    } else if (action === 'close-seat-visualizer') {
      visualizerRef.current?.closeVisualizer();
    }
  };
  
  return (
    <div>
      {/* Chat interface */}
      <div className="chat-container">
        {/* Chat messages */}
      </div>
      
      {/* Seat visualizer (hidden by default) */}
      <JetSeatVisualizer 
        ref={visualizerRef}
        jetId="gulfstream-g650"
        onChange={(config) => {
          // When user configures seats, AI can respond to the configuration
          sendMessageToAI({
            type: 'seat-configuration',
            data: config
          });
        }}
      />
    </div>
  );
}
```

### AI Concierge Prompting

When integrating with the AI Concierge, use these prompt examples to help the AI understand and describe seat configurations:

**For describing configurations:**

```
The jet has a {splitOrientation} split with a {splitRatio} ratio. 
This means there are {front.length} seats in the front section and {back.length} seats in the back section.
```

**For suggesting the visualizer:**

```
I can help you visualize this better. Would you like me to open the seat configuration tool so you can see exactly how the seats are arranged?
```

## Data Structure

The seat configuration is stored in a JSON-friendly format that's compatible with vector embeddings:

```json
{
  "jetId": "gulfstream-g650",
  "splitOrientation": "horizontal",
  "splitRatio": "50/50",
  "allocatedSeats": {
    "front": ["A1", "A2", "B1", "B2"],
    "back": ["C1", "C2", "D1", "D2"]
  }
}
```

This structure enables several powerful features:

- AI Concierge can describe the configuration conversationally
- Configuration can be embedded and used for intelligent matching
- Users can understand exactly which seats they're sharing

## Error Handling

The component handles various error states gracefully:

- If jet data cannot be fetched, it will use default values
- If layout information is incomplete, it provides reasonable fallbacks
- The component displays appropriate error messages when needed

## Best Practices

1. **Default to horizontal splits** for typical front/back cabin sharing scenarios
2. **Use clear visual feedback** to show which seats are in which section
3. **Persist the configuration** with the offer for consistent display
4. **Allow the AI Concierge** to describe configurations conversationally

## Future Enhancements

- Support for custom seat layouts beyond the standard grid
- Enhanced visualization of luxury jet configurations
- Mobile gesture optimizations for drag interactions
- Direct integration with specific jet model specifications

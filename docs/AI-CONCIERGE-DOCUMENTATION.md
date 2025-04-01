# JetShare AI Concierge Documentation

## Overview

The JetShare AI Concierge is a conversational assistant integrated into the JetShare application. It leverages AI models to provide an intelligent, context-aware interface for users to interact with the platform. The concierge helps users create and find flight sharing offers, schedule notifications, book amenities, and arrange transportation.

Two implementation options are available:

- **OpenAI GPT-4 Turbo**: High-quality model with advanced function calling capabilities
- **xAI Grok-3**: Alternative model with similar capabilities

## Key Features

### 1. Function Calling

The concierge utilizes function calling capabilities to execute structured actions:

- **CreateJetShareOffer**: Create a new offer to share seats on a private jet
- **FindJetShareOffer**: Search for available offers matching criteria
- **ScheduleNotification**: Set up notifications or reminders
- **BookAmenities**: Book catering, entertainment, and other amenities for flights
- **ScheduleTransportation**: Arrange ground transportation

### 2. Multimodal Interaction

The concierge supports multiple interaction modes:

- **Text**: Traditional text-based chat interface
- **Voice**: Speech-to-text and text-to-speech capabilities
- **Multimodal**: Combination of text and voice in the same conversation

Voice capabilities are powered by:

- OpenAI Whisper API for speech-to-text transcription (for both implementations)
- ElevenLabs API for natural-sounding text-to-speech responses (for both implementations)

### 3. Mobile-First UI Design

- Floating action button accessible throughout the app
- Slide-up drawer that doesn't interrupt the main UI
- Voice recording with waveform visualization
- Real-time streaming responses

## Technical Implementation

### Core Components

1. **AI Inference Interface**: `AIInferenceClient.ts`
   - Standardized interface for AI providers with support for function calling and voice

2. **Model-Specific Implementations**:
   - `OpenAIInferenceClient.ts`: Implementation for OpenAI GPT-4 Turbo
   - `XAIGrokInferenceClient.ts`: Implementation for xAI Grok-3

3. **UI Component**: `AIConcierge.tsx`
   - Mobile-friendly React component for the concierge interface
   - Support for multimodal interactions

4. **API Routes**:
   - `/api/concierge/route.ts`: Main completion endpoint
   - `/api/concierge/stream/route.ts`: Streaming completion endpoint
   - `/api/concierge/transcribe/route.ts`: Voice transcription endpoint
   - `/api/concierge/speak/route.ts`: Text-to-speech endpoint
   - `/api/concierge/functions/*`: Function execution endpoints

5. **Database Schema**:
   - `concierge_conversations`: Conversation history
   - `concierge_voice_sessions`: Voice interaction data
   - `concierge_function_calls`: Function call tracking
   - `concierge_scheduled_tasks`: Scheduled notifications and reminders

### Environment Variables

The following environment variables need to be set in your .env file:

For OpenAI implementation:

```
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

For xAI Grok implementation:

```
XAI_GROK_API_KEY=your_xai_grok_api_key
OPENAI_API_KEY=your_openai_api_key_for_whisper_only
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

Never commit these API keys to the repository. Use environment variables in your development and production environments.

### API Reference

#### 1. Chat Completion

```typescript
// POST /api/concierge/stream
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." },
    ...
  ],
  "userId": "user-uuid",
  "contextData": { ... },
  "functions": [ ... ],
  "functionCall": "auto"
}
```

#### 2. Voice Transcription

```typescript
// POST /api/concierge/transcribe
// Requires form data with 'file' field containing audio blob
```

#### 3. Text-to-Speech

```typescript
// POST /api/concierge/speak
{
  "text": "Text to convert to speech"
}
```

#### 4. Function Execution

```typescript
// POST /api/concierge/functions/create-jetshare-offer
{
  "departure": "New York",
  "arrival": "Miami",
  "flight_date": "2023-12-25T14:00:00",
  "total_cost": "25000",
  "share_amount": "5000",
  "user_id": "user-uuid"
}
```

## Usage Examples

### Creating a JetShare Offer

```
User: "I'd like to offer 2 seats on my flight from Los Angeles to New York next Friday. The total cost is $18,000."

Concierge: "I'd be happy to help you create a JetShare offer. Let me confirm the details:
- Departure: Los Angeles
- Arrival: New York
- Date: Next Friday (June 10, 2023)
- Total cost: $18,000
- Share amount per seat: $9,000 (assuming 2 seats)

Should I proceed with creating this offer?"

User: "Yes, that's correct."

Concierge: "Great! I've created your JetShare offer for 2 seats from Los Angeles to New York next Friday. Your offer ID is JET-12345. Other users can now book these seats. Would you like me to do anything else for you?"
```

### Finding Available Flights

```
User: "I need to find a flight to Miami next weekend."

Concierge: "I'll search for JetShare offers to Miami next weekend (June 11-12, 2023). One moment..."

Concierge: "I found 3 available offers to Miami next weekend:
1. New York to Miami - Saturday, June 11 at 2pm - $4,500 per seat
2. Chicago to Miami - Saturday, June 11 at 10am - $3,800 per seat
3. Atlanta to Miami - Sunday, June 12 at 3pm - $2,900 per seat

Would you like more details about any of these offers?"
```

### Setting a Reminder

```
User: "Remind me to check for flights to Los Angeles on Tuesday."

Concierge: "I've scheduled a reminder for you to check for flights to Los Angeles on Tuesday, June 7 at 9:00 AM. Is there anything else you'd like me to help you with?"
```

### Using Voice Mode

```
[User taps the microphone button and speaks]
"I want to book ground transportation from the airport to my hotel in New York next Thursday"

[Concierge transcribes the speech and processes the request]

[Concierge responds with both text and voice]
"I can help you arrange ground transportation. For next Thursday, what time will you arrive at the airport, and what's the name of your hotel in New York?"
```

## Security Considerations

The AI Concierge implements several security measures:

1. **Authentication**: All requests require Supabase authentication
2. **Row-Level Security (RLS)**: Database tables have RLS policies ensuring users can only access their own data
3. **Secure API Endpoints**: All function execution is validated and authorized server-side
4. **Environment Variable Protection**: API keys stored securely in environment variables

## Implementation Status

✅ Function Calling (both OpenAI and xAI Grok)
✅ Whisper Speech-to-Text  
✅ ElevenLabs Text-to-Speech
✅ Mobile-First UI
✅ Database Schema & Tracking
✅ Function Execution Endpoints

## Next Steps

Future enhancements could include:

1. **Enhanced Analytics**: Track concierge usage patterns and optimize prompts
2. **Personalization**: Tailor responses based on user preferences and history
3. **Advanced Function Calling**: Expand functionality to handle more complex requests
4. **Offline Support**: Add queueing mechanism for offline function execution
5. **Conversation Memory**: Implement long-term memory for more personalized interactions

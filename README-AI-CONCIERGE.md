# AI Concierge for JetShare

This document outlines the implementation of the AI Concierge feature for the JetShare application, a personalized assistant powered by OpenAI GPT-4 Turbo.

## Overview

The AI Concierge is designed to provide JetShare users with a seamless, conversational interface for:

- Creating JetShare offers
- Finding available flights
- Setting reminders
- Receiving notifications about relevant flights
- Getting assistance with JetShare features

## Implementation Details

### Architecture

The implementation follows a client-server architecture with the following components:

1. **Frontend UI Component**: Mobile-first, non-intrusive chat interface integrated into JetShare
2. **Abstraction Layer**: Standardized interface for different AI inference providers
3. **OpenAI Client**: Implementation of the AI inference interface using OpenAI GPT-4 Turbo
4. **Backend API Routes**: Next.js API routes for handling conversation and scheduling
5. **Database Schema**: Supabase tables for storing conversations and scheduled tasks

### File Structure

```
app/
├── api/
│   └── concierge/
│       ├── route.ts               # Main API endpoint for concierge
│       ├── stream/route.ts        # Streaming API for real-time responses
│       └── schedule/route.ts      # API for scheduling tasks and reminders
│
├── lib/
│   └── ai/
│       ├── AIInferenceClient.ts   # Interface for AI providers
│       ├── OpenAIInferenceClient.ts # OpenAI implementation
│       └── components/
│           └── InferenceTestChat.tsx # Test UI for inference
│
└── jetshare/
    └── components/
        └── AIConcierge.tsx        # Main UI component for the concierge
```

### Database Schema

Two main tables are used:

1. **concierge_conversations**: Stores conversation history for each user
   - `id`: UUID primary key
   - `user_id`: Foreign key to auth.users
   - `messages`: JSONB array of messages
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

2. **concierge_scheduled_tasks**: Stores scheduled tasks and reminders
   - `id`: UUID primary key
   - `user_id`: Foreign key to auth.users
   - `task_type`: Text (offer_notification, reminder, schedule)
   - `task_details`: JSONB object with task details
   - `scheduled_at`: Timestamp for when the task should execute
   - `status`: Text (pending, completed, cancelled)
   - `created_at`: Timestamp
   - `completed_at`: Timestamp (nullable)

### API Endpoints

1. `/api/concierge`: Main endpoint for non-streaming responses
2. `/api/concierge/stream`: Streaming endpoint for real-time responses
3. `/api/concierge/schedule`: Endpoint for creating and managing scheduled tasks

### Security

- All endpoints are secured using Supabase authentication
- Row-level security (RLS) policies ensure users can only access their own data
- API keys are stored securely in environment variables

## Usage

The AI Concierge is available to authenticated users in the JetShare application. It appears as a floating button in the bottom-right corner of the screen.

### Example Interactions

- "Offer two seats on my flight to Miami tomorrow for $3,000 each"
- "Find me a flight to New York this weekend"
- "Remind me to check for flights to Chicago next Tuesday"
- "How do I create a JetShare offer?"

## Development

### Prerequisites

- Node.js and npm
- Supabase account
- OpenAI API key

### Environment Variables

Required environment variables:

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Running Tests

```bash
# Run the AI inference tests
npm run test:ai
```

## Future Enhancements

1. **Advanced Personalization**: Further personalize responses based on user preferences and behavior
2. **Multi-provider Support**: Implement additional AI providers like xAI Grok
3. **Function Calling**: Enable specific actions like creating offers directly from the conversation
4. **Voice Interface**: Add voice input/output support
5. **Enhanced Scheduling**: Improve scheduling capabilities with recurring reminders

## Technical Considerations

- The AI Concierge is designed to be minimally intrusive to the user experience
- Mobile-first design ensures good performance on smaller screens
- Streaming responses provide a more responsive feel
- Error handling is robust with user-friendly fallbacks 
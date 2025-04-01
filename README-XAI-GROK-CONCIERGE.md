# xAI Grok Concierge for JetShare

This document outlines the implementation of the AI Concierge feature for the JetShare application, powered by xAI Grok-3.

## Overview

The xAI Grok Concierge provides JetShare users with a seamless, conversational interface for:

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
3. **xAI Grok Client**: Implementation of the AI inference interface using xAI Grok API
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
│       ├── XAIGrokInferenceClient.ts # xAI Grok implementation
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

### xAI Grok API Integration

The implementation leverages the xAI Grok API, which follows a similar interface to OpenAI's completion API:

- Base URL: `https://api.x.ai/v1/chat/completions`
- Authentication: Bearer token with the xAI API key
- Request format:
  ```json
  {
    "model": "grok-3",
    "messages": [
      {"role": "system", "content": "..."},
      {"role": "user", "content": "..."}
    ],
    "temperature": 0.7,
    "stream": true
  }
  ```
- Streaming response format follows server-sent events (SSE) standard

## Advantages of xAI Grok

- **Performance**: Grok-3 offers competitive performance with other leading LLMs
- **Real-time Knowledge**: Grok has access to more recent information
- **Cost Efficiency**: Potentially more cost-effective for high-volume usage
- **Unique Capabilities**: Grok provides certain capabilities and knowledge specialized for specific domains

## Usage

The xAI Grok Concierge is available to authenticated users in the JetShare application. It appears as a floating button in the bottom-right corner of the screen.

### Example Interactions

- "Offer two seats on my flight to Miami tomorrow for $3,000 each"
- "Find me a flight to New York this weekend"
- "Remind me to check for flights to Chicago next Tuesday"
- "How do I create a JetShare offer?"

## Development

### Prerequisites

- Node.js and npm
- Supabase account
- xAI Grok API key

### Environment Variables

Required environment variables:

```
XAI_GROK_API_KEY=xai-...
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Running Tests

```bash
# Run the xAI Grok inference tests
npm run test:xai
```

## Comparison with OpenAI GPT-4

Both models provide similar functionality but with different strengths:

- **Grok-3**: More recent knowledge, potentially faster response times
- **GPT-4 Turbo**: Broader knowledge base, more refined responses in some domains

## Technical Considerations

- The UI components and API implementations are shared between OpenAI and xAI implementations
- Only the underlying AI inference client changes between implementations
- This modular architecture allows for easy switching between LLM providers
- Mobile-first design ensures good performance on smaller screens
- Streaming responses provide a more responsive feel 
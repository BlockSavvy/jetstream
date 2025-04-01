# JetShare AI Concierge Documentation

## Implementation Overview

The AI Concierge has been implemented in two separate feature branches:

- `feature/ai-inference-openai-gpt4`: OpenAI GPT-4 Turbo implementation
- `feature/ai-inference-xai-grok3`: xAI Grok-3 implementation

Both branches contain identical UI components and API endpoints, with the only difference being the specific AI inference client implementation.

## Core Components

### 1. AI Inference Clients

**OpenAI Implementation**: `app/lib/ai/OpenAIInferenceClient.ts`
- Implements the AIInferenceClient interface for OpenAI GPT-4 Turbo
- Handles both streaming and non-streaming completions
- Supports multiple OpenAI models (gpt-4-turbo, gpt-4, gpt-3.5-turbo)

**xAI Grok Implementation**: `app/lib/ai/XAIGrokInferenceClient.ts`
- Implements the AIInferenceClient interface for xAI Grok-3
- Handles both streaming and non-streaming completions
- Supports multiple Grok models (grok-3, grok-2-latest, grok-1)

### 2. Frontend Components

**AIConcierge UI**: `app/jetshare/components/AIConcierge.tsx`
- Floating button in bottom-right corner for launching the concierge
- Slide-up drawer for chat interface
- Real-time streaming responses
- Message history display
- Automatic user context integration

### 3. Backend API Routes

**Main API Endpoints**:
- `/api/concierge/route.ts`: Main non-streaming API endpoint
- `/api/concierge/stream/route.ts`: Streaming API endpoint for real-time responses
- `/api/concierge/schedule/route.ts`: API for scheduling tasks and reminders

### 4. Database Schema

**Migration File**: `migrations/concierge_tables.sql`
- `concierge_conversations`: Stores conversation history
- `concierge_scheduled_tasks`: Stores scheduled tasks and reminders
- Includes RLS policies for security
- Includes indexes for performance

## Features Implemented

1. **Profile & Context-Aware Interaction**
   - Concierge accesses the authenticated user's profile information
   - Context is passed to the AI for personalized responses

2. **JetShare Offer Creation**
   - Users can ask to create JetShare offers conversationally
   - The AI understands natural language requests

3. **Flight Discovery & Notifications**
   - Users can set up notifications for flight offers
   - Scheduled reminders are stored in the database

4. **Non-Intrusive Mobile-First UI**
   - Floating button that doesn't interfere with main UI
   - Slide-up drawer for the chat interface
   - Real-time streaming responses for natural conversation flow

## Setup Instructions

1. **Database Setup**:
   - Execute the SQL in `migrations/concierge_tables.sql` in the Supabase SQL editor
   - This creates necessary tables, indexes, and security policies

2. **Environment Variables**:
   - For OpenAI implementation:
     ```
     OPENAI_API_KEY=your_openai_api_key
     ```
   - For xAI Grok implementation:
     ```
     XAI_GROK_API_KEY=your_xai_grok_api_key
     ```

## Testing Instructions

1. **Vercel Previews**:
   - Each branch has its own Vercel preview deployment
   - Test both implementations side-by-side

2. **Authentication**:
   - Log in to access the concierge (appears only for authenticated users)
   - The concierge integrates with the current user's context

3. **Test Scenarios**:
   - Creating a JetShare offer: "I want to offer 2 seats on my flight to Miami tomorrow"
   - Setting a reminder: "Remind me to check for flights to NYC next weekend"
   - General assistance: "How do I create a JetShare offer?"

## Next Steps & Potential Enhancements

1. **Function Calling**:
   - Implement direct function calling to trigger database operations
   - Enable creating offers directly from the conversation

2. **Enhanced Scheduling**:
   - Improve the scheduling system with more robust reminders
   - Implement recurring reminders

3. **Analytics Integration**:
   - Track concierge usage patterns
   - Analyze common user queries

4. **Voice Interface**:
   - Add speech-to-text and text-to-speech capabilities
   - Enable hands-free interaction

5. **Payment Integration**:
   - Allow direct payment authorization through the concierge
   - Support booking confirmation

## Technical Considerations

- Both implementations use the same abstraction layer for AI inference
- The architecture is designed for easy switching between different LLM providers
- Security is enforced through Supabase Row Level Security policies
- Mobile-first design ensures good performance on smaller screens 
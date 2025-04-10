# AI Inference Testing Framework Setup Notes

## Branch Structure

Two parallel feature branches have been created to isolate different AI inference implementations:

- `feature/ai-inference-openai-gpt4`: For implementing and testing OpenAI GPT-4 Turbo
- `feature/ai-inference-xai-grok3`: For implementing and testing xAI Grok-3

Both branches were created from the main branch and contain identical infrastructure code.

## Components Created

### 1. Abstraction Layer

**File:** `app/lib/ai/AIInferenceClient.ts`

This interface provides a standardized way to interact with different AI inference providers:

- `Message` interface for structured chat messages
- `AICompletionOptions` for model configuration
- `StreamingCallbacks` for handling streaming responses
- `AIInferenceClient` interface with methods for:
  - Getting available models
  - Getting the default model
  - Non-streaming completions
  - Streaming completions
- A placeholder `getInferenceClient()` factory function to be implemented in each branch

### 2. Test Chat UI

**File:** `app/lib/ai/components/InferenceTestChat.tsx`

A React component that provides:

- Model selection dropdown
- Chat history display
- Text input for user messages
- Support for streaming responses with real-time display
- Error handling for API issues

### 3. Test Page

**File:** `app/dashboard/test-chat/page.tsx`

A Next.js page component that:

- Incorporates the InferenceTestChat component
- Provides context about the testing purpose
- Is accessible at `/dashboard/test-chat`

## Implementation Status

- ✅ Core infrastructure created
- ✅ Interface design completed
- ✅ Test UI implemented
- ✅ Feature branches created and pushed
- ❌ OpenAI client implementation (to be done)
- ❌ xAI Grok-3 client implementation (to be done)

## Next Steps

### For OpenAI GPT-4 Turbo (`feature/ai-inference-openai-gpt4`)

1. Install the OpenAI SDK
2. Create an `OpenAIInferenceClient` class that implements `AIInferenceClient`
3. Configure environment variables for API keys
4. Implement streaming and non-streaming completions
5. Test and optimize the implementation

### For xAI Grok-3 (`feature/ai-inference-xai-grok3`)

1. Install the xAI SDK (if available) or set up for API calls
2. Create a `GrokInferenceClient` class that implements `AIInferenceClient`
3. Configure environment variables for API keys
4. Implement streaming and non-streaming completions
5. Test and optimize the implementation

## Important Technical Details

- Both implementations share the same abstraction layer, enabling easy comparison
- The test chat UI is designed to be reusable across implementations
- The interface is designed to handle different model capabilities
- Streaming is supported for real-time response display
- Error handling is included in the interface and UI

## Vercel Deployment

Both branches are configured for automatic Vercel preview deployment, allowing:

- Isolated testing of each implementation
- Side-by-side comparison of model responses
- Sharing test environments with stakeholders

## File Structure

app/
├── dashboard/
│   └── test-chat/
│       └── page.tsx
└── lib/
    └── ai/
        ├── AIInferenceClient.ts
        └── components/
            └── InferenceTestChat.tsx

## Technical Debt and Future Considerations

- The current implementation does not include authentication for the test page
- Performance optimization might be needed for larger chat histories
- Function calling and other advanced model features are not yet supported
- A more comprehensive comparison UI could be developed

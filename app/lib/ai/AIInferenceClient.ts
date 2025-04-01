export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface StreamingCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export interface AIInferenceClient {
  /**
   * Get the available model names for this client
   */
  getAvailableModels(): string[];

  /**
   * Get the default model name for this client
   */
  getDefaultModel(): string;
  
  /**
   * Send a completion request and get the full response
   */
  getCompletion(
    messages: Message[], 
    options?: AICompletionOptions
  ): Promise<string>;
  
  /**
   * Stream a completion response with token-by-token callbacks
   */
  streamCompletion(
    messages: Message[],
    callbacks: StreamingCallbacks,
    options?: AICompletionOptions
  ): Promise<void>;
}

/**
 * Factory function to get the appropriate inference client
 * based on environment variables or configuration
 */
export function getInferenceClient(): AIInferenceClient {
  // Import and use the xAI Grok implementation
  const { XAIGrokInferenceClient } = require('./XAIGrokInferenceClient');
  return new XAIGrokInferenceClient();
} 
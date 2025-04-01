export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string; // For function messages
  function_call?: FunctionCall; // For assistant messages with function calls
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AICompletionOptions {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  functions?: FunctionDefinition[]; // Function definitions for function calling
  functionCall?: 'auto' | 'none' | { name: string }; // Control function calling behavior
}

export interface StreamingCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  onFunctionCall?: (functionCall: FunctionCall) => void; // Callback for function calls
}

export interface VoiceOptions {
  inputLanguage?: string; // Language for speech-to-text
  outputVoiceId?: string; // ElevenLabs voice ID
  enhancedSpeedMode?: boolean; // Faster processing for voice
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
  ): Promise<{ content: string; functionCall?: FunctionCall }>;
  
  /**
   * Stream a completion response with token-by-token callbacks
   */
  streamCompletion(
    messages: Message[],
    callbacks: StreamingCallbacks,
    options?: AICompletionOptions
  ): Promise<void>;

  /**
   * Transcribe audio to text using speech recognition
   */
  transcribeAudio?(
    audioBlob: Blob,
    options?: VoiceOptions
  ): Promise<string>;

  /**
   * Convert text to speech
   */
  textToSpeech?(
    text: string,
    options?: VoiceOptions
  ): Promise<Blob>;
}

/**
 * Factory function to get the appropriate inference client
 * based on environment variables or configuration
 */
export function getInferenceClient(): AIInferenceClient {
  // Import and use the OpenAI implementation
  const { OpenAIInferenceClient } = require('./OpenAIInferenceClient');
  return new OpenAIInferenceClient();
} 
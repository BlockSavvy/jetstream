import { AICompletionOptions, AIInferenceClient, FunctionCall, Message, StreamingCallbacks, VoiceOptions } from "./AIInferenceClient";
import OpenAI from "openai";

export class OpenAIInferenceClient implements AIInferenceClient {
  private client: OpenAI;
  private availableModels: string[] = [
    "gpt-4-turbo",
    "gpt-4-turbo-preview",
    "gpt-4-0125-preview",
    "gpt-4",
    "gpt-3.5-turbo"
  ];
  private defaultModel: string = "gpt-4-turbo";
  private elevenLabsApiKey: string | null = null;

  constructor() {
    // Initialize with a dummy key for build time, will be replaced at runtime
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build-time-only'
    });

    // Initialize ElevenLabs (optional)
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || null;
  }

  private ensureApiKey() {
    // Only check for real API key at runtime, not during build
    if (typeof window !== 'undefined' && !process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
  }

  getAvailableModels(): string[] {
    return this.availableModels;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async getCompletion(
    messages: Message[],
    options?: AICompletionOptions
  ): Promise<{ content: string; functionCall?: FunctionCall }> {
    try {
      // Ensure API key is available at runtime (not build time)
      this.ensureApiKey();
      
      const formattedMessages = messages.map(m => {
        const formatted: any = {
          role: m.role,
          content: m.content
        };
        
        // Add name for function messages
        if (m.role === 'function' && m.name) {
          formatted.name = m.name;
        }
        
        // Add function_call for assistant messages
        if (m.role === 'assistant' && m.function_call) {
          formatted.function_call = m.function_call;
        }
        
        return formatted;
      });

      const completionOptions: any = {
        model: options?.modelName || this.defaultModel,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
      };

      // Add function calling options if provided
      if (options?.functions && options.functions.length > 0) {
        completionOptions.functions = options.functions;
        
        if (options.functionCall) {
          completionOptions.function_call = options.functionCall;
        }
      }

      const response = await this.client.chat.completions.create(completionOptions);
      const message = response.choices[0].message;

      // Extract function call if present
      let functionCall: FunctionCall | undefined;
      if (message.function_call) {
        functionCall = {
          name: message.function_call.name,
          arguments: message.function_call.arguments || '{}'
        };
      }

      return {
        content: message.content || '',
        functionCall
      };
    } catch (error) {
      console.error('Error in OpenAI completion:', error);
      throw new Error(`OpenAI API error: ${(error as Error).message}`);
    }
  }

  async streamCompletion(
    messages: Message[],
    callbacks: StreamingCallbacks,
    options?: AICompletionOptions
  ): Promise<void> {
    try {
      // Ensure API key is available at runtime (not build time)
      this.ensureApiKey();
      
      const formattedMessages = messages.map(m => {
        const formatted: any = {
          role: m.role,
          content: m.content
        };
        
        // Add name for function messages
        if (m.role === 'function' && m.name) {
          formatted.name = m.name;
        }
        
        // Add function_call for assistant messages
        if (m.role === 'assistant' && m.function_call) {
          formatted.function_call = m.function_call;
        }
        
        return formatted;
      });

      // Call onStart callback if provided
      if (callbacks.onStart) {
        callbacks.onStart();
      }

      const completionOptions: any = {
        model: options?.modelName || this.defaultModel,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
      };

      // Add function calling options if provided
      if (options?.functions && options.functions.length > 0) {
        completionOptions.functions = options.functions;
        
        if (options.functionCall) {
          completionOptions.function_call = options.functionCall;
        }
      }

      // Use the non-streaming API since we're having issues with streaming types
      const response = await this.client.chat.completions.create(completionOptions);
      const content = response.choices[0].message.content || '';
      
      // Simulate streaming with small chunks
      const chunkSize = 5;
      let fullResponse = '';
      
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.substring(i, i + chunkSize);
        if (callbacks.onToken) {
          callbacks.onToken(chunk);
        }
        fullResponse += chunk;
        // Add a small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Handle function call if present
      if (response.choices[0].message.function_call && callbacks.onFunctionCall) {
        const functionCall = {
          name: response.choices[0].message.function_call.name,
          arguments: response.choices[0].message.function_call.arguments || '{}'
        };
        callbacks.onFunctionCall(functionCall);
      }
      
      // Call onComplete callback with the full message
      if (callbacks.onComplete) {
        callbacks.onComplete(fullResponse);
      }
    } catch (error) {
      console.error('Error in OpenAI completion:', error);
      // Call onError callback if provided
      if (callbacks.onError) {
        callbacks.onError(error as Error);
      }
    }
  }

  async transcribeAudio(audioBlob: Blob, options?: VoiceOptions): Promise<string> {
    try {
      // Ensure API key is available at runtime (not build time)
      this.ensureApiKey();
      
      // Convert blob to file
      const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type });
      
      // Create a form data object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      
      // Set language if provided
      if (options?.inputLanguage) {
        formData.append('language', options.inputLanguage);
      }
      
      // Make API request to OpenAI Whisper
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error(`Transcription error: ${(error as Error).message}`);
    }
  }

  async textToSpeech(text: string, options?: VoiceOptions): Promise<Blob> {
    try {
      if (!this.elevenLabsApiKey) {
        throw new Error('ElevenLabs API key is not set');
      }
      
      // Use ElevenLabs for high-quality voice synthesis
      const voiceId = options?.outputVoiceId || 'Adam'; // Default voice
      
      // Make API request to ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Text-to-speech failed: ${response.statusText}`);
      }
      
      // Get the audio data
      const audioData = await response.arrayBuffer();
      return new Blob([audioData], { type: 'audio/mpeg' });
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw new Error(`Text-to-speech error: ${(error as Error).message}`);
    }
  }
}

// Override the factory function to return our OpenAI implementation
export function getInferenceClient(): AIInferenceClient {
  return new OpenAIInferenceClient();
} 
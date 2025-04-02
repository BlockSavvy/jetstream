import { AICompletionOptions, AIInferenceClient, FunctionCall, Message, StreamingCallbacks, VoiceOptions } from "./AIInferenceClient";

export class XAIGrokInferenceClient implements AIInferenceClient {
  private apiKey: string;
  private apiUrl: string = 'https://api.x.ai/v1/chat/completions';
  private availableModels: string[] = [
    "grok-2-latest",
    "grok-1"
  ];
  private defaultModel: string = "grok-2-latest";

  constructor() {
    // Get API key from environment variables
    const apiKey = process.env.XAI_GROK_API_KEY;
    if (!apiKey) {
      throw new Error("XAI_GROK_API_KEY environment variable is not set");
    }
    this.apiKey = apiKey;
  }

  getAvailableModels(): string[] {
    return this.availableModels;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Convert our standard Message format to Grok API format
   */
  private formatMessages(messages: Message[]): any[] {
    return messages.map(m => {
      const formatted: any = {
        role: m.role,
        content: m.content
      };
      
      // Add name for function messages
      if (m.role === 'function' && m.name) {
        formatted.name = m.name;
      }
      
      return formatted;
    });
  }

  /**
   * Format functions for X.AI function calling
   */
  private formatFunctions(functions?: any[]): any[] | undefined {
    if (!functions || functions.length === 0) return undefined;
    
    return functions.map(f => ({
      type: "function",
      function: f
    }));
  }

  async getCompletion(
    messages: Message[], 
    options?: AICompletionOptions
  ): Promise<{ content: string; functionCall?: FunctionCall }> {
    try {
      const formattedMessages = this.formatMessages(messages);
      
      // Use grok-2-latest instead of grok-3
      const requestedModel = options?.modelName || this.defaultModel;

      const requestBody: any = {
        model: requestedModel,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        stream: false
      };

      // Format functions for X.AI API if they exist
      if (options?.functions) {
        requestBody.tools = this.formatFunctions(options.functions);
      }
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`xAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const message = data.choices[0].message;

      // Handle function calling if present
      let functionCall: FunctionCall | undefined;
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        if (toolCall.type === 'function') {
          functionCall = {
            name: toolCall.function.name,
            arguments: toolCall.function.arguments
          };
        }
      }

      return {
        content: message.content || '',
        functionCall
      };
    } catch (error) {
      console.error('Error in xAI Grok completion:', error);
      throw new Error(`xAI API error: ${(error as Error).message}`);
    }
  }

  async streamCompletion(
    messages: Message[],
    callbacks: StreamingCallbacks,
    options?: AICompletionOptions
  ): Promise<void> {
    try {
      const formattedMessages = this.formatMessages(messages);
      
      // Use grok-2-latest instead of grok-3
      const requestedModel = options?.modelName || this.defaultModel;

      const requestBody: any = {
        model: requestedModel,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        stream: true
      };

      // Format functions for X.AI API if they exist
      if (options?.functions) {
        requestBody.tools = this.formatFunctions(options.functions);
      }

      // Call onStart callback if provided
      if (callbacks.onStart) {
        callbacks.onStart();
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`xAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = '';
      let functionCall: FunctionCall | undefined;
      let buffer = ''; // Buffer for handling incomplete JSON chunks

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Split by double newlines which is the SSE standard delimiter
          const lines = buffer.split('\n\n');
          
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            // Skip empty lines
            if (!line.trim()) continue;
            
            // Handle data prefix
            if (!line.startsWith('data: ')) continue;
            
            // Handle [DONE] marker
            if (line === 'data: [DONE]') continue;
            
            try {
              // Clean the data string to ensure it's valid JSON
              const dataStr = line.substring(6).trim();
              if (!dataStr) continue;
              
              // Try to parse the JSON safely
              let data;
              try {
                data = JSON.parse(dataStr);
              } catch (parseError) {
                // If the JSON is invalid, try to fix common issues
                // 1. Try to find where the valid JSON ends
                const lastBrace = dataStr.lastIndexOf('}');
                const lastBracket = dataStr.lastIndexOf(']');
                const lastValidChar = Math.max(lastBrace, lastBracket);
                
                if (lastValidChar > 0) {
                  try {
                    // Try parsing just the valid portion
                    data = JSON.parse(dataStr.substring(0, lastValidChar + 1));
                  } catch (e) {
                    // If still can't parse, skip this chunk
                    console.error('Failed to repair JSON:', dataStr);
                    continue;
                  }
                } else {
                  // Can't find valid JSON ending
                  continue;
                }
              }
              
              if (data.choices && data.choices.length > 0) {
                const choice = data.choices[0];
                
                // Handle delta content
                if (choice.delta && choice.delta.content) {
                  const token = choice.delta.content;
                  if (callbacks.onToken) {
                    callbacks.onToken(token);
                  }
                  fullResponse += token;
                }
                
                // Handle function call
                if (choice.delta && choice.delta.tool_calls) {
                  const toolCall = choice.delta.tool_calls[0];
                  
                  // Initialize function call if not exists
                  if (!functionCall && toolCall.function && toolCall.function.name) {
                    functionCall = {
                      name: toolCall.function.name,
                      arguments: toolCall.function.arguments || ''
                    };
                  } else if (functionCall && toolCall.function && toolCall.function.arguments) {
                    // Append to existing function call arguments
                    functionCall.arguments += toolCall.function.arguments;
                  }
                }
              }
            } catch (e) {
              // More detailed error logging for debugging
              console.error('Error parsing SSE data:', e);
              console.error('Problematic line:', line);
              // Continue processing other lines
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Call function call callback if we have a function call
      if (functionCall && functionCall.name && callbacks.onFunctionCall) {
        callbacks.onFunctionCall(functionCall);
      }

      // Call onComplete callback with the full message
      if (callbacks.onComplete) {
        callbacks.onComplete(fullResponse);
      }
    } catch (error) {
      console.error('Error in xAI Grok streaming completion:', error);
      // Call onError callback if provided
      if (callbacks.onError) {
        callbacks.onError(error as Error);
      }
    }
  }

  // Voice capabilities are provided through separate APIs
  // We can integrate with OpenAI's Whisper and ElevenLabs
  // for consistent voice handling across both implementations
  async transcribeAudio(audioBlob: Blob, options?: VoiceOptions): Promise<string> {
    try {
      // We'll use OpenAI's Whisper API for transcription to maintain consistency
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
      // We'll use ElevenLabs for high-quality voice synthesis
      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
      if (!elevenLabsApiKey) {
        throw new Error('ElevenLabs API key is not set');
      }
      
      const voiceId = options?.outputVoiceId || 'Adam'; // Default voice
      
      // Make API request to ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey
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

  // Method to perform vector search directly from client
  async vectorSearch(
    query: string,
    tables: string[] = ['airports', 'flights', 'jets', 'jetshare_offers'],
    includeHistorical: boolean = false
  ): Promise<Record<string, any[]>> {
    try {
      const response = await fetch('/api/concierge/vector-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          tables,
          includeHistorical
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Vector search failed: ${response.statusText}`);
      }
      
      const { results } = await response.json();
      return results || {};
    } catch (error) {
      console.error('Vector search error:', error);
      return {};
    }
  }
} 
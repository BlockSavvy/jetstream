import { AICompletionOptions, AIInferenceClient, Message, StreamingCallbacks } from "./AIInferenceClient";

interface XAICompletionRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export class XAIGrokInferenceClient implements AIInferenceClient {
  private apiKey: string;
  private apiUrl = "https://api.x.ai/v1/chat/completions";
  private availableModels: string[] = [
    "grok-3",
    "grok-2-latest",
    "grok-1"
  ];
  private defaultModel: string = "grok-3";

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

  async getCompletion(
    messages: Message[],
    options?: AICompletionOptions
  ): Promise<string> {
    try {
      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const requestBody: XAICompletionRequest = {
        model: options?.modelName || this.defaultModel,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`xAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || '';
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
      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call onStart callback if provided
      if (callbacks.onStart) {
        callbacks.onStart();
      }

      const requestBody: XAICompletionRequest = {
        model: options?.modelName || this.defaultModel,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stream: true
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`xAI API error: ${response.status} - ${errorData}`);
      }

      if (!response.body) {
        throw new Error('No response body from xAI API');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const jsonData = JSON.parse(line.slice(6));
                const content = jsonData.choices[0]?.delta?.content || '';
                
                if (content) {
                  // Call onToken callback with the token
                  if (callbacks.onToken) {
                    callbacks.onToken(content);
                  }
                  // Accumulate the response
                  fullResponse += content;
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
        
        // Call onComplete callback with the full message
        if (callbacks.onComplete) {
          callbacks.onComplete(fullResponse);
        }
      } catch (error) {
        console.error('Error processing stream:', error);
        if (callbacks.onError) {
          callbacks.onError(error as Error);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in xAI Grok streaming:', error);
      // Call onError callback if provided
      if (callbacks.onError) {
        callbacks.onError(error as Error);
      }
    }
  }
}

// Override the factory function to return our xAI implementation
export function getInferenceClient(): AIInferenceClient {
  return new XAIGrokInferenceClient();
} 
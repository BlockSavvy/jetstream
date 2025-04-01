import { AICompletionOptions, AIInferenceClient, Message, StreamingCallbacks } from "./AIInferenceClient";
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

  constructor() {
    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    this.client = new OpenAI({
      apiKey: apiKey
    });
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

      const response = await this.client.chat.completions.create({
        model: options?.modelName || this.defaultModel,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
      });

      return response.choices[0].message.content || '';
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
      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call onStart callback if provided
      if (callbacks.onStart) {
        callbacks.onStart();
      }

      // Create a streaming completion request
      const stream = await this.client.chat.completions.create({
        model: options?.modelName || this.defaultModel,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stream: true,
      });

      // Buffer to accumulate the full response
      let fullResponse = '';

      // Process each chunk from the stream
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          // Call onToken callback with the token
          if (callbacks.onToken) {
            callbacks.onToken(content);
          }
          // Accumulate the response
          fullResponse += content;
        }
      }

      // Call onComplete callback with the full message
      if (callbacks.onComplete) {
        callbacks.onComplete(fullResponse);
      }
    } catch (error) {
      console.error('Error in OpenAI streaming:', error);
      // Call onError callback if provided
      if (callbacks.onError) {
        callbacks.onError(error as Error);
      }
    }
  }
}

// Override the factory function to return our OpenAI implementation
export function getInferenceClient(): AIInferenceClient {
  return new OpenAIInferenceClient();
} 
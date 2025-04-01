// This file is used to test the OpenAI inference client from the command line
import 'dotenv/config'; // Load environment variables from .env
import { getInferenceClient, Message } from './AIInferenceClient';

async function testOpenAIClient() {
  try {
    console.log('Initializing OpenAI client...');
    const client = getInferenceClient();
    
    console.log('Available models:', client.getAvailableModels());
    console.log('Default model:', client.getDefaultModel());
    
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for JetStream, a private jet sharing service.'
      },
      {
        role: 'user',
        content: 'Tell me briefly about JetShare and how I can offer a seat on my private jet.'
      }
    ];
    
    console.log('Sending test completion request...');
    const response = await client.getCompletion(messages);
    
    console.log('\nResponse:');
    console.log(response);
    
    console.log('\nTesting streaming completion...');
    await client.streamCompletion(messages, {
      onStart: () => console.log('Stream started'),
      onToken: (token) => process.stdout.write(token),
      onComplete: (fullResponse) => console.log('\n\nStream completed'),
      onError: (error) => console.error('Stream error:', error)
    });
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testOpenAIClient(); 
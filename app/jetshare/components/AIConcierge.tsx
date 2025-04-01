'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/app/lib/ai/AIInferenceClient';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase';

// Define the system prompt for the concierge
const SYSTEM_PROMPT = `You are the AI Concierge for JetShare, a private jet sharing service. 
Your role is to assist users with creating flight sharing offers, finding flights, and managing their bookings.
Be professional, concise, and helpful. Offer specific suggestions when possible.
Remember that JetShare allows users to offer seats on their private jets and book seats on others' jets.`;

export default function AIConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: SYSTEM_PROMPT }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Load past conversations if available
  useEffect(() => {
    if (user && isOpen) {
      loadConversation();
    }
  }, [user, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  // Load conversation history from database
  const loadConversation = async () => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('concierge_conversations')
        .select('messages')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data && data.messages) {
        // Ensure the system prompt is always at the beginning
        const hasSystemPrompt = data.messages.some(
          (msg: Message) => msg.role === 'system'
        );
        
        if (hasSystemPrompt) {
          setMessages(data.messages);
        } else {
          setMessages([
            { role: 'system', content: SYSTEM_PROMPT },
            ...data.messages
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      // If no conversation found, just use the default system prompt
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setStreamingResponse('');
    
    // Gather user context if available
    let contextData = null;
    if (user) {
      contextData = {
        userId: user.id,
        email: user.email,
        // Add more context data as needed
      };
    }
    
    // Use streaming API for real-time responses
    try {
      const response = await fetch('/api/concierge/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userId: user?.id,
          contextData
        }),
      });
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        const lines = text.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6));
              
              if (jsonData.type === 'token') {
                setStreamingResponse(prev => prev + jsonData.content);
              } else if (jsonData.type === 'complete') {
                setStreamingResponse('');
                setMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: jsonData.content }
                ]);
                setIsLoading(false);
              } else if (jsonData.type === 'error') {
                console.error('Error from server:', jsonData.error);
                setStreamingResponse('');
                setMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `Error: ${jsonData.error}` }
                ]);
                setIsLoading(false);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStreamingResponse('');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' }
      ]);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button to open concierge */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors z-50"
        aria-label="Open AI Concierge"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a10 10 0 0 1 10 10c0 6-6 10-10 10C8.36 22 5 20 3 17" />
          <path d="M10 8v4h4" />
          <path d="m21 8-2.36 2.36a1 1 0 0 1-1.28.13L15 9" />
        </svg>
      </button>

      {/* Concierge dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center sm:items-center">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md sm:max-w-lg rounded-t-lg sm:rounded-lg shadow-xl flex flex-col max-h-[80vh] sm:max-h-[600px] animate-slide-up">
            {/* Header */}
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">JetShare Concierge</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                message.role !== 'system' && (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                )
              ))}
              
              {/* Streaming response */}
              {streamingResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <p className="whitespace-pre-wrap">{streamingResponse}</p>
                  </div>
                </div>
              )}
              
              {/* Loading indicator */}
              {isLoading && !streamingResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex space-x-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about flight sharing..."
                  className="flex-grow rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isLoading || !inputValue.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
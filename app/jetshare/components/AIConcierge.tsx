'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, FunctionCall } from '@/app/lib/ai/AIInferenceClient';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase';
import { AudioRecorder } from 'react-audio-voice-recorder';
import WaveSurfer from 'wavesurfer.js';

// Define the system prompt for the concierge
const SYSTEM_PROMPT = `You are the AI Concierge for JetShare, a private jet sharing service. 
Your role is to assist users with creating flight sharing offers, finding flights, and managing their bookings.
Be professional, concise, and helpful. Offer specific suggestions when possible.
Remember that JetShare allows users to offer seats on their private jets and book seats on others' jets.`;

// Define function definitions for the AI to use
const FUNCTION_DEFINITIONS = [
  {
    name: 'CreateJetShareOffer',
    description: 'Create a new JetShare offer to share your private jet with others',
    parameters: {
      type: 'object',
      properties: {
        departure: {
          type: 'string',
          description: 'Departure location (city or airport code)',
        },
        arrival: {
          type: 'string',
          description: 'Arrival location (city or airport code)',
        },
        flight_date: {
          type: 'string',
          description: 'Date and time of the flight in ISO format (YYYY-MM-DD) or natural language (e.g., "tomorrow at 3pm")',
        },
        total_cost: {
          type: 'string', // Using string to allow for currency formatting
          description: 'Total cost of the flight in USD',
        },
        share_amount: {
          type: 'string', // Using string to allow for currency formatting
          description: 'Amount per share/seat in USD',
        }
      },
      required: ['departure', 'arrival', 'flight_date', 'total_cost', 'share_amount'],
    },
  },
  {
    name: 'FindJetShareOffer',
    description: 'Find available JetShare offers matching your criteria',
    parameters: {
      type: 'object',
      properties: {
        desired_location: {
          type: 'string',
          description: 'Desired departure or arrival location (city or airport code)',
        },
        date_range: {
          type: 'object',
          properties: {
            start_date: {
              type: 'string',
              description: 'Start date for searching flights in ISO format (YYYY-MM-DD)',
            },
            end_date: {
              type: 'string',
              description: 'End date for searching flights in ISO format (YYYY-MM-DD)',
            },
          },
        },
        price_range: {
          type: 'object',
          properties: {
            min: {
              type: 'string', // Using string to allow for currency formatting
              description: 'Minimum price in USD',
            },
            max: {
              type: 'string', // Using string to allow for currency formatting
              description: 'Maximum price in USD',
            },
          },
        },
      },
      required: ['desired_location'],
    },
  },
  {
    name: 'ScheduleNotification',
    description: 'Schedule a notification or reminder for a future time',
    parameters: {
      type: 'object',
      properties: {
        notification_time: {
          type: 'string',
          description: 'When to send the notification in ISO format (YYYY-MM-DDTHH:MM:SS) or natural language (e.g., "tomorrow at 3pm")',
        },
        message_content: {
          type: 'string',
          description: 'Content of the notification message',
        },
      },
      required: ['notification_time', 'message_content'],
    },
  },
  {
    name: 'BookAmenities',
    description: 'Book amenities for a flight',
    parameters: {
      type: 'object',
      properties: {
        amenity_type: {
          type: 'string',
          description: 'Type of amenity (catering, ground_transportation, accommodation, entertainment)',
          enum: ['catering', 'ground_transportation', 'accommodation', 'entertainment'],
        },
        flight_id: {
          type: 'string',
          description: 'ID of the flight to book amenities for',
        },
        preferences: {
          type: 'object',
          description: 'Specific preferences for the amenity',
        },
        payment_method_id: {
          type: 'string',
          description: 'ID of the payment method to use',
        },
      },
      required: ['amenity_type', 'flight_id', 'payment_method_id'],
    },
  },
  {
    name: 'ScheduleTransportation',
    description: 'Schedule transportation',
    parameters: {
      type: 'object',
      properties: {
        pickup_location: {
          type: 'string',
          description: 'Pickup location address',
        },
        dropoff_location: {
          type: 'string',
          description: 'Drop-off location address',
        },
        pickup_time: {
          type: 'string',
          description: 'Pickup time in ISO format (YYYY-MM-DDTHH:MM:SS) or natural language (e.g., "tomorrow at 3pm")',
        },
        vehicle_type: {
          type: 'string',
          description: 'Type of vehicle',
          enum: ['sedan', 'suv', 'luxury', 'van', 'limousine'],
        },
        payment_method_id: {
          type: 'string',
          description: 'ID of the payment method to use',
        },
      },
      required: ['pickup_location', 'dropoff_location', 'pickup_time', 'vehicle_type', 'payment_method_id'],
    },
  }
];

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
  
  // Voice mode state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  
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

  // Initialize WaveSurfer for audio visualization
  useEffect(() => {
    if (waveformRef.current && isOpen && isVoiceMode) {
      if (!wavesurferRef.current) {
        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#4F46E5',
          progressColor: '#818CF8',
          cursorColor: '#C7D2FE',
          height: 40,
          cursorWidth: 1,
          barWidth: 2,
          barRadius: 3,
          barGap: 3
        });
      }
      
      // Cleanup on unmount
      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }
      };
    }
  }, [isOpen, isVoiceMode]);

  // Load audio blob into wavesurfer
  useEffect(() => {
    if (audioBlob && wavesurferRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      wavesurferRef.current.load(audioUrl);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
      }
    }
  }, [audioBlob]);

  // Load conversation history from database
  const loadConversation = async () => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('concierge_conversations')
        .select('messages, interaction_type')
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
        
        // Set voice mode based on last conversation
        if (data.interaction_type === 'voice' || data.interaction_type === 'multimodal') {
          setIsVoiceMode(true);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      // If no conversation found, just use the default system prompt
    }
  };

  // Handle audio recording complete
  const handleRecordingComplete = async (blob: Blob) => {
    setAudioBlob(blob);
    setIsRecording(false);
    setIsTranscribing(true);
    
    try {
      // Create form data with the audio blob
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');
      
      // Send to the transcription endpoint
      const response = await fetch('/api/concierge/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const { text } = await response.json();
      setInputValue(text);
      setIsTranscribing(false);
      
      // Automatically send if we have text
      if (text.trim()) {
        await handleSendMessage(text);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setIsTranscribing(false);
      setInputValue('');
    }
  };

  // Play response audio
  const playResponseAudio = async (text: string) => {
    if (!isVoiceMode || !text.trim()) return;
    
    try {
      const response = await fetch('/api/concierge/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('Text-to-speech failed');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onplay = () => setIsPlaying(true);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (textToSend.trim() === '' || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: textToSend
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
          contextData,
          functions: FUNCTION_DEFINITIONS,
          functionCall: 'auto'
        }),
      });
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantResponse = '';
      let functionCall: FunctionCall | null = null;
      
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
                assistantResponse += jsonData.content;
              } else if (jsonData.type === 'function_call') {
                functionCall = jsonData.function_call;
              } else if (jsonData.type === 'complete') {
                setStreamingResponse('');
                
                // Create the assistant message
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: jsonData.content
                };
                
                // Add function call if present
                if (functionCall) {
                  assistantMessage.function_call = functionCall;
                  
                  // Execute the function call
                  await handleFunctionCall(functionCall);
                }
                
                setMessages(prev => [...prev, assistantMessage]);
                setIsLoading(false);
                
                // Play audio response if in voice mode
                if (isVoiceMode) {
                  playResponseAudio(jsonData.content);
                }
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

  // Handle function calls from the AI
  const handleFunctionCall = async (functionCall: FunctionCall) => {
    if (!user) return;
    
    try {
      const { name, arguments: argsString } = functionCall;
      const args = JSON.parse(argsString);
      
      // Add user_id to all function calls
      const paramsWithUser = {
        ...args,
        user_id: user.id
      };
      
      let endpoint = '';
      switch (name) {
        case 'CreateJetShareOffer':
          endpoint = '/api/concierge/functions/create-jetshare-offer';
          break;
        case 'FindJetShareOffer':
          endpoint = '/api/concierge/functions/find-jetshare-offer';
          break;
        case 'ScheduleNotification':
          endpoint = '/api/concierge/functions/schedule-notification';
          break;
        case 'BookAmenities':
          endpoint = '/api/concierge/functions/book-amenities';
          break;
        case 'ScheduleTransportation':
          endpoint = '/api/concierge/functions/schedule-transportation';
          break;
        default:
          console.error(`Unknown function: ${name}`);
          return;
      }
      
      // Call the appropriate API endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paramsWithUser),
      });
      
      const result = await response.json();
      
      // Add function result to messages
      setMessages(prev => [
        ...prev,
        {
          role: 'function',
          name,
          content: JSON.stringify(result),
        }
      ]);
      
    } catch (error) {
      console.error(`Error executing function ${functionCall.name}:`, error);
      
      // Add error result to messages
      setMessages(prev => [
        ...prev,
        {
          role: 'function',
          name: functionCall.name,
          content: JSON.stringify({ error: 'Function execution failed' }),
        }
      ]);
    }
  };

  // Toggle voice mode
  const toggleVoiceMode = () => {
    setIsVoiceMode(prev => !prev);
  };

  return (
    <>
      {/* Audio element for playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleVoiceMode}
                  className={`p-2 rounded-full ${isVoiceMode ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label={isVoiceMode ? "Switch to text mode" : "Switch to voice mode"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                </button>
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
            </div>

            {/* Chat messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                message.role !== 'system' && message.role !== 'function' && (
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
                      {message.function_call ? (
                        <div>
                          <p className="font-semibold text-sm text-indigo-600 dark:text-indigo-300 mb-1">
                            Processing: {message.function_call.name}
                          </p>
                          <p className="whitespace-pre-wrap">{message.content || 'Processing your request...'}</p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
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
              {isVoiceMode ? (
                <div className="flex flex-col space-y-3">
                  {/* Waveform visualization */}
                  <div 
                    ref={waveformRef} 
                    className={`w-full h-10 rounded-lg ${audioBlob ? 'bg-gray-50 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-700'}`}
                  />
                  
                  {/* Voice controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isTranscribing ? (
                        <div className="text-sm text-gray-500 animate-pulse">Transcribing...</div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {inputValue ? inputValue : (audioBlob ? 'Tap to speak again' : 'Tap microphone to speak')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {audioBlob && !isRecording && !isLoading && (
                        <button
                          onClick={() => audioRef.current?.play()}
                          disabled={isPlaying}
                          className="p-2 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 disabled:opacity-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </button>
                      )}
                      
                      <div className={`${isRecording ? 'animate-pulse' : ''}`}>
                        <AudioRecorder
                          onRecordingComplete={handleRecordingComplete}
                          audioTrackConstraints={{
                            noiseSuppression: true,
                            echoCancellation: true,
                          }}
                          onNotAllowedOrFound={(err) => console.error(err)}
                          downloadOnSavePress={false}
                          downloadFileExtension="webm"
                          mediaRecorderOptions={{
                            audioBitsPerSecond: 128000,
                          }}
                          showVisualizer={false}
                          classes={{
                            AudioRecorderStartSaveClass: `p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'} hover:opacity-90 ${isLoading || isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`,
                          }}
                        />
                      </div>
                      
                      {inputValue && !isTranscribing && !isLoading && (
                        <button
                          onClick={() => handleSendMessage()}
                          className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
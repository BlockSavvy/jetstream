'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/app/lib/ai/AIInferenceClient';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase';

// Define function definitions for the AI to understand structured tasks
const FUNCTION_DEFINITIONS = [
  {
    name: "CreateJetShareOffer",
    description: "Create a new JetShare offer",
    parameters: {
      type: "object",
      properties: {
        departure: { type: "string", description: "Departure location (city or airport)" },
        arrival: { type: "string", description: "Arrival location (city or airport)" },
        flight_date: { type: "string", description: "Date and time of flight (ISO format or natural language)" },
        jet_type: { type: "string", description: "Type of jet (G600, G550, Citation X, Phenom 300, Legacy 600, G450)" },
        total_cost: { type: "number", description: "Total cost of the flight in USD" },
        share_amount: { type: "string", description: "Number of seats or percentage to share" }
      },
      required: ["departure", "arrival", "flight_date", "total_cost", "share_amount"]
    }
  },
  {
    name: "FindJetShareOffer",
    description: "Find JetShare offers matching criteria",
    parameters: {
      type: "object",
      properties: {
        desired_location: { type: "string", description: "Destination or origin location" },
        date_range: { type: "string", description: "Date range for the flight" },
        price_range: { type: "string", description: "Price range for the share" }
      },
      required: ["desired_location"]
    }
  },
  {
    name: "ScheduleNotification",
    description: "Schedule a notification or reminder",
    parameters: {
      type: "object",
      properties: {
        notification_time: { type: "string", description: "When to send the notification (ISO format or natural language)" },
        message_content: { type: "string", description: "Content of the notification" }
      },
      required: ["notification_time", "message_content"]
    }
  },
  {
    name: "BookAmenities",
    description: "Book amenities for a flight",
    parameters: {
      type: "object",
      properties: {
        amenity_type: { type: "string", description: "Type of amenity (catering, ground transport, etc.)" },
        flight_id: { type: "string", description: "ID of the flight for the amenities" },
        preferences: { type: "string", description: "Specific preferences for the amenity" }
      },
      required: ["amenity_type", "flight_id"]
    }
  },
  {
    name: "ScheduleTransportation",
    description: "Schedule ground transportation",
    parameters: {
      type: "object",
      properties: {
        pickup_location: { type: "string", description: "Pickup location" },
        dropoff_location: { type: "string", description: "Dropoff location" },
        pickup_time: { type: "string", description: "Pickup time (ISO format or natural language)" },
        vehicle_type: { type: "string", description: "Type of vehicle (sedan, SUV, limo, etc.)" }
      },
      required: ["pickup_location", "dropoff_location", "pickup_time"]
    }
  }
];

// Define the system prompt for the concierge with function calling guidance
const SYSTEM_PROMPT = `You are the AI Concierge for JetShare, a private jet sharing service. 
Your role is to assist users with creating flight sharing offers, finding flights, and managing their bookings.

When a user wants to create a JetShare offer, you MUST collect all of the following information:
- Departure location (city or airport)
- Arrival location (city or airport)
- Flight date and time
- Type of jet (if they mention one specific jet)
- Total cost of the flight
- How much they want to share (percentage or number of seats)

Available jets include: G600, G550, Citation X, Phenom 300, Legacy 600, and Gulfstream G450.
Each jet has different seat capacities: G600 (19 seats), G550 (16 seats), Citation X (8 seats), Phenom 300 (7 seats), Legacy 600 (13 seats), G450 (16 seats).

When you have all the information needed to create a JetShare offer, say: "I'll create a JetShare offer with these details:" followed by the details in a clear format.

When a user asks to find flights or JetShare offers, collect:
- Desired location (destination or origin)
- Date range if provided
- Price range if provided

When a user wants to set a reminder or notification, collect:
- When they want to be notified
- What they want to be reminded about

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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Initialize audio recording
  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      stopRecording();
    }
  }, [isRecording]);
  
  // Stop background scrolling when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Load conversation history from database
  const loadConversation = async () => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('concierge_conversations')
        .select('messages, interaction_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Check for errors
      if (error) {
        console.error('Supabase query error:', error);
        // Continue with default system prompt
        return;
      }
      
      // Check if we got data
      if (data && data.length > 0 && data[0].messages) {
        // Ensure the system prompt is always at the beginning
        const hasSystemPrompt = data[0].messages.some(
          (msg: Message) => msg.role === 'system'
        );
        
        if (hasSystemPrompt) {
          setMessages(data[0].messages);
        } else {
          setMessages([
            { role: 'system', content: SYSTEM_PROMPT },
            ...data[0].messages
          ]);
        }
        
        // Set voice mode based on last conversation
        if (data[0].interaction_type === 'voice' || data[0].interaction_type === 'multimodal') {
          setIsVoiceMode(true);
        }
      } else {
        // No conversation found, use default system prompt
        setMessages([{ role: 'system', content: SYSTEM_PROMPT }]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      // If error occurred, use the default system prompt
      setMessages([{ role: 'system', content: SYSTEM_PROMPT }]);
    }
  };

  // Save conversation to database
  const saveConversation = async (messageList: Message[], interactionType: 'text' | 'voice' | 'multimodal') => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('concierge_conversations')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Supabase query error:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Update existing conversation
        await supabase
          .from('concierge_conversations')
          .update({ 
            messages: messageList,
            interaction_type: interactionType,
            updated_at: new Date().toISOString()
          })
          .eq('id', data[0].id);
      } else {
        // Create new conversation
        await supabase
          .from('concierge_conversations')
          .insert({
            user_id: user.id,
            messages: messageList,
            interaction_type: interactionType,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleRecordingComplete(audioBlob);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };
  
  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
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

  // Extract function call details from assistant response
  const extractFunctionCall = (text: string): { name: string; arguments: any } | null => {
    // Check for JetShare offer creation intent
    if (text.includes("I'll create a JetShare offer with these details") || 
        text.includes("I have all the information needed to create your JetShare offer")) {
      
      // Try to extract offer details from the conversation
      const departureMatcher = /(?:from|departure)[:\s]+([A-Za-z\s,]+?)(?:to|arrival|\.|,|\n)/i;
      const arrivalMatcher = /(?:to|arrival)[:\s]+([A-Za-z\s,]+?)(?:on|date|\.|,|\n)/i;
      const dateMatcher = /(?:on|date)[:\s]+([A-Za-z0-9\s,]+?)(?:with|jet|\.|,|\n)/i;
      const jetMatcher = /(?:jet|aircraft)[:\s]+([A-Za-z0-9\s]+?)(?:for|cost|\.|,|\n)/i;
      const costMatcher = /(?:cost|price)[:\s]+\$?([0-9,]+)/i;
      const shareMatcher = /(?:share|offering)[:\s]+([0-9]+\s*(?:seats|%|percent|passengers)|half|all but one|all except one)/i;
      
      const departureMatch = text.match(departureMatcher);
      const arrivalMatch = text.match(arrivalMatcher);
      const dateMatch = text.match(dateMatcher);
      const jetMatch = text.match(jetMatcher);
      const costMatch = text.match(costMatcher);
      const shareMatch = text.match(shareMatcher);
      
      if (departureMatch && arrivalMatch && dateMatch && costMatch) {
        return {
          name: "CreateJetShareOffer",
          arguments: {
            departure: departureMatch[1].trim(),
            arrival: arrivalMatch[1].trim(),
            flight_date: dateMatch[1].trim(),
            jet_type: jetMatch ? jetMatch[1].trim() : "Not specified",
            total_cost: parseInt(costMatch[1].replace(/,/g, '')),
            share_amount: shareMatch ? shareMatch[1].trim() : "Not specified"
          }
        };
      }
    }
    
    // Check for find JetShare offers intent
    if (text.includes("I'll search for JetShare offers") || 
        text.includes("Let me find flights for you") ||
        text.includes("Here are the JetShare offers")) {
      
      const locationMatcher = /(?:to|from|in)[:\s]+([A-Za-z\s,]+?)(?:on|between|for|within|\.|,|\n)/i;
      const dateRangeMatcher = /(?:on|between|during)[:\s]+([A-Za-z0-9\s,\-]+?)(?:for|price|\.|,|\n)/i;
      const priceRangeMatcher = /(?:for|price|under|cost)[:\s]+\$?([0-9,\s\-]+)/i;
      
      const locationMatch = text.match(locationMatcher);
      const dateRangeMatch = text.match(dateRangeMatcher);
      const priceRangeMatch = text.match(priceRangeMatcher);
      
      if (locationMatch) {
        return {
          name: "FindJetShareOffer",
          arguments: {
            desired_location: locationMatch[1].trim(),
            date_range: dateRangeMatch ? dateRangeMatch[1].trim() : "",
            price_range: priceRangeMatch ? priceRangeMatch[1].trim() : ""
          }
        };
      }
    }
    
    // Check for schedule notification intent
    if (text.includes("I'll remind you") || 
        text.includes("I've scheduled a reminder") || 
        text.includes("I'll notify you")) {
      
      const timeMatcher = /(?:on|at)[:\s]+([A-Za-z0-9\s,\-]+?)(?:about|to|\.|,|\n)/i;
      const contentMatcher = /(?:about|to)[:\s]+([A-Za-z0-9\s,\-]+?)(?:\.|\n|$)/i;
      
      const timeMatch = text.match(timeMatcher);
      const contentMatch = text.match(contentMatcher);
      
      if (timeMatch && contentMatch) {
        return {
          name: "ScheduleNotification",
          arguments: {
            notification_time: timeMatch[1].trim(),
            message_content: contentMatch[1].trim()
          }
        };
      }
    }
    
    return null;
  };

  // Handle function call execution
  const handleFunctionCall = async (functionCall: { name: string; arguments: any }) => {
    if (!user) return;
    
    try {
      const { name, arguments: args } = functionCall;
      
      // Add user_id to all function calls
      const paramsWithUser = {
        ...args,
        user_id: user.id
      };
      
      let endpoint = '';
      let functionResult = null;
      
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
      
      functionResult = await response.json();
      
      // Add function result to messages
      const functionResultMessage: Message = {
        role: 'function',
        name,
        content: JSON.stringify(functionResult),
      };
      
      // Add the result message and update the UI
      setMessages(prev => [...prev, functionResultMessage]);
      
      // Save the updated conversation
      const updatedMessages = [...messages, functionResultMessage];
      const interactionType = isVoiceMode 
        ? (audioBlob ? 'multimodal' : 'voice')
        : 'text';
      
      saveConversation(updatedMessages, interactionType);
      
      // Get AI response to function result
      const aiResponse = await fetch('/api/concierge/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          userId: user.id,
          interactionType
        }),
      });
      
      if (!aiResponse.body) {
        throw new Error('No response body from AI');
      }
      
      const reader = aiResponse.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantResponse = '';
      
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
              } else if (jsonData.type === 'complete') {
                setStreamingResponse('');
                
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: jsonData.content
                };
                
                const newMessages: Message[] = [
                  ...updatedMessages, 
                  assistantMessage
                ];
                
                setMessages(newMessages);
                setIsLoading(false);
                
                // Save the final conversation with the assistant response
                saveConversation(newMessages, interactionType);
                
                // Play audio response if in voice mode
                if (isVoiceMode) {
                  playResponseAudio(jsonData.content);
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
    } catch (error) {
      console.error(`Error executing function ${functionCall.name}:`, error);
      
      // Add error result to messages
      const errorMessage: Message = {
        role: 'function',
        name: functionCall.name,
        content: JSON.stringify({ error: 'Function execution failed' }),
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
    
    // Determine interaction type
    const interactionType = isVoiceMode 
      ? (audioBlob ? 'multimodal' : 'voice')
      : 'text';
    
    // Save conversation with appropriate type
    saveConversation([...messages, userMessage], interactionType);
    
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
          interactionType
        }),
      });
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantResponse = '';
      
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
              } else if (jsonData.type === 'complete') {
                setStreamingResponse('');
                
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: jsonData.content
                };
                
                const newMessages: Message[] = [
                  ...messages, 
                  userMessage, 
                  assistantMessage
                ];
                
                setMessages(newMessages);
                setIsLoading(false);
                
                // Check if the assistant's response indicates a function should be called
                const functionCall = extractFunctionCall(jsonData.content);
                if (functionCall) {
                  await handleFunctionCall(functionCall);
                } else {
                  // Save the final conversation with the assistant response
                  saveConversation(newMessages, interactionType);
                  
                  // Play audio response if in voice mode
                  if (isVoiceMode) {
                    playResponseAudio(jsonData.content);
                  }
                }
              } else if (jsonData.type === 'error') {
                console.error('Error from server:', jsonData.error);
                setStreamingResponse('');
                
                const errorMessage: Message = { 
                  role: 'assistant', 
                  content: `Error: ${jsonData.error}` 
                };
                
                setMessages(prev => [...prev, userMessage, errorMessage]);
                setIsLoading(false);
                
                // Save the error conversation
                saveConversation([...messages, userMessage, errorMessage], interactionType);
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
      
      const errorMessage: Message = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      };
      
      setMessages(prev => [...prev, userMessage, errorMessage]);
      setIsLoading(false);
      
      // Save the error conversation
      saveConversation([...messages, userMessage, errorMessage], interactionType);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center sm:items-center" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white dark:bg-gray-800 w-full max-w-md sm:max-w-lg rounded-t-lg sm:rounded-lg shadow-xl flex flex-col max-h-[80vh] sm:max-h-[600px] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold">JetShare Concierge</h2>
                <button
                  onClick={toggleVoiceMode}
                  className={`ml-3 p-1 rounded-full ${isVoiceMode ? 'bg-blue-100 text-blue-500' : 'text-gray-500'}`}
                  title={isVoiceMode ? "Voice mode enabled" : "Enable voice mode"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                aria-label="Close"
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Chat messages */}
            <div 
              ref={chatContainerRef}
              className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" 
              style={{ overflowY: "auto", height: "calc(80vh - 120px)" }}
            >
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
              
              {/* Voice indicator */}
              {isRecording && (
                <div className="flex justify-center my-4">
                  <div className="px-4 py-2 bg-red-100 text-red-500 rounded-full flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                    Recording...
                  </div>
                </div>
              )}
              
              {isTranscribing && (
                <div className="flex justify-center my-4">
                  <div className="px-4 py-2 bg-blue-100 text-blue-500 rounded-full">
                    Transcribing...
                  </div>
                </div>
              )}
              
              {isPlaying && (
                <div className="flex justify-center my-4">
                  <div className="px-4 py-2 bg-green-100 text-green-500 rounded-full flex items-center">
                    <span className="mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    </span>
                    Playing...
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
                  disabled={isLoading || isRecording || isTranscribing}
                />
                
                {isVoiceMode && (
                  <button
                    type="button"
                    onClick={() => setIsRecording(!isRecording)}
                    disabled={isLoading || isTranscribing}
                    className={`p-2 rounded-lg focus:outline-none focus:ring-2 ${
                      isRecording
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Start recording'}
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
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </button>
                )}
                
                <button
                  type="submit"
                  className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isLoading || isRecording || isTranscribing || (!inputValue.trim() && !isVoiceMode)}
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
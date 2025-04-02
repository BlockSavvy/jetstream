'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/app/lib/ai/AIInferenceClient';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { enhanceWithDatabaseContext, formatDatabaseContext } from '@/app/lib/ai/databaseContext';

// Enhanced interface for flight data display
interface FlightData {
  id: string;
  departure: string;
  arrival: string;
  flight_date: string;
  jet_type: string;
  total_cost: number;
  share_amount: string;
  image_url?: string;
}

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
    name: "QueryDatabase",
    description: "Query the database for specific information needed to answer user questions",
    parameters: {
      type: "object",
      properties: {
        table_name: { 
          type: "string", 
          description: "The table to query (airports, flights, jets, jetshare_offers, amenities)" 
        },
        query_fields: { 
          type: "array", 
          description: "Fields to return",
          items: { type: "string" } 
        },
        filters: { 
          type: "object", 
          description: "Filter conditions for the query" 
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10, max: 50)"
        }
      },
      required: ["table_name"]
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
const SYSTEM_PROMPT = `
You are the AI Concierge for JetShare, a premier private jet sharing service. Your role is to assist users with precision and professionalism in creating flight sharing offers, finding flights, and managing their bookings.

**Key Responsibilities:**
- **Data Integrity:** You must ONLY reference real, verified data from our database. Do NOT fabricate or assume any details about flights, jets, airports, prices, amenities, or any other specific information related to our services.
- **Database Knowledge:** You have access to comprehensive airport, flight, and jet information. When you need specific data that's not in your current context, use the QueryDatabase function to retrieve it.
- **User Queries:** If the requested information is not available in the database, respond with "I don't see that information in our current database" to maintain transparency and avoid misinformation.

**Database Access Guidelines:**
- For questions about airports, use the airports table to look up codes, names, and locations
- For questions about available flights, use the flights table
- For questions about aircraft, use the jets table
- Always verify information with database queries before providing definitive answers

**Creating JetShare Offers:**
When a user wants to create a JetShare offer, you are to collect and confirm the following details:
- Departure location (city or airport)
- Arrival location (city or airport)
- Flight date and time
- Aircraft model (ensure it is available in our database)
- Total cost of the flight
- Share amount (percentage or number of seats)

Confirm all details back to the user with the message: "I'll create a JetShare offer with these details:" followed by a summary of the collected information in a clear and structured format.

**Finding Flights or JetShare Offers:**
When searching for flights or JetShare offers, gather:
- Desired location (destination or origin)
- Date range (if specified)
- Price range (if specified)

**General Inquiries:**
For questions not directly related to our database (such as weather, events, or dining recommendations), provide helpful and accurate general information.

**Communication Style:**
Maintain a professional, concise, and helpful demeanor. Offer specific suggestions and clear guidance to enhance user experience. Remember, JetShare enables users to offer seats on their private jets and book seats on others' jets, facilitating a unique sharing economy within private aviation.

**Ethical Guidelines:**
Always adhere to ethical communication practices, ensuring accuracy and reliability in every interaction. Avoid assumptions and ensure all provided information is backed by real data or clearly stated as general advice.
`;

// Define interface for confirmation card
interface ConfirmationCardDetail {
  label: string;
  value: string;
}

interface ConfirmationCard {
  title: string;
  description: string;
  details: ConfirmationCardDetail[];
  confirmButton: string;
  cancelButton: string;
}

interface FunctionCallWithCard {
  name: string;
  arguments: any;
  confirmationCard?: ConfirmationCard;
}

// Add FlightCard component for better flight visualization
const FlightCard = ({ flight }: { flight: FlightData }) => {
  return (
    <div className="my-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-3 max-w-[95%]">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-gray-100">{flight.departure} → {flight.arrival}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(flight.flight_date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(flight.total_cost)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{flight.jet_type}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">Sharing: {flight.share_amount}</p>
        </div>
      </div>
    </div>
  );
};

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
  const [pendingFunctionCall, setPendingFunctionCall] = useState<FunctionCallWithCard | null>(null);
  const [foundFlights, setFoundFlights] = useState<FlightData[]>([]);
  
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

  // Add welcome message when opening chat if no existing conversation
  useEffect(() => {
    if (isOpen && messages.length <= 1) {
      // Only system prompt exists, add welcome message
      const welcomeMessage: Message = {
        role: 'assistant',
        content: `Hello${user?.email ? ` ${user.email.split('@')[0]}` : ''}! I'm your JetShare concierge. How can I help you today?`
      };
      setMessages(prev => [...prev, welcomeMessage]);
    }
  }, [isOpen, messages, user]);

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

  // Cancel a pending function call
  const cancelFunctionCall = () => {
    setPendingFunctionCall(null);
  };

  // Confirm and execute a pending function call
  const confirmFunctionCall = async () => {
    if (!pendingFunctionCall) return;
    
    const functionCallToExecute = pendingFunctionCall;
    setPendingFunctionCall(null);
    
    await handleFunctionCall(functionCallToExecute);
  };

  // Enhanced function to fetch real flights from the database - improve with direct query
  const fetchRecentFlights = async () => {
    if (!user) return [];
    
    try {
      console.log('Fetching real flights from database...');
      // Use the direct API endpoint to get offers with status=open
      const response = await fetch('/api/jetshare/getOffers?status=open&viewMode=marketplace', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch flights');
      }
      
      const data = await response.json();
      console.log('Fetched real flight data - raw response:', data);
      
      if (!data.offers || data.offers.length === 0) {
        console.log('⚠️ No open flights found in the database');
        return [];
      }
      
      console.log('✅ Found', data.offers.length, 'open flights in the database');
      data.offers.forEach((flight: any, index: number) => {
        console.log(`Flight ${index + 1}:`, {
          id: flight.id,
          departure: flight.departure_location,
          arrival: flight.arrival_location,
          date: flight.flight_date,
          cost: flight.total_flight_cost,
          model: flight.aircraft_model,
        });
      });
      
      return data.offers || [];
    } catch (error) {
      console.error('Error fetching flights:', error);
      return [];
    }
  };

  // Enhanced function call handler with real database integration
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
      
      // First, fetch real flight data to ensure the AI has accurate information
      const recentFlights = await fetchRecentFlights();
      
      switch (name) {
        case 'QueryDatabase':
          // Use the specialized handler for database queries
          return await handleDatabaseQuery(functionCall);
          
        case 'FindJetShareOffer':
          endpoint = '/api/concierge/functions/find-jetshare-offer';
          
          // Pre-process the search query to match against actual flights
          const { desired_location, date_range, price_range } = args;
          
          // Fetch flights directly from database to ensure we have the latest data
          const flights = await fetchRecentFlights();
          console.log('Processing flights for search:', flights);
          
          // Filter flights based on search criteria
          const matchedFlights = flights.filter((flight: any) => {
            console.log('Checking flight:', flight);
            // Fix field name checks for consistency
            const departureField = flight.departure || flight.departure_location;
            const arrivalField = flight.arrival || flight.arrival_location;
            const flightDateField = flight.flight_date || flight.departure_date;
            const totalCostField = flight.total_cost || flight.total_flight_cost;
            
            const matchesLocation = 
              !desired_location || 
              (departureField?.toLowerCase().includes(desired_location.toLowerCase()) || 
               arrivalField?.toLowerCase().includes(desired_location.toLowerCase()));
            
            // Simple date range filtering - can be enhanced with proper date parsing
            const matchesDateRange = !date_range || 
              (flightDateField && new Date(flightDateField) >= new Date());
            
            // Simple price range filtering
            let matchesPrice = true;
            if (price_range) {
              const maxPrice = parseInt(price_range.replace(/[^0-9]/g, ''));
              if (!isNaN(maxPrice)) {
                matchesPrice = totalCostField <= maxPrice;
              }
            }
            
            console.log('Match results:', { 
              matchesLocation, 
              matchesDateRange, 
              matchesPrice 
            });
            
            return matchesLocation && matchesDateRange && matchesPrice;
          });
          
          console.log('Matched flights:', matchedFlights);
          
          // Store matched flights for display
          setFoundFlights(matchedFlights.map((flight: any) => {
            const departureField = flight.departure || flight.departure_location;
            const arrivalField = flight.arrival || flight.arrival_location;
            const flightDateField = flight.flight_date || flight.departure_date;
            const totalCostField = flight.total_cost || flight.total_flight_cost;
            const shareAmountField = flight.share_amount || 
              (flight.available_seats ? `${flight.available_seats} seats` : 'Not specified');
            const jetTypeField = flight.jet_type || flight.aircraft_model || 'Not specified';
            
            return {
              id: flight.id,
              departure: departureField,
              arrival: arrivalField,
              flight_date: flightDateField,
              jet_type: jetTypeField,
              total_cost: totalCostField,
              share_amount: shareAmountField
            };
          }));
          
          // Add the matched flights to the AI's response for reference
          paramsWithUser.matched_flights = matchedFlights;
          
          break;
          
        case 'CreateJetShareOffer':
          endpoint = '/api/concierge/functions/create-jetshare-offer';
          // Validate jet type against actual available options
          const validJetTypes = ['G600', 'G550', 'Citation X', 'Phenom 300', 'Legacy 600', 'G450'];
          if (paramsWithUser.jet_type && !validJetTypes.includes(paramsWithUser.jet_type)) {
            paramsWithUser.jet_type = validJetTypes.find(jet => 
              jet.toLowerCase().includes(paramsWithUser.jet_type.toLowerCase())
            ) || 'G550'; // Default if not found
          }
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
          interactionType,
          // Add recent flights data as context for the AI
          contextData: {
            recentFlights: recentFlights.slice(0, 5) // Limit to 5 for context size
          }
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

  // Extract function call details from assistant response
  const extractFunctionCall = (text: string): FunctionCallWithCard | null => {
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
        const departure = departureMatch[1].trim();
        const arrival = arrivalMatch[1].trim();
        const flightDate = dateMatch[1].trim();
        const jetType = jetMatch ? jetMatch[1].trim() : "Not specified";
        const totalCost = parseInt(costMatch[1].replace(/,/g, ''));
        const shareAmount = shareMatch ? shareMatch[1].trim() : "Not specified";
        
        // Format date for display
        let formattedDate: string;
        try {
          const date = new Date(flightDate);
          formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch (e) {
          formattedDate = flightDate;
        }
        
        return {
          name: "CreateJetShareOffer",
          arguments: {
            departure,
            arrival,
            flight_date: flightDate,
            jet_type: jetType,
            total_cost: totalCost,
            share_amount: shareAmount
          },
          confirmationCard: {
            title: "Create JetShare Offer",
            description: `From ${departure} to ${arrival} on ${formattedDate}`,
            details: [
              { label: "Aircraft", value: jetType },
              { label: "Total Cost", value: `$${totalCost.toLocaleString()}` },
              { label: "Sharing", value: shareAmount }
            ],
            confirmButton: "Publish Offer",
            cancelButton: "Cancel"
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
        const location = locationMatch[1].trim();
        const dateRange = dateRangeMatch ? dateRangeMatch[1].trim() : "";
        const priceRange = priceRangeMatch ? priceRangeMatch[1].trim() : "";
        
        return {
          name: "FindJetShareOffer",
          arguments: {
            desired_location: location,
            date_range: dateRange,
            price_range: priceRange
          },
          confirmationCard: {
            title: "Find JetShare Offers",
            description: `Search for flights${location ? ` to ${location}` : ''}`,
            details: [
              { label: "Location", value: location || "Any" },
              { label: "Dates", value: dateRange || "Anytime" },
              { label: "Price Range", value: priceRange ? `$${priceRange}` : "Any" }
            ],
            confirmButton: "Search Now",
            cancelButton: "Cancel"
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
        const time = timeMatch[1].trim();
        const content = contentMatch[1].trim();
        
        return {
          name: "ScheduleNotification",
          arguments: {
            notification_time: time,
            message_content: content
          },
          confirmationCard: {
            title: "Schedule Reminder",
            description: `Set a reminder for ${time}`,
            details: [
              { label: "When", value: time },
              { label: "About", value: content }
            ],
            confirmButton: "Set Reminder",
            cancelButton: "Cancel"
          }
        };
      }
    }
    
    return null;
  };

  // Enhanced send message function with additional context
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
    
    // Retrieve database context based on user query
    let databaseContext = '';
    try {
      databaseContext = await enhanceWithDatabaseContext(textToSend);
    } catch (error) {
      console.error('Error enhancing with database context:', error);
    }
    
    // Only add context message if we retrieved something useful
    const messageList = [...messages];
    if (databaseContext) {
      const contextMessage: Message = {
        role: 'system',
        content: formatDatabaseContext(databaseContext)
      };
      messageList.push(contextMessage);
    }
    
    messageList.push(userMessage);
    
    // Determine interaction type
    const interactionType = isVoiceMode 
      ? (audioBlob ? 'multimodal' : 'voice')
      : 'text';
    
    // Save conversation with appropriate type
    saveConversation(messageList, interactionType);
    
    // Gather user context if available
    let contextData: any = {};
    if (user) {
      // Fetch real flight data to provide context
      const recentFlights = await fetchRecentFlights();
      console.log("AVAILABLE FLIGHTS FOR AI CONTEXT:", recentFlights);
      
      // If no flights are found, add specific instruction to the AI
      const flightContextNote = recentFlights.length > 0 
        ? `Current available flights: ${recentFlights.length}` 
        : "IMPORTANT: There are currently NO available flights in the system. Do not make up any flights in your responses.";
      
      contextData = {
        userId: user.id,
        email: user.email,
        recentFlights: recentFlights.slice(0, 5), // Limit to 5 for context size
        flightContextNote: flightContextNote,
        databaseContext: databaseContext // Add database context to AI context
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
          messages: messageList,
          userId: user?.id,
          contextData,
          interactionType,
          functions: FUNCTION_DEFINITIONS // Pass function definitions to enable function calling
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
                  // If we have a confirmation card, show it first instead of immediately executing
                  if (functionCall.confirmationCard) {
                    setPendingFunctionCall(functionCall);
                  } else {
                    await handleFunctionCall(functionCall);
                  }
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

  // Reset conversation
  const resetConversation = () => {
    console.log("Resetting conversation...");
    setMessages([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'assistant', content: `Hello${user?.email ? ` ${user.email.split('@')[0]}` : ''}! I'm your JetShare concierge. How can I help you today?` }
    ]);
    setFoundFlights([]);
    setPendingFunctionCall(null);
    setInputValue('');
    setStreamingResponse('');
    setIsLoading(false);
    
    // Save the reset conversation to persist it
    if (user) {
      saveConversation([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'assistant', content: `Hello${user?.email ? ` ${user.email.split('@')[0]}` : ''}! I'm your JetShare concierge. How can I help you today?` }
      ], 'text');
    }
  };

  // Suggested message chips
  const suggestedMessages = [
    { text: "Create JetShare offer", action: () => setInputValue("I want to create a JetShare offer") },
    { text: "Find flights", action: () => setInputValue("Find flights to New York") },
    { text: "Set a reminder", action: () => setInputValue("Remind me to check flights tomorrow") }
  ];

  // Add a function to handle QueryDatabase function calls
  const handleDatabaseQuery = async (functionCall: { name: string; arguments: any }) => {
    if (!user) return;
    
    try {
      const { table_name, query_fields, filters, limit } = functionCall.arguments;
      
      // Call the database query API endpoint
      const response = await fetch('/api/concierge/functions/query-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table_name,
          query_fields,
          filters,
          limit
        }),
      });
      
      const result = await response.json();
      
      // Add function result to messages
      const functionResultMessage: Message = {
        role: 'function',
        name: 'QueryDatabase',
        content: JSON.stringify(result),
      };
      
      setMessages(prev => [...prev, functionResultMessage]);
      
      // Continue with existing code to get AI response to the function result
      // ...
      
      return result;
    } catch (error) {
      console.error('Error executing QueryDatabase function:', error);
      
      // Add error result to messages
      const errorMessage: Message = {
        role: 'function',
        name: 'QueryDatabase',
        content: JSON.stringify({ error: 'Database query failed' }),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return { error: 'Database query failed' };
    }
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
                <button
                  onClick={resetConversation}
                  className="ml-3 p-1 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-100"
                  title="Reset conversation"
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
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
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
              style={{ overflowY: "auto", height: "calc(80vh - 180px)" }}
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
              
              {/* Display flight cards when flights are found */}
              {foundFlights.length > 0 && (
                <div className="w-full space-y-2 my-4 border-t pt-3 border-b pb-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Found {foundFlights.length} matching flights:</p>
                  {foundFlights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))}
                </div>
              )}
              
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
              
              {/* Function call confirmation card */}
              {pendingFunctionCall && pendingFunctionCall.confirmationCard && (
                <div className="mx-auto my-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm p-4 max-w-[95%]">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{pendingFunctionCall.confirmationCard.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">{pendingFunctionCall.confirmationCard.description}</p>
                  <div className="space-y-2 mb-4">
                    {pendingFunctionCall.confirmationCard.details.map((detail: {label: string; value: string}, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{detail.label}:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={cancelFunctionCall}
                      className="px-3 py-1 text-xs border dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {pendingFunctionCall.confirmationCard.cancelButton}
                    </button>
                    <button 
                      onClick={confirmFunctionCall}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {pendingFunctionCall.confirmationCard.confirmButton}
                    </button>
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

            {/* Suggestion chips */}
            <div className="px-4 py-2 border-t flex flex-wrap gap-2">
              {suggestedMessages.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={suggestion.action}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {suggestion.text}
                </button>
              ))}
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
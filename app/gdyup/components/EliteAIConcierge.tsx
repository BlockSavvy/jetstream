'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  MessageSquareText,
  Wallet,
  Plane,
  CreditCard,
  Bitcoin,
  Radio,
  Users,
  Clock,
  X,
  Volume2,
  VolumeX,
  Bot,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemedIcon } from './core/ThemedIcon';

interface ConciergeMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ConciergeAction[];
}

interface ConciergeAction {
  id: string;
  label: string;
  type: 'navigation' | 'wallet' | 'payment' | 'flight';
  action: () => void;
}

interface EliteAIConciergeProp {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'chat' | 'voice' | 'prompts';
}

const SMART_PROMPTS = [
  {
    id: 'wallet-setup',
    icon: Wallet,
    title: 'Setup Bitcoin Wallet',
    description: 'Configure your wallet to receive payments',
    prompt: 'Help me set up my Bitcoin wallet and lightning address for receiving payments from jet share bookings.'
  },
  {
    id: 'list-flight',
    icon: Plane,
    title: 'List My Flight',
    description: 'Get help listing your empty seats',
    prompt: 'I want to list empty seats on my private jet flight. Guide me through the process and help me set the right pricing.'
  },
  {
    id: 'payment-methods',
    icon: CreditCard,
    title: 'Payment Options',
    description: 'Learn about payment methods',
    prompt: 'What payment methods does GDY·UP accept? How do Bitcoin and credit card payments work for both buyers and sellers?'
  },
  {
    id: 'nostr-identity',
    icon: Radio,
    title: 'Nostr Identity',
    description: 'Set up decentralized identity',
    prompt: 'Explain Nostr identity verification and help me set up my decentralized ID for enhanced security and privacy.'
  },
  {
    id: 'find-flights',
    icon: Users,
    title: 'Find Flights',
    description: 'Browse available private jets',
    prompt: 'Help me find available private jet seats for my travel dates. What should I look for and how does the booking process work?'
  },
  {
    id: 'pricing-guide',
    icon: Bitcoin,
    title: 'Pricing Strategy',
    description: 'Optimize your listing prices',
    prompt: 'What\'s the best pricing strategy for my jet share listings? How can I maximize bookings while recovering my costs?'
  }
];

export default function EliteAIConcierge({ isOpen, onClose, initialMode = 'chat' }: EliteAIConciergeProp) {
  const [mode, setMode] = useState<'chat' | 'voice' | 'prompts'>(initialMode);
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { getThemedTextClasses, getThemedButtonClasses } = useGdyupTheme();
  const { user } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognition = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      speechRecognition.current = new (window as any).webkitSpeechRecognition();
      speechRecognition.current.continuous = false;
      speechRecognition.current.interimResults = false;
      speechRecognition.current.lang = 'en-US';
      
      speechRecognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      
      speechRecognition.current.onerror = () => {
        setIsListening(false);
      };
    }

    // Add welcome message
    if (messages.length === 0) {
      const welcomeMessage: ConciergeMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Welcome to GDY·UP! I'm your AI concierge. I can help you with wallet setup, listing flights, payment processing, and everything else you need for private jet cost sharing. How can I assist you today?`,
        timestamp: new Date(),
        actions: [
          {
            id: 'setup-wallet',
            label: 'Setup Wallet',
            type: 'wallet',
            action: () => router.push('/gdyup/dashboard')
          },
          {
            id: 'list-flight',
            label: 'List Flight',
            type: 'navigation',
            action: () => router.push('/gdyup/list')
          }
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    if (speechRecognition.current && !isListening) {
      setIsListening(true);
      speechRecognition.current.start();
    }
  };

  const stopListening = () => {
    if (speechRecognition.current && isListening) {
      setIsListening(false);
      speechRecognition.current.stop();
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    const userMessage: ConciergeMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual API call)
      setTimeout(() => {
        const assistantMessage: ConciergeMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: generateResponse(content),
          timestamp: new Date(),
          actions: generateActions(content)
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        
        if (mode === 'voice') {
          speakMessage(assistantMessage.content);
        }
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('wallet') || input.includes('bitcoin') || input.includes('payment')) {
      return `Great! Let me help you set up your wallet. You'll need to configure both a Bitcoin address for receiving Bitcoin payments and a Lightning address for instant micropayments. I can guide you through the dashboard where you can enter these details securely.`;
    }
    
    if (input.includes('list') || input.includes('flight') || input.includes('seat')) {
      return `I'll help you list your flight! You'll need your flight details, aircraft information, number of available seats, and pricing. The process takes about 2 minutes and you can start receiving bookings immediately.`;
    }
    
    if (input.includes('find') || input.includes('browse') || input.includes('book')) {
      return `I can help you find the perfect private jet seats! Browse available flights by date, route, and aircraft type. All listings show real-time availability and transparent pricing.`;
    }
    
    if (input.includes('nostr') || input.includes('identity')) {
      return `Nostr is a decentralized protocol for identity verification. It provides enhanced privacy and security for your GDY·UP profile. I can help you set up your Nostr identity in the wallet section.`;
    }
    
    return `I understand you're asking about "${userInput}". As your GDY·UP concierge, I can help with wallet setup, flight listings, payment processing, Nostr identity, and finding flights. What specific aspect would you like to explore?`;
  };

  const generateActions = (userInput: string): ConciergeAction[] => {
    const input = userInput.toLowerCase();
    const actions: ConciergeAction[] = [];
    
    if (input.includes('wallet') || input.includes('bitcoin')) {
      actions.push({
        id: 'go-to-wallet',
        label: 'Setup Wallet',
        type: 'wallet',
        action: () => {
          router.push('/gdyup/dashboard');
          onClose();
        }
      });
    }
    
    if (input.includes('list') || input.includes('flight')) {
      actions.push({
        id: 'list-flight',
        label: 'List Flight',
        type: 'navigation',
        action: () => {
          router.push('/gdyup/list');
          onClose();
        }
      });
    }
    
    if (input.includes('find') || input.includes('browse')) {
      actions.push({
        id: 'browse-flights',
        label: 'Browse Flights',
        type: 'navigation',
        action: () => {
          router.push('/gdyup/browse');
          onClose();
        }
      });
    }
    
    return actions;
  };

  const handlePromptClick = (prompt: typeof SMART_PROMPTS[0]) => {
    setMode('chat');
    sendMessage(prompt.prompt);
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Concierge Panel */}
      <motion.div
        className="relative w-full max-w-lg mx-4 mb-4 max-h-[80vh] bg-gdyup-bg-dark/95 backdrop-blur-xl border border-gdyup-border rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gdyup-border bg-gradient-to-r from-gdyup-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gdyup-primary/20">
              <Bot className="h-5 w-5 text-gdyup-primary" />
            </div>
            <div>
              <h2 className={cn("font-semibold", getThemedTextClasses())}>
                AI Concierge
              </h2>
              <p className={cn("text-xs", getThemedTextClasses('muted'))}>
                Your GDY·UP assistant
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex bg-gdyup-bg-dark rounded-lg p-1">
              <Button
                size="sm"
                variant={mode === 'chat' ? 'default' : 'ghost'}
                onClick={() => setMode('chat')}
                className="h-7 px-2"
              >
                <MessageSquareText className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant={mode === 'voice' ? 'default' : 'ghost'}
                onClick={() => setMode('voice')}
                className="h-7 px-2"
              >
                <Mic className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant={mode === 'prompts' ? 'default' : 'ghost'}
                onClick={() => setMode('prompts')}
                className="h-7 px-2"
              >
                <Zap className="h-3 w-3" />
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col h-96">
          {mode === 'prompts' ? (
            /* Smart Prompts */
            <div className="p-4 space-y-3 overflow-y-auto">
              <h3 className={cn("font-medium mb-3", getThemedTextClasses())}>
                Quick Help Topics
              </h3>
              <div className="grid gap-2">
                {SMART_PROMPTS.map((prompt) => (
                  <Card
                    key={prompt.id}
                    className="border-gdyup-border bg-gdyup-bg-dark/50 hover:bg-gdyup-bg-dark/80 cursor-pointer transition-all"
                    onClick={() => handlePromptClick(prompt)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <ThemedIcon icon={prompt.icon} className="h-5 w-5 text-gdyup-primary" />
                        <div className="flex-1">
                          <h4 className={cn("font-medium text-sm", getThemedTextClasses())}>
                            {prompt.title}
                          </h4>
                          <p className={cn("text-xs", getThemedTextClasses('muted'))}>
                            {prompt.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        message.type === 'user'
                          ? "bg-gdyup-primary text-black"
                          : "bg-gdyup-bg-dark border border-gdyup-border"
                      )}
                    >
                      <p className={cn(
                        "text-sm",
                        message.type === 'user' ? "text-black" : getThemedTextClasses()
                      )}>
                        {message.content}
                      </p>
                      
                      {/* Action Buttons */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.actions.map((action) => (
                            <Button
                              key={action.id}
                              size="sm"
                              variant="outline"
                              onClick={action.action}
                              className="h-7 text-xs border-gdyup-border"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gdyup-bg-dark border border-gdyup-border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin">
                          <Sparkles className="h-4 w-4 text-gdyup-primary" />
                        </div>
                        <span className={cn("text-sm", getThemedTextClasses('muted'))}>
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gdyup-border bg-gdyup-bg-dark/50">
                <div className="flex items-center gap-2">
                  {mode === 'voice' && (
                    <Button
                      size="sm"
                      variant={isListening ? 'default' : 'outline'}
                      onClick={isListening ? stopListening : startListening}
                      className="h-9 px-3"
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                  
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={mode === 'voice' ? "Speak or type your message..." : "Ask me anything about GDY·UP..."}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(inputValue);
                      }
                    }}
                    className="flex-1 bg-gdyup-bg-dark border-gdyup-border"
                  />
                  
                  <Button
                    size="sm"
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                    className={cn("h-9 px-3", getThemedButtonClasses('primary'))}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  
                  {mode === 'voice' && isSpeaking && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={stopSpeaking}
                      className="h-9 px-3"
                    >
                      <VolumeX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
} 
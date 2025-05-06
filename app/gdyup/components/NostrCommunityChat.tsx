'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Loader2
} from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import NostrVerificationBadge from './NostrVerificationBadge';

interface Message {
  id: string;
  content: string;
  sender: {
    name: string;
    nip05?: string | null;
    pubkey?: string;
  };
  timestamp: Date;
}

interface NostrCommunityChatProps {
  flightId: string;
  flightName?: string;
  className?: string;
  initialCollapsed?: boolean;
}

export default function NostrCommunityChat({
  flightId,
  flightName = 'Flight Chat',
  className,
  initialCollapsed = true
}: NostrCommunityChatProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { getThemeClasses } = useGdyupTheme();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Simulate loading messages
  useEffect(() => {
    if (isCollapsed) return;
    
    const loadMessages = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, this would fetch messages from Nostr relays
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock data for demonstration
        const mockMessages: Message[] = [
          {
            id: '1',
            content: 'Looking forward to the flight tomorrow!',
            sender: {
              name: 'Alice',
              nip05: 'alice@example.com',
              pubkey: '1234'
            },
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
          },
          {
            id: '2',
            content: 'Does anyone know if there will be catering on board?',
            sender: {
              name: 'Bob',
              nip05: 'bob@example.com',
              pubkey: '5678'
            },
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
          },
          {
            id: '3',
            content: 'Yes, there will be a full meal service with drinks.',
            sender: {
              name: 'Pilot',
              nip05: 'pilot@gdyup.com',
              pubkey: '9012'
            },
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
          }
        ];
        
        setMessages(mockMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load chat messages');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [isCollapsed]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isCollapsed && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCollapsed]);
  
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    
    setIsSending(true);
    
    try {
      // In a real implementation, this would send a message via Nostr
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Add the new message to the list
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: {
          name: user.user_metadata?.full_name || 'You',
          nip05: user.user_metadata?.nip05 || null,
          pubkey: user.user_metadata?.pubkey || undefined
        },
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className={cn(
      getThemeClasses({
        base: "border rounded-lg overflow-hidden",
        default: "bg-black/20 border-gray-800",
        blue: "bg-blue-950/20 border-blue-900",
        pink: "bg-pink-950/20 border-pink-900"
      }),
      className
    )}>
      <div 
        className={getThemeClasses({
          base: "p-3 flex items-center justify-between cursor-pointer",
          default: "bg-black/40 hover:bg-black/60",
          blue: "bg-blue-950/40 hover:bg-blue-950/60",
          pink: "bg-pink-950/40 hover:bg-pink-950/60"
        })}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <h3 className={getThemeClasses({
            base: "font-medium",
            default: "text-white",
            blue: "text-blue-100",
            pink: "text-pink-100"
          })}>
            {flightName} Community
          </h3>
          {!isCollapsed && messages.length > 0 && (
            <span className={getThemeClasses({
              base: "text-xs rounded-full px-2 py-0.5",
              default: "bg-gray-800 text-gray-300",
              blue: "bg-blue-900 text-blue-300",
              pink: "bg-pink-900 text-pink-300"
            })}>
              {messages.length}
            </span>
          )}
        </div>
        
        <div>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={getThemeClasses({
              base: "h-64 overflow-y-auto p-3 space-y-3",
              default: "bg-black/10",
              blue: "bg-blue-950/10",
              pink: "bg-pink-950/10"
            })}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageSquare className={getThemeClasses({
                    base: "h-10 w-10 mb-2 opacity-30",
                    default: "text-gray-600",
                    blue: "text-blue-700",
                    pink: "text-pink-700"
                  })} />
                  <p className={getThemeClasses({
                    base: "text-sm",
                    default: "text-gray-500",
                    blue: "text-blue-400",
                    pink: "text-pink-400"
                  })}>
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={cn(
                        "p-2 rounded-lg",
                        getThemeClasses({
                          base: "",
                          default: msg.sender.nip05?.includes('gdyup.com') 
                            ? "bg-amber-950/20 border border-amber-900/30" 
                            : "bg-gray-900/40 border border-gray-800/30",
                          blue: msg.sender.nip05?.includes('gdyup.com')
                            ? "bg-amber-950/20 border border-amber-900/30"
                            : "bg-blue-900/40 border border-blue-800/30",
                          pink: msg.sender.nip05?.includes('gdyup.com')
                            ? "bg-amber-950/20 border border-amber-900/30"
                            : "bg-pink-900/40 border border-pink-800/30"
                        })
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1">
                          <span className={getThemeClasses({
                            base: "font-medium text-sm",
                            default: msg.sender.nip05?.includes('gdyup.com') ? "text-amber-400" : "text-white",
                            blue: msg.sender.nip05?.includes('gdyup.com') ? "text-amber-400" : "text-blue-100",
                            pink: msg.sender.nip05?.includes('gdyup.com') ? "text-amber-400" : "text-pink-100"
                          })}>
                            {msg.sender.name}
                          </span>
                          {msg.sender.nip05 && (
                            <NostrVerificationBadge 
                              nip05={msg.sender.nip05}
                              isVerified={true}
                              size="sm"
                              showTooltip={false}
                            />
                          )}
                        </div>
                        <span className={getThemeClasses({
                          base: "text-xs flex items-center",
                          default: "text-gray-500",
                          blue: "text-blue-400",
                          pink: "text-pink-400"
                        })}>
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(msg.timestamp), 'h:mm a')}
                        </span>
                      </div>
                      <p className={getThemeClasses({
                        base: "text-sm",
                        default: "text-gray-300",
                        blue: "text-blue-200",
                        pink: "text-pink-200"
                      })}>
                        {msg.content}
                      </p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            <div className={getThemeClasses({
              base: "p-3 flex gap-2",
              default: "bg-black/30 border-t border-gray-800",
              blue: "bg-blue-950/30 border-t border-blue-900",
              pink: "bg-pink-950/30 border-t border-pink-900"
            })}>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={!user || isSending}
                className={getThemeClasses({
                  base: "text-sm",
                  default: "bg-black/30 border-gray-700 text-white",
                  blue: "bg-blue-900/30 border-blue-800 text-blue-100",
                  pink: "bg-pink-900/30 border-pink-800 text-pink-100"
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                size="icon"
                disabled={!message.trim() || !user || isSending}
                onClick={handleSendMessage}
                className={getThemeClasses({
                  base: "",
                  default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                  blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
                  pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
                })}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
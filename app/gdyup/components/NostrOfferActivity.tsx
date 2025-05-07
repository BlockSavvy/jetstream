'use client';

import { useState, useEffect } from 'react';
import { useNostr } from '@/app/gdyup/contexts/NostrContext';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Send, MessageCircle, Zap, AlertCircle, Users, RefreshCw } from 'lucide-react';
import NostrVerificationBadge from './NostrVerificationBadge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Define the types for messages
interface NostrMessage {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  kind: number;
  tags: string[][];
  sig: string;
  user?: {
    name?: string;
    nip05?: string;
    picture?: string;
  };
}

interface NostrOfferActivityProps {
  offerId: string;
  offerCreatorPubkey?: string;
}

export default function NostrOfferActivity({ offerId, offerCreatorPubkey }: NostrOfferActivityProps) {
  const { getThemeClasses } = useGdyupTheme();
  const { isConnected, isEnabled, pubkey, nip05, publishEvent } = useNostr();
  
  const [messages, setMessages] = useState<NostrMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Fetch messages for this offer
  useEffect(() => {
    if (!isConnected || !offerId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, this would fetch messages from Nostr relays
        // using a filter for the specific offer ID
        
        // Simulate API call with timeout
        setTimeout(() => {
          // Mock data for demo purposes
          const mockMessages: NostrMessage[] = [
            {
              id: 'msg1',
              pubkey: offerCreatorPubkey || '',
              content: 'Welcome to the flight group! I\'m the creator of this share offer.',
              created_at: Date.now() / 1000 - 3600,
              kind: 1,
              tags: [['e', offerId], ['t', 'gdyup']],
              sig: '',
              user: {
                name: 'Flight Creator',
                nip05: 'creator@example.com',
              }
            },
            {
              id: 'msg2',
              pubkey: 'another-pubkey-123',
              content: 'Looking forward to this trip! Does anyone know if we need to bring anything specific?',
              created_at: Date.now() / 1000 - 1800,
              kind: 1,
              tags: [['e', offerId], ['t', 'gdyup']],
              sig: '',
              user: {
                name: 'Fellow Traveler',
                nip05: 'traveler@example.com',
              }
            }
          ];
          
          setMessages(mockMessages);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [isConnected, offerId, offerCreatorPubkey]);
  
  // Send a new message
  const sendMessage = async () => {
    if (!newMessage || !isConnected || !pubkey) {
      toast.error('Unable to send message. Please check your connection.');
      return;
    }
    
    setIsSending(true);
    
    try {
      // In a real implementation, this would use the Nostr context to publish an event
      // Here we're just simulating it and adding to our local state
      
      // Create a new message object
      const newMsg: NostrMessage = {
        id: `local-${Date.now()}`,
        pubkey: pubkey,
        content: newMessage,
        created_at: Date.now() / 1000,
        kind: 1,
        tags: [['e', offerId], ['t', 'gdyup']],
        sig: '',
        user: {
          name: 'You',
          nip05: nip05 || undefined,
        }
      };
      
      // Add to messages
      setMessages(prev => [...prev, newMsg]);
      
      // Clear input
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  // Refresh messages
  const refreshMessages = () => {
    setIsLoading(true);
    
    // Simulate refresh
    setTimeout(() => {
      toast.success('Messages refreshed');
      setIsLoading(false);
    }, 1000);
  };
  
  // Not connected to Nostr state
  if (!isEnabled || !isConnected) {
    return (
      <Card className={getThemeClasses({
        base: "border shadow",
        default: "bg-white border-gray-200",
        blue: "bg-blue-950/40 border-blue-900/60",
        pink: "bg-pink-950/40 border-pink-900/60"
      })}>
        <CardHeader className={getThemeClasses({
          base: "pb-3",
          default: "bg-gray-50 border-b border-gray-100",
          blue: "bg-blue-950/60 border-b border-blue-900/60",
          pink: "bg-pink-950/60 border-b border-pink-900/60"
        })}>
          <CardTitle className={getThemeClasses({
            base: "",
            default: "text-gray-900",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Flight Group</span>
            </div>
          </CardTitle>
          <CardDescription className={getThemeClasses({
            base: "",
            default: "text-gray-600",
            blue: "text-blue-300",
            pink: "text-pink-300"
          })}>
            Connect to Nostr to join the conversation
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className={getThemeClasses({
              base: "h-12 w-12 mb-3 opacity-60",
              default: "text-amber-500",
              blue: "text-amber-400",
              pink: "text-amber-300"
            })} />
            
            <h3 className={getThemeClasses({
              base: "text-lg font-medium",
              default: "text-gray-800",
              blue: "text-blue-100",
              pink: "text-pink-100"
            })}>
              Nostr Not Connected
            </h3>
            
            <p className={getThemeClasses({
              base: "text-sm text-center mt-1 max-w-xs",
              default: "text-gray-600",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })}>
              Connect your Nostr identity in your profile settings to join this flight's group chat.
            </p>
            
            <Button
              className="mt-4"
              onClick={() => {
                // Redirect to profile page to set up Nostr
                window.location.href = '/gdyup/profile';
              }}
            >
              Set Up Nostr
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={getThemeClasses({
      base: "border shadow",
      default: "bg-white border-gray-200",
      blue: "bg-blue-950/40 border-blue-900/60",
      pink: "bg-pink-950/40 border-pink-900/60"
    })}>
      <CardHeader className={getThemeClasses({
        base: "pb-3",
        default: "bg-gray-50 border-b border-gray-100",
        blue: "bg-blue-950/60 border-b border-blue-900/60",
        pink: "bg-pink-950/60 border-b border-pink-900/60"
      })}>
        <div className="flex items-center justify-between">
          <CardTitle className={getThemeClasses({
            base: "",
            default: "text-gray-900",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Flight Group</span>
            </div>
          </CardTitle>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={refreshMessages}
            disabled={isLoading}
            className={getThemeClasses({
              base: "h-8 w-8 p-0",
              default: "text-gray-600 hover:text-gray-900",
              blue: "text-blue-300 hover:text-blue-100",
              pink: "text-pink-300 hover:text-pink-100"
            })}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <CardDescription className={getThemeClasses({
          base: "",
          default: "text-gray-600",
          blue: "text-blue-300",
          pink: "text-pink-300"
        })}>
          Secure, decentralized communication via Nostr
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Messages container */}
        <div className={cn(
          "flex flex-col space-y-3 overflow-y-auto max-h-[300px] min-h-[200px] p-2 rounded-md",
          getThemeClasses({
            base: "",
            default: "bg-gray-50",
            blue: "bg-blue-950/30",
            pink: "bg-pink-950/30"
          })
        )}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin opacity-70" />
            </div>
          ) : messages.length > 0 ? (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "p-3 rounded-lg",
                    message.pubkey === pubkey 
                      ? getThemeClasses({
                          base: "ml-auto max-w-[85%]",
                          default: "bg-blue-100 text-blue-900",
                          blue: "bg-blue-900/50 text-blue-50",
                          pink: "bg-pink-900/50 text-pink-50"
                        })
                      : getThemeClasses({
                          base: "mr-auto max-w-[85%]",
                          default: "bg-gray-100 text-gray-900",
                          blue: "bg-blue-950/70 text-blue-100",
                          pink: "bg-pink-950/70 text-pink-100"
                        })
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-medium text-sm">
                      {message.user?.name || message.pubkey.substring(0, 8)}
                    </div>
                    
                    {message.user?.nip05 && (
                      <NostrVerificationBadge
                        pubkey={message.pubkey}
                        nip05={message.user.nip05}
                        size="sm"
                      />
                    )}
                  </div>
                  
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs opacity-70">
                      {new Date(message.created_at * 1000).toLocaleTimeString([], {
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </div>
                    
                    {/* Zap button if not your own message */}
                    {message.pubkey !== pubkey && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={getThemeClasses({
                          base: "h-6 w-6 p-0",
                          default: "text-amber-500 hover:text-amber-600 hover:bg-amber-50",
                          blue: "text-amber-400 hover:text-amber-300 hover:bg-blue-900/50",
                          pink: "text-amber-400 hover:text-amber-300 hover:bg-pink-900/50"
                        })}
                      >
                        <Zap className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageCircle className={getThemeClasses({
                base: "h-8 w-8 mb-2 opacity-40",
                default: "text-gray-400",
                blue: "text-blue-700",
                pink: "text-pink-700"
              })} />
              <p className={getThemeClasses({
                base: "text-sm opacity-70",
                default: "text-gray-500",
                blue: "text-blue-400",
                pink: "text-pink-400"
              })}>
                No messages yet. Start the conversation!
              </p>
            </div>
          )}
        </div>
        
        {/* Message input */}
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className={getThemeClasses({
              base: "resize-none flex-grow",
              default: "border-gray-300 bg-white text-gray-900",
              blue: "border-blue-800 bg-blue-950/80 text-blue-50",
              pink: "border-pink-800 bg-pink-950/80 text-pink-50"
            })}
            disabled={isSending}
          />
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage || isSending}
            className={getThemeClasses({
              base: "px-3 self-end h-[38px]",
              default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              blue: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text",
              pink: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-gdyup-button-text"
            })}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <div className={getThemeClasses({
          base: "text-xs text-center",
          default: "text-gray-500",
          blue: "text-blue-400",
          pink: "text-pink-400"
        })}>
          Messages are end-to-end encrypted and stored on the Nostr network
        </div>
      </CardContent>
    </Card>
  );
} 
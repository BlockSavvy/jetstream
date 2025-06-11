'use client';

import { useState, useRef, useEffect } from 'react';
import { useFlightNostrGroup } from '@/app/gdyup/hooks/useFlightNostrGroup';
import { useNostr } from '@/app/gdyup/contexts/NostrContext';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  User,
  Users,
  UserPlus,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import NostrVerificationBadge from '@/app/gdyup/components/NostrVerificationBadge';
import NostrZapButton from '@/app/gdyup/components/NostrZapButton';
import { format } from 'date-fns';

interface FlightNostrGroupProps {
  offerId: string;
  flightTitle?: string;
  className?: string;
  initialCollapsed?: boolean;
}

export default function FlightNostrGroup({
  offerId,
  flightTitle = 'Flight Group',
  className,
  initialCollapsed = true
}: FlightNostrGroupProps) {
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  const { isConnected, pubkey } = useNostr();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [message, setMessage] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isJoined,
    isLoading,
    messages,
    participants,
    joinGroup,
    leaveGroup,
    sendMessage,
    sendZap,
    refreshData,
    isNostrReady,
    errorMessage
  } = useFlightNostrGroup(offerId);
  
  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    if (messagesEndRef.current && !isCollapsed) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCollapsed]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const success = await sendMessage(message);
    if (success) {
      setMessage('');
    }
  };
  
  // Handle invitation submission
  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }
    
    const success = await joinGroup();
    if (success) {
      // This would normally invite a user, but for now we'll just simulate it
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setIsInviteOpen(false);
    }
  };
  
  // Handle toggling the group collapsed state
  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Show loading state or error if not connected to Nostr
  if (!isNostrReady) {
    return (
      <Card className={cn(
        "border",
        getThemedBackgroundClasses('card'),
        "border-gdyup-border",
        className
      )}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", getThemedTextClasses())}>
            <Users className="h-5 w-5" />
            {flightTitle}
          </CardTitle>
          <CardDescription className={getThemedTextClasses('muted')}>
            Connect your Nostr identity to join this flight group
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className={cn(
            "h-10 w-10 mb-3 animate-spin opacity-60",
            getThemedTextClasses('muted')
          )} />
          <p className={cn("text-sm text-center max-w-xs", getThemedTextClasses('muted'))}>
            Please connect your Nostr identity in your profile settings to join this flight group.
          </p>
          <Button 
            className={cn("mt-4", getThemedButtonClasses('primary'))}
            onClick={() => window.location.href = '/gdyup/profile'}
          >
            Set Up Nostr
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border",
      getThemedBackgroundClasses('card'),
      "border-gdyup-border",
      className
    )}>
      <CardHeader className="px-4 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className={cn("flex items-center gap-2 text-base", getThemedTextClasses())}>
            <Users className="h-5 w-5" />
            {flightTitle}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            {!isJoined && !isLoading && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={joinGroup}
                className="border-gdyup-border hover:bg-gdyup-bg-dark"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Join
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCollapsed}
              className="h-8 w-8 text-gdyup-text-muted hover:text-gdyup-text"
            >
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {!isCollapsed && (
          <CardDescription className={getThemedTextClasses('muted')}>
            {isJoined ? 
              `${participants.length} participant${participants.length !== 1 ? 's' : ''} in this encrypted flight group`
              : 'Private Nostr group for flight participants'
            }
          </CardDescription>
        )}
      </CardHeader>
      
      {!isCollapsed && (
        <>
          <CardContent className={getThemedBackgroundClasses('card')}>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gdyup-text-muted" />
              </div>
            ) : !isJoined ? (
              <div className="py-8 text-center">
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3", getThemedBackgroundClasses('card'))}>
                  <Users className={cn("h-6 w-6", getThemedTextClasses('muted'))} />
                </div>
                <h3 className={cn("text-base font-medium mb-2", getThemedTextClasses())}>
                  Join the Flight Group
                </h3>
                <p className={cn("text-sm max-w-xs mx-auto mb-4", getThemedTextClasses('muted'))}>
                  Connect with fellow passengers and coordinate before your flight
                </p>
                <Button
                  variant="secondary"
                  onClick={joinGroup}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Group
                </Button>
              </div>
            ) : (
              <>
                {participants.length > 0 && (
                  <div className="mb-3 overflow-x-auto">
                    <div className="flex gap-3 py-2">
                      {participants.map((participant) => (
                        <div 
                          key={participant.pubkey} 
                          className="flex flex-col items-center min-w-[60px]"
                        >
                          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center relative", getThemedBackgroundClasses('card'))}>
                            <User className={cn("h-5 w-5", getThemedTextClasses('muted'))} />
                            {participant.pubkey === pubkey && (
                              <div className={cn("absolute -top-1 -right-1 h-4 w-4 rounded-full border-2", getThemedBackgroundClasses('card'))}></div>
                            )}
                          </div>
                          <div className={cn("text-xs mt-1 max-w-[80px] truncate text-center", getThemedTextClasses('muted'))}>
                            {participant.name || participant.pubkey.substring(0, 6)}
                          </div>
                          {participant.nip05 && (
                            <NostrVerificationBadge
                              pubkey={participant.pubkey}
                              nip05={participant.nip05}
                              size="sm"
                            />
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsInviteOpen(!isInviteOpen)}
                        className={cn("h-10 w-10 rounded-full bg-gdyup-bg-dark hover:bg-gdyup-bg-darker text-gdyup-text-muted")}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {isInviteOpen && (
                  <div className={cn("mb-4 p-3 rounded-md border flex items-center gap-2", getThemedBackgroundClasses('card'))}>
                    <Input
                      type="email"
                      placeholder="Invite by email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className={cn("flex-1 h-8 text-sm", getThemedBackgroundClasses('card'))}
                    />
                    <Button
                      size="sm"
                      onClick={handleInvite}
                      className="h-8"
                    >
                      Invite
                    </Button>
                  </div>
                )}
                
                <div className={cn("border rounded-md h-60 mb-3 overflow-y-auto", getThemedBackgroundClasses('card'))}>
                  <AnimatePresence>
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <MessageSquare className={cn("h-8 w-8 mb-2 opacity-40", getThemedTextClasses('muted'))} />
                        <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                              "p-2 rounded-md",
                              message.pubkey === pubkey ?
                                cn("ml-6", getThemedBackgroundClasses('card')) :
                                cn("mr-6", getThemedBackgroundClasses('card'))
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
                                {format(new Date(message.created_at * 1000), 'h:mm a')}
                              </div>
                              
                              {/* Zap button if not your own message */}
                              {message.pubkey !== pubkey && (
                                <NostrZapButton
                                  recipientPubkey={message.pubkey}
                                  recipientNip05={message.user?.nip05}
                                  size="sm"
                                  showAmount={false}
                                />
                              )}
                            </div>
                          </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={cn("min-h-10 text-sm resize-none", getThemedBackgroundClasses('card'))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="h-10 w-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className={cn("px-4 py-3 flex justify-between", getThemedBackgroundClasses('card'))}>
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open('https://nostr.com', '_blank')}
              className={cn("text-xs px-0", getThemedTextClasses('muted'))}
            >
              Powered by Nostr
            </Button>
            
            <div className="flex gap-2">
              {isJoined && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    className="h-8 w-8 p-0 border-gdyup-border hover:bg-gdyup-bg-dark"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={leaveGroup}
                    className="h-8 border-red-900/30 hover:bg-red-900/20 text-red-500"
                  >
                    Leave Group
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
} 
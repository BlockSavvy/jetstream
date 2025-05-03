'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Send, User, RefreshCw, X, Info } from 'lucide-react';
import { useNostr } from '@/components/nostr-provider';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NostrEvent, NostrEventKind } from '@/types/nostr';
import * as NostrUtils from '@/lib/services/nostr';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Contact {
  pubkey: string;
  npub: string;
  name?: string;
  lastMessage?: string;
  lastDate?: Date;
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  recipient: string;
  created_at: Date;
  isMine: boolean;
  decrypted: boolean;
}

export default function NostrMessagingTab() {
  const {
    isEnabled,
    hasExtension,
    isConnected,
    pubkey,
    connectExtension,
    signEvent,
    publishEvent,
    relays,
    addRelay,
    connectRelay,
    error: nostrError
  } = useNostr();
  
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactInput, setContactInput] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [relayConnections, setRelayConnections] = useState<Map<string, WebSocket>>(new Map());
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  // Connect to relays when component mounts or when relays change
  useEffect(() => {
    const connectToRelays = async () => {
      if (!isConnected || !isEnabled) return;
      
      // Connect to each relay
      const connections = new Map<string, WebSocket>();
      await Promise.all(relays.map(async (relay) => {
        try {
          const socket = NostrUtils.connectToRelay(relay.url);
          
          // Add event listeners
          socket.addEventListener('open', () => {
            console.log(`Connected to relay: ${relay.url}`);
            connections.set(relay.url, socket);
          });
          
          socket.addEventListener('message', (event) => {
            try {
              const data = JSON.parse(event.data);
              handleRelayMessage(data, relay.url);
            } catch (error) {
              console.error(`Error parsing message from relay ${relay.url}:`, error);
            }
          });
          
          socket.addEventListener('error', (error) => {
            console.error(`Error with relay ${relay.url}:`, error);
          });
          
          socket.addEventListener('close', () => {
            console.log(`Disconnected from relay: ${relay.url}`);
            connections.delete(relay.url);
          });
        } catch (error) {
          console.error(`Error connecting to relay ${relay.url}:`, error);
        }
      }));
      
      setRelayConnections(connections);
    };
    
    connectToRelays();
    
    // Cleanup function
    return () => {
      // Close all relay connections
      relayConnections.forEach((socket) => {
        socket.close();
      });
      setRelayConnections(new Map());
    };
  }, [isConnected, isEnabled, relays]);
  
  // Subscribe to message events when relays are connected
  useEffect(() => {
    if (!isConnected || !pubkey || relayConnections.size === 0) return;
    
    // Unsubscribe first
    subscriptions.forEach((subscriptionId) => {
      relayConnections.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          NostrUtils.unsubscribeFromEvents(socket, subscriptionId);
        }
      });
    });
    
    // Create new subscriptions for incoming messages
    const newSubscriptions: string[] = [];
    
    relayConnections.forEach((socket, url) => {
      if (socket.readyState === WebSocket.OPEN) {
        // Subscribe to DMs addressed to us
        const incomingId = `dm-incoming-${Math.random().toString(36).substring(2, 15)}`;
        NostrUtils.subscribeToEvents(socket, [
          {
            kinds: [NostrEventKind.EncryptedDirectMessage],
            '#p': [pubkey],
            limit: 50
          }
        ], incomingId);
        newSubscriptions.push(incomingId);
        
        // Subscribe to DMs sent by us
        const outgoingId = `dm-outgoing-${Math.random().toString(36).substring(2, 15)}`;
        NostrUtils.subscribeToEvents(socket, [
          {
            kinds: [NostrEventKind.EncryptedDirectMessage],
            authors: [pubkey],
            limit: 50
          }
        ], outgoingId);
        newSubscriptions.push(outgoingId);
      }
    });
    
    setSubscriptions(newSubscriptions);
    
    return () => {
      // Unsubscribe on cleanup
      newSubscriptions.forEach((subscriptionId) => {
        relayConnections.forEach((socket) => {
          if (socket.readyState === WebSocket.OPEN) {
            NostrUtils.unsubscribeFromEvents(socket, subscriptionId);
          }
        });
      });
    };
  }, [isConnected, pubkey, relayConnections]);
  
  // Handle messages from relays
  const handleRelayMessage = async (data: any, relayUrl: string) => {
    if (!data || !Array.isArray(data) || data.length < 2) return;
    
    const [type, subId, event] = data;
    
    // We only care about events
    if (type !== 'EVENT' || !event) return;
    
    // Handle encrypted DMs
    if (event.kind === NostrEventKind.EncryptedDirectMessage) {
      try {
        // Only process each event once (by id)
        if (messages.some(m => m.id === event.id)) return;
        
        // This is a message to/from us
        const isMine = event.pubkey === pubkey;
        const contactPubkey = isMine 
          ? event.tags.find((t: string[]) => t[0] === 'p')?.[1] 
          : event.pubkey;
          
        if (!contactPubkey) return;
        
        // Try to decrypt if we have the extension
        let decryptedContent = '';
        let decrypted = false;
        
        if (hasExtension && window.nostr) {
          try {
            decryptedContent = await window.nostr.nip04.decrypt(
              isMine ? contactPubkey : event.pubkey,
              event.content
            );
            decrypted = true;
          } catch (decryptError) {
            console.error('Failed to decrypt message:', decryptError);
            decryptedContent = '[Encrypted message - cannot decrypt]';
          }
        } else {
          decryptedContent = '[Encrypted message - install Nostr extension to view]';
        }
        
        // Add message to list
        const newMessage: Message = {
          id: event.id,
          content: decryptedContent,
          sender: event.pubkey,
          recipient: contactPubkey,
          created_at: new Date(event.created_at * 1000),
          isMine,
          decrypted
        };
        
        setMessages(prev => [...prev, newMessage].sort((a, b) => 
          a.created_at.getTime() - b.created_at.getTime()
        ));
        
        // Update contacts list if needed
        const contactId = isMine ? contactPubkey : event.pubkey;
        const npub = NostrUtils.hexToNpub(contactId);
        
        // Update or add contact
        setContacts(prev => {
          const existingContact = prev.find(c => c.pubkey === contactId);
          if (existingContact) {
            return prev.map(c => 
              c.pubkey === contactId 
                ? { 
                    ...c, 
                    lastMessage: decryptedContent.substring(0, 30) + (decryptedContent.length > 30 ? '...' : ''),
                    lastDate: new Date(event.created_at * 1000) 
                  }
                : c
            );
          } else {
            // Add new contact
            return [...prev, {
              pubkey: contactId,
              npub,
              lastMessage: decryptedContent.substring(0, 30) + (decryptedContent.length > 30 ? '...' : ''),
              lastDate: new Date(event.created_at * 1000)
            }];
          }
        });
        
        // Scroll to bottom if we're in the correct conversation
        if (
          (isMine && selectedContact?.pubkey === contactPubkey) ||
          (!isMine && selectedContact?.pubkey === event.pubkey)
        ) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  };
  
  // Send a message
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || !pubkey) return;
    
    setIsLoading(true);
    
    try {
      // Check if we have any open relays
      const openRelays = Array.from(relayConnections.values()).filter(
        socket => socket.readyState === WebSocket.OPEN
      );
      
      if (openRelays.length === 0) {
        // Try to connect to at least one relay
        if (relays.length > 0) {
          for (const relay of relays) {
            const connected = await connectRelay(relay.url);
            if (connected) break;
          }
        } else {
          // Add a default relay if none exists
          await addRelay('wss://relay.damus.io');
        }
      }
      
      // Encrypt the message if we have the extension
      let encryptedContent = '';
      
      if (hasExtension && window.nostr) {
        encryptedContent = await window.nostr.nip04.encrypt(
          selectedContact.pubkey,
          messageInput
        );
      } else {
        toast.error('Nostr extension required to send encrypted messages');
        setIsLoading(false);
        return;
      }
      
      // Create the event
      const event: Omit<NostrEvent, 'id' | 'sig'> = {
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: NostrEventKind.EncryptedDirectMessage,
        tags: [['p', selectedContact.pubkey]],
        content: encryptedContent
      };
      
      // Sign the event
      const signedEvent = await signEvent(event);
      
      if (!signedEvent) {
        toast.error('Failed to sign message');
        setIsLoading(false);
        return;
      }
      
      // Publish to all connected relays
      let published = false;
      
      relayConnections.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            NostrUtils.publishEvent(socket, signedEvent);
            published = true;
          } catch (error) {
            console.error('Error publishing to relay:', error);
          }
        }
      });
      
      if (!published) {
        toast.error('Failed to publish message: No connected relays');
        setIsLoading(false);
        return;
      }
      
      // Add message to the local list
      const newMessage: Message = {
        id: signedEvent?.id || Math.random().toString(36).substring(2, 15),
        content: messageInput,
        sender: pubkey,
        recipient: selectedContact.pubkey,
        created_at: new Date(),
        isMine: true,
        decrypted: true
      };
      
      setMessages(prev => [...prev, newMessage].sort((a, b) => 
        a.created_at.getTime() - b.created_at.getTime()
      ));
      
      // Update contact's last message
      setContacts(prev => prev.map(c => 
        c.pubkey === selectedContact.pubkey 
          ? { 
              ...c, 
              lastMessage: messageInput.substring(0, 30) + (messageInput.length > 30 ? '...' : ''),
              lastDate: new Date() 
            }
          : c
      ));
      
      // Clear the input
      setMessageInput('');
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a new contact
  const addContact = () => {
    if (!contactInput.trim()) return;
    
    try {
      let pubkeyHex = '';
      
      // Check if it's an npub and convert to hex
      if (contactInput.startsWith('npub1')) {
        try {
          pubkeyHex = NostrUtils.npubToHex(contactInput);
        } catch (error) {
          toast.error('Invalid npub format');
          return;
        }
      } else {
        // Assume it's already a hex pubkey
        pubkeyHex = contactInput;
      }
      
      // Check if already in contacts
      if (contacts.some(c => c.pubkey === pubkeyHex)) {
        toast.error('Contact already exists');
        return;
      }
      
      // Add the contact
      const npub = NostrUtils.hexToNpub(pubkeyHex);
      setContacts(prev => [
        ...prev,
        {
          pubkey: pubkeyHex,
          npub,
          name: newContactName || undefined
        }
      ]);
      
      // Clear inputs
      setContactInput('');
      setNewContactName('');
      setIsAddingContact(false);
      
      toast.success('Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    }
  };
  
  // Filter messages for the selected contact
  const filteredMessages = selectedContact 
    ? messages.filter(m => 
        (m.sender === pubkey && m.recipient === selectedContact.pubkey) ||
        (m.sender === selectedContact.pubkey && m.recipient === pubkey)
      )
    : [];
  
  // If Nostr is not enabled, show a message
  if (!isEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Nostr Messaging Not Enabled</AlertTitle>
          <AlertDescription>
            Please enable Nostr in your profile settings to use decentralized messaging.
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => window.location.href = '/settings'}
        >
          Go to Settings
        </Button>
      </div>
    );
  }
  
  // If not connected, show connect button
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <p className="mb-4 text-center">Connect to Nostr to access your messages</p>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={connectExtension}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Connect to Nostr
            </>
          )}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col md:flex-row h-[70vh] gap-4 w-full">
      {/* Contacts sidebar */}
      <Card className="w-full md:w-72 flex flex-col">
        <CardHeader className="py-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsAddingContact(!isAddingContact)}
            >
              {isAddingContact ? <X className="h-4 w-4" /> : '+'}
            </Button>
          </div>
        </CardHeader>
        
        {isAddingContact && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800">
            <Input
              placeholder="npub or pubkey"
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
              className="mb-2"
            />
            <Input
              placeholder="Contact name (optional)"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="mb-2"
            />
            <Button
              className="w-full text-xs bg-amber-500 hover:bg-amber-600 text-white"
              onClick={addContact}
              size="sm"
            >
              Add Contact
            </Button>
          </div>
        )}
        
        <ScrollArea className="flex-grow">
          <div className="p-2 space-y-1">
            {contacts.length === 0 && (
              <p className="text-center text-sm text-muted-foreground p-4">
                No contacts yet. Add one to start messaging.
              </p>
            )}
            
            {contacts.map((contact) => (
              <div
                key={contact.pubkey}
                onClick={() => setSelectedContact(contact)}
                className={`p-2 rounded-lg cursor-pointer flex items-center gap-2 ${
                  selectedContact?.pubkey === contact.pubkey
                    ? 'bg-amber-100 dark:bg-amber-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-amber-100 text-amber-800">
                    {(contact.name?.[0] || 'U').toUpperCase()}
                  </AvatarFallback>
                  {contact.avatar && <AvatarImage src={contact.avatar} />}
                </Avatar>
                
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium text-sm truncate">
                    {contact.name || contact.npub.substring(0, 8) + '...'}
                  </div>
                  {contact.lastMessage && (
                    <div className="text-xs text-muted-foreground truncate">
                      {contact.lastMessage}
                    </div>
                  )}
                </div>
                
                {contact.lastDate && (
                  <div className="text-xs text-muted-foreground">
                    {format(contact.lastDate, 'HH:mm')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              fetchMessages();
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </Card>
      
      {/* Message area */}
      <Card className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <CardHeader className="py-3 border-b">
              <div className="flex items-center">
                <Avatar className="h-9 w-9 mr-2">
                  <AvatarFallback className="bg-amber-100 text-amber-800">
                    {(selectedContact.name?.[0] || 'U').toUpperCase()}
                  </AvatarFallback>
                  {selectedContact.avatar && <AvatarImage src={selectedContact.avatar} />}
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-medium">
                    {selectedContact.name || selectedContact.npub.substring(0, 14) + '...'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedContact.npub}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px]">
                    <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-muted-foreground text-center">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.isMine
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-800'
                        }`}
                      >
                        <div className="text-sm">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-1 ${message.isMine ? 'text-amber-100' : 'text-muted-foreground'}`}>
                          {format(message.created_at, 'HH:mm')}
                          {!message.decrypted && ' (encrypted)'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <CardFooter className="border-t p-3">
              <div className="flex w-full gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="min-h-[60px] flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={sendMessage}
                  disabled={isLoading || !messageInput.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-xl font-medium mb-2">Nostr Messages</p>
            <p className="text-center text-muted-foreground max-w-xs mb-4">
              Select a contact to start messaging. Your conversations are end-to-end encrypted.
            </p>
            <Button
              variant="outline"
              onClick={() => setIsAddingContact(true)}
            >
              Add New Contact
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
  
  // Helper function to fetch messages (placeholder - actual implementation would use the relay subscriptions)
  function fetchMessages() {
    toast.info('Refreshing messages...', {
      description: 'New messages will appear automatically as they arrive through relays.'
    });
  }
} 
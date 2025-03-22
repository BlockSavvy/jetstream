'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Search, 
  Filter, 
  User, 
  Circle, 
  UserCircle, 
  Send, 
  PaperclipIcon as Paperclip, 
  SmileIcon as Smile,
  Plus,
  MoreHorizontal
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Sample data for demonstration
const conversations = [
  {
    id: '1',
    recipient: {
      name: 'Jane Smith',
      avatar: '/placeholder.svg?height=32&width=32',
      status: 'online'
    },
    lastMessage: {
      text: "I'll be at the airport an hour before departure. See you there!",
      time: '10:25 AM',
      read: true,
      sender: 'them'
    },
    unread: 0
  },
  {
    id: '2',
    recipient: {
      name: 'James Wilson',
      avatar: '/placeholder.svg?height=32&width=32',
      status: 'offline'
    },
    lastMessage: {
      text: 'Are you joining the Miami trip next weekend?',
      time: 'Yesterday',
      read: false,
      sender: 'them'
    },
    unread: 3
  },
  {
    id: '3',
    recipient: {
      name: 'Flight Operations',
      avatar: '/placeholder.svg?height=32&width=32',
      status: 'online',
      isSystem: true
    },
    lastMessage: {
      text: 'Your flight to Los Angeles has been confirmed for May 15th at 10:00 AM.',
      time: 'May 10',
      read: true,
      sender: 'them'
    },
    unread: 0
  },
  {
    id: '4',
    recipient: {
      name: 'Sarah Johnson',
      avatar: '/placeholder.svg?height=32&width=32',
      status: 'away'
    },
    lastMessage: {
      text: "Thanks for sharing those documents. I'll review them before our flight.",
      time: 'May 5',
      read: true,
      sender: 'you'
    },
    unread: 0
  }
];

const selectedConversation = {
  id: '1',
  recipient: {
    name: 'Jane Smith',
    avatar: '/placeholder.svg?height=32&width=32',
    status: 'online',
    title: 'Co-Owner, Gulfstream G650'
  },
  messages: [
    {
      id: '1-1',
      text: 'Hi there! Just wanted to coordinate for our upcoming flight to LA.',
      time: 'May 14, 9:30 AM',
      sender: 'them'
    },
    {
      id: '1-2',
      text: 'Hello! Sure, what details do we need to discuss?',
      time: 'May 14, 9:45 AM',
      sender: 'you'
    },
    {
      id: '1-3',
      text: 'I was thinking about the departure time. Is 10:00 AM still good for you?',
      time: 'May 14, 10:00 AM',
      sender: 'them'
    },
    {
      id: '1-4',
      text: 'Yes, 10:00 AM works perfectly for me. Should we coordinate transportation to the airport?',
      time: 'May 14, 10:15 AM',
      sender: 'you'
    },
    {
      id: '1-5',
      text: "I'll be at the airport an hour before departure. See you there!",
      time: 'Today, 10:25 AM',
      sender: 'them'
    }
  ]
};

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => 
    conversation.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter conversations based on tab
  const tabFilteredConversations = activeTab === 'all' 
    ? filteredConversations 
    : activeTab === 'unread' 
      ? filteredConversations.filter(c => c.unread > 0)
      : filteredConversations.filter(c => c.recipient.status === 'online');
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // In a real app, this would send the message to the API
    console.log('Sending message:', message);
    
    // Clear the input
    setMessage('');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with co-owners, flight operations, and travel companions
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(80vh-140px)]">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1 flex flex-col border rounded-lg h-full">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search messages..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button size="icon" variant="ghost">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <Tabs className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="online">Online</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex-1 overflow-auto">
            {tabFilteredConversations.length > 0 ? (
              <div>
                {tabFilteredConversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    className={`p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer ${conversation.id === '1' ? 'bg-muted' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={conversation.recipient.avatar} alt={conversation.recipient.name} />
                          <AvatarFallback>
                            {conversation.recipient.isSystem ? 'FO' : conversation.recipient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span 
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                            conversation.recipient.status === 'online' ? 'bg-green-500' : 
                            conversation.recipient.status === 'away' ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium truncate">{conversation.recipient.name}</div>
                          <div className="text-xs text-muted-foreground">{conversation.lastMessage.time}</div>
                        </div>
                        <div className="text-sm truncate text-muted-foreground">
                          {conversation.lastMessage.sender === 'you' && 'You: '}
                          {conversation.lastMessage.text}
                        </div>
                      </div>
                      {conversation.unread > 0 && (
                        <Badge className="bg-amber-500 text-white">{conversation.unread}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No conversations found</h3>
                <p className="text-muted-foreground text-sm max-w-[200px]">
                  {searchTerm ? 
                    'No conversations match your search' : 
                    activeTab === 'unread' ? 
                      'No unread messages' : 
                      activeTab === 'online' ? 
                        'No online contacts' : 
                        'Start a new conversation'
                  }
                </p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
            <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-black">
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </div>
        </div>
        
        {/* Message Thread */}
        <div className="lg:col-span-2 flex flex-col border rounded-lg overflow-hidden h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedConversation.recipient.avatar} alt={selectedConversation.recipient.name} />
                <AvatarFallback>{selectedConversation.recipient.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium flex items-center gap-2">
                  {selectedConversation.recipient.name}
                  <span 
                    className={`inline-block w-2 h-2 rounded-full ${
                      selectedConversation.recipient.status === 'online' ? 'bg-green-500' : 
                      selectedConversation.recipient.status === 'away' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedConversation.recipient.title}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {selectedConversation.messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'you' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'you' 
                      ? 'bg-amber-500 text-black rounded-br-none' 
                      : 'bg-muted rounded-bl-none'
                  }`}
                >
                  <div className="text-sm">{message.text}</div>
                  <div className={`text-xs mt-1 ${
                    message.sender === 'you' ? 'text-amber-800' : 'text-muted-foreground'
                  }`}>
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  placeholder="Type a message..."
                  className="resize-none min-h-[80px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex mt-2 gap-2">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="bg-amber-500 hover:bg-amber-600 text-black"
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { format, compareAsc } from 'date-fns';
import { 
  MessageSquare, 
  Users,
  Loader2,
  Plane,
  User,
  RadioTower,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import FlightNostrGroup from '../FlightNostrGroup';
import { useNostr } from '../../contexts/NostrContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FlightChat {
  id: string;
  offerId: string;
  flightNumber: string;
  departureLocation: string;
  arrivalLocation: string;
  departureTime: string;
  participantCount: number;
  unreadCount: number;
  lastMessageTime?: string;
  lastMessagePreview?: string;
}

export default function FlightChatsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [chats, setChats] = useState<FlightChat[]>([]);
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getThemeClasses } = useGdyupTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected, isInitialized, hasNip05 } = useNostr();

  useEffect(() => {
    const fetchFlightChats = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/gdyup/flightchats?userId=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch flight chats');
        }
        
        const data = await response.json();
        
        // Sort chats by departure time
        const sortedChats = data.chats.sort((a: FlightChat, b: FlightChat) => {
          return compareAsc(new Date(a.departureTime), new Date(b.departureTime));
        });
        
        setChats(sortedChats);
      } catch (error) {
        console.error('Error fetching flight chats:', error);
        setError('Unable to load your flight chats. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFlightChats();
  }, [user]);

  const toggleChat = (id: string) => {
    if (expandedChatId === id) {
      setExpandedChatId(null);
    } else {
      setExpandedChatId(id);
    }
  };

  const renderChatCard = (chat: FlightChat) => {
    const departureTime = new Date(chat.departureTime);
    const isExpanded = expandedChatId === chat.id;
    
    return (
      <div key={chat.id} className="mb-4">
        <motion.div
          className={getThemeClasses({
            base: "border rounded-lg overflow-hidden cursor-pointer",
            default: "bg-gray-900 border-gray-800 hover:border-gray-700",
            blue: "bg-blue-950 border-blue-900 hover:border-blue-800",
            pink: "bg-pink-950 border-pink-900 hover:border-pink-800"
          })}
          onClick={() => toggleChat(chat.id)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className={getThemeClasses({
                    base: "p-1.5 rounded",
                    default: "bg-gray-800",
                    blue: "bg-blue-900",
                    pink: "bg-pink-900"
                  })}>
                    <Plane className="h-4 w-4 text-gdyup-primary" />
                  </div>
                  <div className={getThemeClasses({
                    base: "text-xs",
                    default: "text-gray-400",
                    blue: "text-blue-400",
                    pink: "text-pink-400"
                  })}>
                    Flight {chat.flightNumber}
                  </div>
                  
                  {chat.unreadCount > 0 && (
                    <Badge className={getThemeClasses({
                      base: "",
                      default: "bg-gdyup-primary text-black",
                      blue: "bg-gdyup-primary text-black",
                      pink: "bg-gdyup-primary text-black"
                    })}>
                      {chat.unreadCount} new
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-medium">{chat.departureLocation} → {chat.arrivalLocation}</h3>
                
                <div className="flex items-center gap-2 text-xs">
                  <span>{format(departureTime, 'MMM d, yyyy')}</span>
                  <span className="mx-1">•</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 opacity-70" />
                    <span>{chat.participantCount} {chat.participantCount === 1 ? 'participant' : 'participants'}</span>
                  </div>
                </div>
                
                {chat.lastMessagePreview && (
                  <div className={getThemeClasses({
                    base: "mt-2 p-2 rounded text-sm truncate",
                    default: "bg-gray-800 text-gray-300",
                    blue: "bg-blue-900 text-blue-300",
                    pink: "bg-pink-900 text-pink-300"
                  })}>
                    <span className="opacity-70">Last message: </span>
                    {chat.lastMessagePreview}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className={getThemeClasses({
                    base: "",
                    default: "text-gray-400 hover:text-white",
                    blue: "text-blue-400 hover:text-blue-100",
                    pink: "text-pink-400 hover:text-pink-100"
                  })}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <div className={getThemeClasses({
                  base: "text-xs mt-1",
                  default: "text-gray-500",
                  blue: "text-blue-500",
                  pink: "text-pink-500"
                })}>
                  {isExpanded ? 'Close' : 'Expand'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-1"
          >
            <FlightNostrGroup 
              offerId={chat.offerId}
              flightTitle={`${chat.departureLocation} → ${chat.arrivalLocation}`}
              initialCollapsed={false}
            />
          </motion.div>
        )}
      </div>
    );
  };

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div 
          key={`skeleton-${i}`}
          className={getThemeClasses({
            base: "border rounded-lg overflow-hidden mb-4 p-4",
            default: "bg-gray-900 border-gray-800",
            blue: "bg-blue-950 border-blue-900",
            pink: "bg-pink-950 border-pink-900"
          })}
        >
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className={getThemeClasses({
                base: "h-5 w-40",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })} />
              <Skeleton className={getThemeClasses({
                base: "h-6 w-60",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })} />
              <Skeleton className={getThemeClasses({
                base: "h-4 w-32",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })} />
            </div>
            <Skeleton className={getThemeClasses({
              base: "h-10 w-10 rounded",
              default: "bg-gray-800",
              blue: "bg-blue-900",
              pink: "bg-pink-900"
            })} />
          </div>
        </div>
      ))}
    </>
  );

  // Check if the user has Nostr set up
  const renderNostrStatus = () => {
    if (!isInitialized) {
      return (
        <div className={getThemeClasses({
          base: "p-4 rounded-lg border text-center",
          default: "bg-gray-900 border-gray-800 text-gray-400",
          blue: "bg-blue-950 border-blue-900 text-blue-400",
          pink: "bg-pink-950 border-pink-900 text-pink-400"
        })}>
          <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
          <p>Initializing Nostr connectivity...</p>
        </div>
      );
    }
    
    if (!hasNip05) {
      return (
        <div className={getThemeClasses({
          base: "p-4 rounded-lg border text-center",
          default: "bg-amber-900/20 border-amber-900/30 text-amber-300",
          blue: "bg-amber-900/20 border-amber-900/30 text-amber-300",
          pink: "bg-amber-900/20 border-amber-900/30 text-amber-300"
        })}>
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          <p className="mb-3">You need to verify your Nostr identity to use flight chats.</p>
          <Button 
            onClick={() => router.push('/gdyup/profile')}
            className={getThemeClasses({
              base: "",
              default: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
              blue: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
              pink: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90"
            })}
          >
            Set Up Nostr Identity
          </Button>
        </div>
      );
    }
    
    if (!isConnected) {
      return (
        <div className={getThemeClasses({
          base: "p-4 rounded-lg border text-center",
          default: "bg-amber-900/20 border-amber-900/30 text-amber-300",
          blue: "bg-amber-900/20 border-amber-900/30 text-amber-300",
          pink: "bg-amber-900/20 border-amber-900/30 text-amber-300"
        })}>
          <RadioTower className="h-6 w-6 mx-auto mb-2" />
          <p className="mb-3">Connect to Nostr to access your flight chats.</p>
          <Button 
            onClick={() => router.push('/gdyup/profile')}
            className={getThemeClasses({
              base: "",
              default: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
              blue: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
              pink: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90"
            })}
          >
            <Wifi className="h-4 w-4 mr-2" />
            Connect to Nostr
          </Button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className={getThemeClasses({
        base: "border",
        default: "bg-gray-900 border-gray-800",
        blue: "bg-blue-950 border-blue-900",
        pink: "bg-pink-950 border-pink-900"
      })}>
        <CardHeader>
          <CardTitle className={getThemeClasses({
            base: "",
            default: "text-white",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
            Flight Group Chats
          </CardTitle>
          <CardDescription className={getThemeClasses({
            base: "",
            default: "text-gray-400",
            blue: "text-blue-400",
            pink: "text-pink-400"
          })}>
            Connect with other passengers on your flights via Nostr
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderNostrStatus()}
          
          {isLoading ? (
            renderSkeletons()
          ) : error ? (
            <div className={getThemeClasses({
              base: "text-center py-10",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : hasNip05 && isConnected && chats.length === 0 ? (
            <div className={getThemeClasses({
              base: "text-center py-10",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
              <div className="flex justify-center mb-2">
                <div className={getThemeClasses({
                  base: "w-12 h-12 rounded-full flex items-center justify-center",
                  default: "bg-gray-800 text-gdyup-primary",
                  blue: "bg-blue-900 text-gdyup-primary",
                  pink: "bg-pink-900 text-gdyup-primary"
                })}>
                  <MessageSquare className="h-6 w-6" />
                </div>
              </div>
              <p className="mb-4">You don't have any flight group chats yet.</p>
              <p className="text-sm max-w-md mx-auto mb-4">
                Book a flight to join its group chat. Group chats allow you to coordinate with other passengers and the flight host.
              </p>
              <Button
                onClick={() => router.push('/gdyup/browse')}
              >
                Browse Available Flights
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {hasNip05 && isConnected && chats.map(renderChatCard)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plane, Download, RefreshCw, Calendar, MapPin, Clock, Users, Edit, Share, Tag, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { toast } from 'sonner';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface Jet {
  id: string;
  manufacturer: string;
  model: string;
  year: string;
  tail_number: string;
  capacity: string;
  status: string;
  image_url: string;
  home_base_airport: string;
  category: string;
  description?: string;
  range_nm?: string;
  max_speed_kts?: string;
  cruise_speed_kts?: string;
  ceiling_ft?: string;
  hourly_rate?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

function JetDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [jet, setJet] = useState<Jet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const router = useRouter();
  const { getThemeClasses } = useGdyupTheme();
  
  const jetId = params?.id as string;
  
  // GDY UP brand colors
  const primaryColor = "#DAFF0D"; 
  const secondaryColor = "#FF4B47";
  
  // Function for direct navigation
  const navigateTo = (path: string) => {
    window.location.href = path;
  };
  
  // Fetch jet details
  useEffect(() => {
    async function fetchJetDetails() {
      if (!jetId) return;
      
      try {
        setLoading(true);
        
        // Get the user ID from various sources
        const userId = user?.id || localStorage.getItem('jetstream_user_id');
        if (!userId) {
          setError("Authentication required to view jet details");
          setLoading(false);
          return;
        }
        
        // Add timestamp to prevent caching
        const timestamp = Date.now();
        
        // FIXED: Use the gdyup API endpoint instead of the jets API
        const url = `/api/gdyup/jets/${jetId}?userId=${userId}&t=${timestamp}`;
        
        // First check if we have an auth token to include
        let authToken = null;
        try {
          const tokenStr = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
          if (tokenStr) {
            const tokenData = JSON.parse(tokenStr);
            if (tokenData?.access_token) {
              authToken = tokenData.access_token;
            }
          }
        } catch (e) {
          console.warn('Could not parse auth token from localStorage', e);
        }
        
        // Prepare headers with or without auth token
        const headers: Record<string, string> = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Content-Type': 'application/json',
        };
        
        // Add auth header if available
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include', // Send cookies
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Jet not found. It may have been deleted or you don't have access.");
          } else if (response.status === 401) {
            throw new Error("Authentication required to view jet details");
          } else {
            throw new Error(`Failed to fetch jet details: ${response.status}`);
          }
        }
        
        const data = await response.json();
        
        if (data && data.data) {
          // FIXED: Updated to match the gdyup API response format
          setJet(data.data);
        } else {
          throw new Error('Invalid response format from API');
        }
      } catch (err) {
        console.error('Error fetching jet details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch jet details');
        
        // Mock data for development
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Loading mock data');
          setJet({
            id: jetId,
            manufacturer: 'Bombardier',
            model: 'Global 7500',
            year: '2022',
            tail_number: 'N7500X',
            capacity: '19',
            status: 'Available',
            image_url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=2070&auto=format&fit=crop',
            home_base_airport: 'KTEB',
            category: 'Ultra Long Range',
            description: 'The Global 7500 aircraft stands alone as the largest and longest-range business jet.',
            range_nm: '7,700',
            max_speed_kts: '516',
            cruise_speed_kts: '488',
            ceiling_ft: '51,000',
            hourly_rate: '$12,500',
            created_at: '2023-01-01T00:00:00',
            updated_at: '2023-01-01T00:00:00'
          });
          setError(null); // Clear error for mock data
        }
      } finally {
        setLoading(false);
      }
    }
    
    if (!authLoading) {
      fetchJetDetails();
    }
  }, [jetId, user, authLoading]);

  // Get status color based on jet status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-600';
      case 'maintenance':
        return 'bg-amber-600';
      case 'reserved':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error && !jet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className={getThemeClasses({
          base: "border shadow-sm",
          default: "bg-white border-gray-200",
          blue: "bg-blue-950/40 border-blue-900/60",
          pink: "bg-pink-950/40 border-pink-900/60"
        })}>
          <CardHeader>
            <CardTitle className={getThemeClasses({
              base: "text-center",
              default: "text-gray-900",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={getThemeClasses({
              base: "text-center",
              default: "text-gray-500",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })}>{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/gdyup/jets')}>
              Return to Jets
            </Button>
          </CardFooter>
          </Card>
      </div>
    );
  }

  if (!jet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className={getThemeClasses({
          base: "border shadow-sm",
          default: "bg-white border-gray-200",
          blue: "bg-blue-950/40 border-blue-900/60",
          pink: "bg-pink-950/40 border-pink-900/60"
        })}>
          <CardHeader>
            <CardTitle className={getThemeClasses({
              base: "text-center",
              default: "text-gray-900",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>Jet Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={getThemeClasses({
              base: "text-center",
              default: "text-gray-500",
              blue: "text-blue-300",
              pink: "text-pink-300"
            })}>The jet you're looking for could not be found.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/gdyup/jets')}>
              Return to Jets
            </Button>
          </CardFooter>
          </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
          onClick={() => router.back()} 
          className="mr-4"
          >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
          </Button>
        <h1 className={getThemeClasses({
          base: "text-2xl font-bold",
          default: "text-gray-900",
          blue: "text-blue-50",
          pink: "text-pink-50"
        })}>
          {jet.manufacturer} {jet.model}
        </h1>
      </div>
      
      <Card className={getThemeClasses({
        base: "border shadow-sm mb-6",
        default: "bg-white border-gray-200",
        blue: "bg-blue-950/40 border-blue-900/60",
        pink: "bg-pink-950/40 border-pink-900/60"
      })}>
        <CardHeader>
          <CardTitle className={getThemeClasses({
            base: "flex items-center",
            default: "text-gray-900",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
            <Plane className="h-5 w-5 mr-2" />
            {jet.tail_number}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className={getThemeClasses({
                  base: "text-sm font-medium mb-1",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Aircraft</h3>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-gray-900",
                  blue: "text-blue-50",
                  pink: "text-pink-50"
                })}>
                  {jet.manufacturer} {jet.model} ({jet.year})
                </p>
              </div>
              
              <div>
                <h3 className={getThemeClasses({
                  base: "text-sm font-medium mb-1",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Capacity</h3>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-gray-900",
                  blue: "text-blue-50",
                  pink: "text-pink-50"
                })}>
                  {jet.capacity} passengers
                </p>
          </div>
        </div>
        
            <div className="space-y-4">
              <div>
                <h3 className={getThemeClasses({
                  base: "text-sm font-medium mb-1",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Home Base</h3>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-gray-900",
                  blue: "text-blue-50",
                  pink: "text-pink-50"
                })}>
                  {jet.home_base_airport}
                </p>
          </div>
          
              <div>
                <h3 className={getThemeClasses({
                  base: "text-sm font-medium mb-1",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Range</h3>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-gray-900",
                  blue: "text-blue-50",
                  pink: "text-pink-50"
                })}>
                  {jet.range_nm || 'N/A'} nm
                </p>
              </div>
            </div>
          
            <div className="space-y-4">
              <div>
                <h3 className={getThemeClasses({
                  base: "text-sm font-medium mb-1",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Cruise Speed</h3>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-gray-900",
                  blue: "text-blue-50",
                  pink: "text-pink-50"
                })}>
                  {jet.cruise_speed_kts || 'N/A'} kts
                </p>
              </div>
              
              <div>
                <h3 className={getThemeClasses({
                  base: "text-sm font-medium mb-1",
                  default: "text-gray-500",
                  blue: "text-blue-300",
                  pink: "text-pink-300"
                })}>Added</h3>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-gray-900",
                  blue: "text-blue-50",
                  pink: "text-pink-50"
                })}>
                  {jet.created_at ? format(new Date(jet.created_at), 'MMM d, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {jet.notes && (
            <div className={getThemeClasses({
              base: "mt-6 p-4 rounded-md",
              default: "bg-gray-50 border border-gray-100",
              blue: "bg-blue-900/30 border border-blue-800/30",
              pink: "bg-pink-900/30 border border-pink-800/30"
            })}>
              <h3 className={getThemeClasses({
                base: "text-sm font-medium mb-2 flex items-center",
                default: "text-gray-700",
                blue: "text-blue-200",
                pink: "text-pink-200"
              })}>
                <Info className="h-4 w-4 mr-2" />
                Notes
              </h3>
              <p className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-600",
                blue: "text-blue-300",
                pink: "text-pink-300"
              })}>
                {jet.notes}
              </p>
              </div>
            )}
          </CardContent>
        <CardFooter className="flex justify-end gap-3">
              <Button
                variant="outline"
            onClick={() => router.push(`/gdyup/jets/edit/${jetId}`)}
          >
            Edit Jet
          </Button>
          <Button
            onClick={() => router.push(`/gdyup/offer/new?jet=${jetId}`)}
          >
            Create Flight Share
              </Button>
          </CardFooter>
        </Card>
    </div>
  );
}

export default function JetDetailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <JetDetailContent />
    </Suspense>
  );
} 
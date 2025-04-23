'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plane, Download, RefreshCw, Calendar, MapPin, Clock, Users, Edit, Share, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { toast } from 'sonner';

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
}

export default function JetDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [jet, setJet] = useState<Jet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
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
            hourly_rate: '$12,500'
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
      <div className="bg-black min-h-screen text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigateTo('/gdyup/jets')}
              className="mr-4 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Jet Details</h1>
          </div>
          
          <Card className="bg-[#0D0D0D] border-gray-800">
            <div className="aspect-video relative">
              <Skeleton className="w-full h-full bg-gray-800" />
            </div>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 bg-gray-800" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full bg-gray-800" />
              <Skeleton className="h-4 w-full bg-gray-800" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Skeleton className="h-8 w-full bg-gray-800" />
                <Skeleton className="h-8 w-full bg-gray-800" />
                <Skeleton className="h-8 w-full bg-gray-800" />
                <Skeleton className="h-8 w-full bg-gray-800" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !jet) {
    return (
      <div className="bg-black min-h-screen text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigateTo('/gdyup/jets')}
              className="mr-4 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Jet Details</h1>
          </div>
          
          <Card className="bg-[#0D0D0D] border-red-800 p-6 text-center">
            <div className="flex flex-col items-center py-8">
              <div className="rounded-full bg-red-900/20 p-4 mb-4">
                <Plane className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-400">Error Loading Jet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {error}
              </p>
              <Button
                onClick={() => navigateTo('/gdyup/jets')}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                Return to My Jets
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!jet) {
    return (
      <div className="bg-black min-h-screen text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigateTo('/gdyup/jets')}
              className="mr-4 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Jet Details</h1>
          </div>
          
          <Card className="bg-[#0D0D0D] border-gray-800 p-6 text-center">
            <div className="flex flex-col items-center py-8">
              <div className="rounded-full bg-gray-900 p-4 mb-4">
                <Plane className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Jet Not Found</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                The requested jet could not be found or you don't have permission to view it.
              </p>
              <Button
                onClick={() => navigateTo('/gdyup/jets')}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                Return to My Jets
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigateTo('/gdyup/jets')}
            className="mr-4 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Jet Details</h1>
          
          <div className="ml-auto space-x-2">
            <Button
              variant="outline"
              onClick={() => navigateTo(`/gdyup/jets/${jet.id}/edit`)}
              className="border-gray-700 hover:bg-gray-800"
            >
              <Edit className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
              Edit Jet
            </Button>
            <Button
              onClick={() => navigateTo(`/gdyup/offer/new?jet=${jet.id}`)}
              className="bg-[#DAFF0D] hover:brightness-105 text-black"
            >
              <Share className="h-4 w-4 mr-2" />
              Offer a Share
            </Button>
          </div>
        </div>
        
        <Card className="bg-[#0D0D0D] border-gray-800 overflow-hidden mb-6">
          <div className="aspect-video relative">
            {jet.image_url ? (
              <Image
                src={jet.image_url}
                alt={`${jet.manufacturer} ${jet.model}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-900">
                <Plane className="h-16 w-16 text-gray-600" />
              </div>
            )}
            <Badge className={`${getStatusColor(jet.status)} absolute top-4 right-4 text-sm px-3 py-1`}>
              {jet.status}
            </Badge>
          </div>
          
          <CardHeader>
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {jet.manufacturer} {jet.model}
                </CardTitle>
                <p className="text-gray-400 flex items-center mt-1">
                  <Tag className="h-4 w-4 mr-2" />
                  {jet.tail_number}
                </p>
              </div>
              <Badge variant="outline" className="bg-gray-900/80 border-gray-700 text-sm px-3 py-1">
                {jet.category}
              </Badge>
            </div>
          </CardHeader>
          
          <div className="px-6">
            <div className="border-b border-gray-800">
              <div className="flex space-x-4">
                <button 
                  className={`pb-2 px-1 font-medium text-sm relative ${activeTab === 'details' ? 'text-[#DAFF0D]' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                  {activeTab === 'details' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5" style={{ backgroundColor: primaryColor }}></span>
                  )}
                </button>
                <button 
                  className={`pb-2 px-1 font-medium text-sm relative ${activeTab === 'specifications' ? 'text-[#DAFF0D]' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('specifications')}
                >
                  Specifications
                  {activeTab === 'specifications' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5" style={{ backgroundColor: primaryColor }}></span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <CardContent className="pt-4">
            {activeTab === 'details' && (
              <div className="space-y-4">
                {jet.description && (
                  <p className="text-gray-300">{jet.description}</p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-1 text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Year
                    </div>
                    <p className="font-medium">{jet.year}</p>
                  </div>
                  
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-1 text-sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      Home Base
                    </div>
                    <p className="font-medium">{jet.home_base_airport}</p>
                  </div>
                  
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-1 text-sm">
                      <Users className="h-4 w-4 mr-2" />
                      Capacity
                    </div>
                    <p className="font-medium">{jet.capacity} seats</p>
                  </div>
                  
                  {jet.hourly_rate && (
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-1 text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        Hourly Rate
                      </div>
                      <p className="font-medium">{jet.hourly_rate}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'specifications' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {jet.range_nm && (
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-gray-400 mb-1 text-sm">Range</div>
                      <p className="font-medium">{jet.range_nm} NM</p>
                    </div>
                  )}
                  
                  {jet.max_speed_kts && (
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-gray-400 mb-1 text-sm">Max Speed</div>
                      <p className="font-medium">{jet.max_speed_kts} KTAS</p>
                    </div>
                  )}
                  
                  {jet.cruise_speed_kts && (
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-gray-400 mb-1 text-sm">Cruise Speed</div>
                      <p className="font-medium">{jet.cruise_speed_kts} KTAS</p>
                    </div>
                  )}
                  
                  {jet.ceiling_ft && (
                    <div className="bg-gray-900/50 p-3 rounded-lg">
                      <div className="text-gray-400 mb-1 text-sm">Ceiling</div>
                      <p className="font-medium">{jet.ceiling_ft} ft</p>
                    </div>
                  )}
                </div>
                
                {(!jet.range_nm && !jet.max_speed_kts && !jet.cruise_speed_kts && !jet.ceiling_ft) && (
                  <div className="text-center py-6 text-gray-400">
                    <p>Additional specifications not available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t border-gray-800 pt-4">
            <div className="w-full flex justify-center">
              <Button
                variant="outline"
                onClick={() => navigateTo(`/gdyup/offer/new?jet=${jet.id}`)}
                className="border-gray-700 hover:bg-gray-800 text-gray-300"
              >
                <Share className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                Create an Offer with this Jet
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 
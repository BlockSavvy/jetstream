'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlusCircle, Plane, Settings, AlertTriangle, LogIn, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';

export interface Jet {
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
}

export default function JetsList() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const [jets, setJets] = useState<Jet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // GDY UP brand colors
  const primaryColor = "#DAFF0D"; 
  const secondaryColor = "#FF4B47";

  // Create a fetchJets function that can be called multiple times
  const fetchJets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get effective user ID - try multiple sources
      const userId = user?.id || 
                      localStorage.getItem('jetstream_user_id') || 
                      localStorage.getItem('userId') || 
                      'anonymous';
      
      // Add timestamp and retry count to avoid caching issues
      const timestamp = Date.now();
      const url = `/api/jets/user?user_id=${userId}&t=${timestamp}&retry=${retryCount}`;
      
      console.log('Fetching jets:', url);
      
      // Try to ensure auth token is in the request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add auth token from localStorage if available
      try {
        const tokenData = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        if (tokenData) {
          headers['x-auth-token'] = tokenData;
        }
      } catch (e) {
        console.warn('Error getting token from localStorage:', e);
      }
      
      // Add a small delay to prevent rapid requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        // Include credentials to send cookies for authentication
        credentials: 'include'
      });
      
      if (!response.ok) {
        // If unauthorized, try to refresh the session once
        if (response.status === 401 && retryCount < 1) {
          console.log('Auth failed, trying to refresh session');
          
          // Try to refresh the auth session
          const refreshSuccess = await refreshSession();
          
          if (refreshSuccess) {
            // Increment retry count and try again
            setRetryCount(prev => prev + 1);
            return; // Will trigger a re-render which will call fetchJets again
          } else {
            throw new Error('Authentication required');
          }
        }
        
        // For other errors or if refresh failed
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Check if we have data in the response
      if (result && result.data) {
        setJets(result.data);
        console.log(`Loaded ${result.data.length} jets`);
      } else {
        console.warn('No jets data in response:', result);
        setJets([]);
      }
    } catch (err) {
      console.error('Error fetching jets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jets');
    } finally {
      setLoading(false);
    }
  }, [user, refreshSession, retryCount]);

  // Call fetchJets when component mounts or retryCount changes
  useEffect(() => {
    fetchJets();
  }, [fetchJets, retryCount]);

  // Function to get status color based on jet status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  // Show loading state
  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Jets</h2>
          <Button
            disabled
            className="bg-[#DAFF0D] hover:brightness-105 text-black opacity-50"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Jet
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-[#0D0D0D] border-gray-800">
              <CardHeader>
                <Skeleton className="h-5 w-40 bg-gray-800" />
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative mb-4">
                  <Skeleton className="h-full w-full bg-gray-800" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-gray-800" />
                  <Skeleton className="h-4 w-3/4 bg-gray-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Jets</h2>
          <Button
            onClick={() => router.push('/jets/models')}
            className="bg-[#DAFF0D] hover:brightness-105 text-black"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Jet
          </Button>
        </div>
        
        <Card className="bg-[#0D0D0D] border-red-900 p-6">
          <div className="flex items-center space-x-4 text-red-400">
            <AlertTriangle className="h-8 w-8" />
            <div>
              <h3 className="text-lg font-semibold">Error Loading Jets</h3>
              <p>{error}</p>
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <Button 
              onClick={() => {
                setRetryCount(prev => prev + 1);
              }} 
              className="bg-red-900/60 hover:bg-red-900 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            
            {error.includes('Authentication') && (
              <Button 
                onClick={() => {
                  const timestamp = Date.now();
                  router.push(`/auth/login?returnUrl=/jets&t=${timestamp}`);
                }}
                className="bg-blue-900/60 hover:bg-blue-900 text-white"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Show empty state
  if (jets.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Jets</h2>
          <Button
            onClick={() => router.push('/jets/models')}
            className="bg-[#DAFF0D] hover:brightness-105 text-black"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Jet
          </Button>
        </div>
        
        <Card className="bg-[#0D0D0D] border-gray-800 p-6 text-center">
          <div className="flex flex-col items-center py-10">
            <div className="rounded-full bg-gray-900 p-4 mb-4">
              <Plane className="h-10 w-10" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Jets Found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              You currently don't have any jets in your fleet. Add your first jet to start managing your aircraft in GDY UP.
            </p>
            <Button
              onClick={() => router.push('/jets/models')}
              className="bg-[#DAFF0D] hover:brightness-105 text-black"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Browse Aircraft Models
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show jets
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Jets ({jets.length})</h2>
        <Button
          onClick={() => router.push('/jets/models')}
          className="bg-[#DAFF0D] hover:brightness-105 text-black"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Jet
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jets.map((jet) => (
          <Card key={jet.id} className="bg-[#0D0D0D] border-gray-800 overflow-hidden">
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
                  <Plane className="h-12 w-12 text-gray-600" />
                </div>
              )}
              <Badge className={`${getStatusColor(jet.status)} absolute top-2 right-2`}>
                {jet.status}
              </Badge>
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-bold text-lg">
                  {jet.manufacturer} {jet.model}
                </CardTitle>
                <Badge variant="outline" className="bg-gray-900/80 border-gray-700">
                  {jet.category}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tail Number</span>
                  <span className="text-gray-200 font-medium">{jet.tail_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Year</span>
                  <span className="text-gray-200 font-medium">{jet.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Capacity</span>
                  <span className="text-gray-200 font-medium">{jet.capacity} seats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Home Base</span>
                  <span className="text-gray-200 font-medium">{jet.home_base_airport}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t border-gray-800 pt-4">
              <div className="flex space-x-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/jets/${jet.id}`)}
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/jets/${jet.id}/edit`)}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4" style={{ color: primaryColor }} />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 
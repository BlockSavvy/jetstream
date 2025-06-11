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
import { useGdyupTheme } from '../app/gdyup/hooks/useGdyupTheme';

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
  const { 
    getThemedButtonClasses, 
    getThemedTextClasses, 
    getThemedBackgroundClasses, 
    getThemedBadgeClasses 
  } = useGdyupTheme();
  const [jets, setJets] = useState<Jet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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
  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'secondary' | 'primary' => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'reserved':
        return 'primary';
      default:
        return 'secondary';
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
            className={getThemedButtonClasses('primary', 'md') + " opacity-50"}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Jet
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className={getThemedBackgroundClasses('card')}>
              <CardHeader>
                <Skeleton className="h-5 w-40 bg-gdyup-bg-card" />
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative mb-4">
                  <Skeleton className="h-full w-full bg-gdyup-bg-card" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-gdyup-bg-card" />
                  <Skeleton className="h-4 w-3/4 bg-gdyup-bg-card" />
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
            onClick={() => router.push('/gdyup/jets/models')}
            className={getThemedButtonClasses('primary')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Jet
          </Button>
        </div>
        
        <Card className={getThemedBackgroundClasses('card') + " border-gdyup-secondary p-6"}>
          <div className="flex items-center space-x-4 gdyup-secondary">
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
              className={getThemedButtonClasses('destructive')}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            
            {error.includes('Authentication') && (
              <Button 
                onClick={() => {
                  const timestamp = Date.now();
                  router.push(`/auth/login?returnUrl=/gdyup/jets&t=${timestamp}`);
                }}
                className={getThemedButtonClasses('secondary')}
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
            onClick={() => router.push('/gdyup/jets/models')}
            className={getThemedButtonClasses('primary')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Jet
          </Button>
        </div>
        
        <Card className={getThemedBackgroundClasses('card') + " p-6 text-center"}>
          <div className="flex flex-col items-center py-10">
            <div className="rounded-full bg-gdyup-bg-card p-4 mb-4">
              <Plane className={`h-10 w-10 ${getThemedTextClasses('primary')}`} />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Jets Found</h3>
            <p className={`${getThemedTextClasses('muted')} mb-6 max-w-md mx-auto`}>
              You currently don't have any jets in your fleet. Add your first jet to start managing your aircraft in GDY UP.
            </p>
            <Button
              onClick={() => router.push('/gdyup/jets/models')}
              className={getThemedButtonClasses('primary')}
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
          onClick={() => router.push('/gdyup/jets/models')}
          className={getThemedButtonClasses('primary')}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Jet
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jets.map((jet) => (
          <Card key={jet.id} className={getThemedBackgroundClasses('card') + " overflow-hidden"}>
            <div className="aspect-video relative">
              {jet.image_url ? (
                <Image
                  src={jet.image_url}
                  alt={`${jet.manufacturer} ${jet.model}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-gdyup-bg-card">
                  <Plane className={`h-12 w-12 ${getThemedTextClasses('muted')}`} />
                </div>
              )}
              <Badge className={`${getThemedBadgeClasses(getStatusBadgeVariant(jet.status))} absolute top-2 right-2`}>
                {jet.status}
              </Badge>
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-bold text-lg">
                  {jet.manufacturer} {jet.model}
                </CardTitle>
                <Badge className={getThemedBadgeClasses('secondary')}>
                  {jet.category}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={getThemedTextClasses('muted')}>Tail Number</span>
                  <span className="gdyup-primary font-medium">{jet.tail_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className={getThemedTextClasses('muted')}>Year</span>
                  <span className="gdyup-primary font-medium">{jet.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className={getThemedTextClasses('muted')}>Capacity</span>
                  <span className="gdyup-primary font-medium">{jet.capacity} seats</span>
                </div>
                <div className="flex justify-between">
                  <span className={getThemedTextClasses('muted')}>Home Base</span>
                  <span className="gdyup-primary font-medium">{jet.home_base_airport}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gdyup-bg-card border-t pt-4">
              <div className="flex space-x-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/gdyup/jets/${jet.id}`)}
                  className={'flex-1 ' + getThemedButtonClasses('outline')}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/gdyup/jets/${jet.id}/edit`)}
                  className={getThemedButtonClasses('outline')}
                >
                  <Settings className="h-4 w-4 gdyup-primary" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 
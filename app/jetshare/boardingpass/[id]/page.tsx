'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plane, Ticket, Wallet, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function BoardingPassPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isTestMode = searchParams.get('test') === 'true';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [boardingPass, setBoardingPass] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch boarding pass details
  useEffect(() => {
    async function fetchBoardingPass() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const testParam = isTestMode ? '&test=true' : '';
        const response = await fetch(`/api/jetshare/generateBoardingPass?offerId=${id}${testParam}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch boarding pass details');
        }
        
        const data = await response.json();
        setBoardingPass(data.boardingPass);
      } catch (err) {
        console.error('Error fetching boarding pass:', err);
        setError('Unable to load boarding pass details');
        toast.error('Error loading boarding pass details');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBoardingPass();
  }, [id, isTestMode]);
  
  const downloadBoardingPass = async () => {
    setIsDownloading(true);
    
    try {
      const testParam = isTestMode ? '&test=true' : '';
      window.open(`/api/jetshare/mockBoardingPass?id=${id}${testParam}`, '_blank');
      toast.success('Boarding pass downloaded');
    } catch (err) {
      console.error('Error downloading boarding pass:', err);
      toast.error('Failed to download boarding pass');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const addToAppleWallet = async () => {
    setIsWalletLoading(true);
    
    try {
      const testParam = isTestMode ? '&test=true' : '';
      window.open(`/api/jetshare/appleWallet?id=${id}${testParam}`, '_blank');
      toast.success('Boarding pass added to Apple Wallet', {
        description: isTestMode ? 'Test mode: This is a simulated Apple Wallet pass' : undefined
      });
    } catch (err) {
      console.error('Error adding to Apple Wallet:', err);
      toast.error('Failed to add to Apple Wallet');
    } finally {
      setIsWalletLoading(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2 p-2" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Boarding Pass</h1>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2 p-2" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Boarding Pass</h1>
        </div>
        
        <Card className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Unable to Load Boarding Pass</h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <Button 
              onClick={() => router.push('/jetshare/dashboard?tab=bookings')}
              className="mt-2"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render boarding pass
  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-2" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold dark:text-high-contrast">Boarding Pass</h1>
      </div>
      
      {isTestMode && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md text-blue-700 dark:text-blue-200">
          <p className="text-sm font-medium">Test Mode Active</p>
          <p className="text-xs">This is a test boarding pass and not valid for actual travel.</p>
        </div>
      )}
      
      <Card className="border-amber-200 dark:border-amber-700 mb-6 jetstream-card overflow-hidden">
        <div className="h-2 bg-amber-500 w-full"></div>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center justify-between">
                <div className="flex items-center">
                  <Plane className="h-5 w-5 mr-2 rotate-90" />
                  Flight {boardingPass?.flightNumber || 'JS1234'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  Flight #{id?.substring(0, 6)}
                </div>
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {boardingPass ? format(new Date(boardingPass.departureTime), 'EEEE, MMMM d, yyyy') : new Date().toDateString()}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full border border-green-200 dark:border-green-700">
              <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirmed
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">FROM</p>
              <p className="text-lg font-semibold">{boardingPass?.departureLocation?.split(' ')[0] || 'JFK'}</p>
              <p className="text-xs">{boardingPass?.departureLocation || 'New York'}</p>
            </div>
            
            <div className="flex-1 px-4">
              <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 relative">
                <Plane className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 text-amber-500 dark:text-amber-400 h-6 w-6 rotate-90" />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">TO</p>
              <p className="text-lg font-semibold">{boardingPass?.arrivalLocation?.split(' ')[0] || 'LAX'}</p>
              <p className="text-xs">{boardingPass?.arrivalLocation || 'Los Angeles'}</p>
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">PASSENGER</p>
                <p className="font-medium">{boardingPass?.passengerName || 'GUEST'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">SEAT</p>
                <p className="font-medium">{boardingPass?.seat || '1A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">GATE</p>
                <p className="font-medium">{boardingPass?.gate || 'G12'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">BOARDING</p>
                <p className="font-medium">
                  {boardingPass?.boardingTime 
                    ? format(new Date(boardingPass.boardingTime), 'h:mm a') 
                    : '9:00 AM'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">BOARDING PASS ID</p>
            <p className="font-mono text-sm">{boardingPass?.barcode || `JSBP-${id}`}</p>
            <div className="mt-2 bg-gray-100 dark:bg-gray-800 rounded py-3 text-center">
              <p className="font-mono text-sm">|||||||||||||||||||||||||||||||||||||||</p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 border-t dark:border-gray-700 pt-6">
          <Button 
            className="w-full sm:w-auto"
            onClick={downloadBoardingPass}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Boarding Pass
              </>
            )}
          </Button>
          
          <Button 
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={addToAppleWallet}
            disabled={isWalletLoading}
          >
            {isWalletLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Add to Apple Wallet
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="flex justify-center">
        <Button 
          variant="outline"
          onClick={() => router.push('/jetshare/dashboard?tab=bookings')}
        >
          Back to My Bookings
        </Button>
      </div>
    </div>
  );
} 
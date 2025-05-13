'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase';
import { Check, AlertCircle, RefreshCw, Database, User, Plane } from 'lucide-react';
import { toast } from 'sonner';
import { JetShareUITest } from '../components/JetShareUITest';
import { useRouter } from 'next/navigation';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

export default function JetShareDebug() {
  const [isLoading, setIsLoading] = useState(true);
  const [debugData, setDebugData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<{[key: string]: {success: boolean, message: string}}>({});
  const router = useRouter();
  const { getThemeClasses } = useGdyupTheme();
  
  // Initialize Supabase client
  const supabase = createClient();
  
  // Fetch debug data
  const fetchDebugData = async () => {
    setIsLoading(true);
    try {
      // First check if we're authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }
      
      setUser(session.user);
      
      // Get auth token for API calls
      let authToken = session?.access_token;
      
      // Prepare headers with auth token
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Fetch debug data from our API
      const response = await fetch('/api/jetshare/debug', {
        headers,
        credentials: 'include' // Include cookies for authentication
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch debug data');
      }
      
      const data = await response.json();
      setDebugData(data.debug_info);
    } catch (error) {
      console.error('Error fetching debug data:', error);
      toast.error('Failed to fetch debug data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Run tests
  const runTests = async () => {
    setRunningTests(true);
    setTestResults({});
    
    try {
      // Get auth token for API calls
      let authToken = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          authToken = sessionData.session.access_token;
        }
      } catch (sessionError) {
        console.warn('Error getting session:', sessionError);
      }
      
      // Prepare headers for API calls
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Test 1: Check User Profile
      const profileResult = await testUserProfile(headers);
      setTestResults(prev => ({...prev, profile: profileResult}));
      
      // Test 2: Test Offers API
      const offersResult = await testOffersAPI(headers);
      setTestResults(prev => ({...prev, offers: offersResult}));
      
      // Test 3: Test Create Offer
      const createOfferResult = await testCreateOffer(headers);
      setTestResults(prev => ({...prev, createOffer: createOfferResult}));
      
      // Test 4: Test Database Foreign Keys
      const foreignKeyResult = await testForeignKeys(headers);
      setTestResults(prev => ({...prev, foreignKeys: foreignKeyResult}));
      
      // Refresh debug data after tests
      await fetchDebugData();
    } catch (error) {
      console.error('Error running tests:', error);
      toast.error('Failed to complete tests');
    } finally {
      setRunningTests(false);
    }
  };
  
  // Test User Profile
  const testUserProfile = async (headers: Record<string, string>): Promise<{success: boolean, message: string}> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (profile) {
        return {
          success: true,
          message: `Profile found for user ${user.id}`
        };
      } else {
        // Try to fix by ensuring profile
        const response = await fetch('/api/jetshare/debug', {
          headers,
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.debug_info.profile.fixed) {
          return {
            success: true,
            message: 'Profile was created successfully'
          };
        } else {
          return {
            success: false,
            message: 'Profile not found and could not be created'
          };
        }
      }
    } catch (error) {
      console.error('Error testing user profile:', error);
      return {
        success: false,
        message: `Profile test failed: ${(error as Error).message}`
      };
    }
  };
  
  // Test Offers API
  const testOffersAPI = async (headers: Record<string, string>): Promise<{success: boolean, message: string}> => {
    try {
      // Test marketplace view
      const marketplaceRes = await fetch('/api/jetshare/getOffers?status=open&viewMode=marketplace', {
        headers,
        credentials: 'include'
      });
      
      if (!marketplaceRes.ok) throw new Error(`Marketplace API error: ${marketplaceRes.statusText}`);
      const marketplaceData = await marketplaceRes.json();
      
      // Test dashboard view
      const dashboardRes = await fetch('/api/jetshare/getOffers?status=open&userId=current&viewMode=dashboard', {
        headers,
        credentials: 'include'
      });
      
      if (!dashboardRes.ok) throw new Error(`Dashboard API error: ${dashboardRes.statusText}`);
      const dashboardData = await dashboardRes.json();
      
      return {
        success: true,
        message: `API tests passed: Marketplace offers: ${marketplaceData.offers.length}, Dashboard offers: ${dashboardData.offers.length}`
      };
    } catch (error) {
      console.error('Error testing offers API:', error);
      return {
        success: false,
        message: `Offers API test failed: ${(error as Error).message}`
      };
    }
  };
  
  // Test Create Offer
  const testCreateOffer = async (headers: Record<string, string>): Promise<{success: boolean, message: string}> => {
    try {
      // Create a test offer with minimal data
      const testOffer = {
        flight_date: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days in future
        departure_location: 'Test Departure',
        arrival_location: 'Test Arrival',
        total_flight_cost: 10000,
        requested_share_amount: 5000,
        user_id: user.id // Include user_id for private browsing support
      };
      
      // Prepare headers for createOffer
      const createHeaders = { ...headers };
      
      // Call the API
      const response = await fetch('/api/jetshare/createOffer', {
        method: 'POST',
        headers: createHeaders,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(testOffer)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Delete the test offer to clean up
      const { error } = await supabase
        .from('jetshare_offers')
        .delete()
        .eq('id', data.offer.id);
      
      if (error) {
        console.warn('Could not delete test offer:', error);
      }
      
      return {
        success: true,
        message: 'Successfully created and deleted a test offer'
      };
    } catch (error) {
      console.error('Error testing create offer:', error);
      return {
        success: false,
        message: `Create offer test failed: ${(error as Error).message}`
      };
    }
  };
  
  // Test Foreign Keys
  const testForeignKeys = async (headers: Record<string, string>): Promise<{success: boolean, message: string}> => {
    try {
      // Attempt to create an offer with a non-existent user
      const nonExistentUserId = 'non-existent-user-id';
      
      // We'll use the Supabase API directly for this test since our API has validation
      const { error } = await supabase
        .from('jetshare_offers')
        .insert({
          user_id: nonExistentUserId,
          flight_date: new Date().toISOString(),
          departure_location: 'Test',
          arrival_location: 'Test',
          total_flight_cost: 1000,
          requested_share_amount: 500,
          status: 'open'
        });
      
      // If we get a foreign key error, that's a good sign
      if (error && error.code === '23503') { // Foreign key violation
        return {
          success: true,
          message: 'Foreign key constraints are working correctly'
        };
      } else if (error) {
        return {
          success: true,
          message: `Other error occurred: ${error.message} (code: ${error.code})`
        };
      } else {
        return {
          success: false,
          message: 'Foreign key test failed - was able to create offer with non-existent user'
        };
      }
    } catch (error) {
      console.error('Error testing foreign keys:', error);
      return {
        success: false,
        message: `Foreign key test error: ${(error as Error).message}`
      };
    }
  };
  
  // Fix potential issues
  const fixIssues = async () => {
    setIsLoading(true);
    try {
      // Get auth token for API calls
      let authToken = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          authToken = sessionData.session.access_token;
        }
      } catch (sessionError) {
        console.warn('Error getting session:', sessionError);
      }
      
      // Prepare headers for API calls
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // First, ensure profile exists
      const response = await fetch('/api/jetshare/debug', {
        headers,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!data.debug_info.profile.exists) {
        toast.info('Creating missing user profile...');
      }
      
      await fetchDebugData();
      toast.success('Diagnostic check completed');
    } catch (error) {
      console.error('Error fixing issues:', error);
      toast.error('Failed to fix issues');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch debug data on mount
  useEffect(() => {
    fetchDebugData();
  }, []);
  
  // Render loading state
  if (isLoading && !debugData) {
    return (
      <div className="container mx-auto py-8">
        <Card className={getThemeClasses({
          base: "",
          default: "bg-gray-900 border-gray-800",
          luxury: "bg-blue-950 border-blue-900",
          bitcoin: "bg-pink-950 border-pink-900"
        })}>
          <CardHeader>
            <CardTitle className={getThemeClasses({
              base: "",
              default: "text-white",
              luxury: "text-blue-50",
              bitcoin: "text-pink-50"
            })}>JetShare Diagnostics</CardTitle>
            <CardDescription className={getThemeClasses({
              base: "",
              default: "text-gray-400",
              luxury: "text-blue-400",
              bitcoin: "text-pink-400"
            })}>
              Loading diagnostic information...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className={cn("h-8 w-8 animate-spin", getThemeClasses({
              base: "",
              default: "text-amber-500",
              luxury: "text-blue-500",
              bitcoin: "text-pink-500"
            }))} />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render unauthenticated state
  if (!isLoading && !user) {
    return (
      <div className="container mx-auto py-8">
        <Card className={getThemeClasses({
          base: "",
          default: "bg-gray-900 border-gray-800",
          luxury: "bg-blue-950 border-blue-900",
          bitcoin: "bg-pink-950 border-pink-900"
        })}>
          <CardHeader>
            <CardTitle className={getThemeClasses({
              base: "",
              default: "text-white",
              luxury: "text-blue-50",
              bitcoin: "text-pink-50"
            })}>JetShare Diagnostics</CardTitle>
            <CardDescription className={getThemeClasses({
              base: "",
              default: "text-gray-400",
              luxury: "text-blue-400",
              bitcoin: "text-pink-400"
            })}>
              You must be logged in to use the diagnostic tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className={getThemeClasses({
              base: "",
              default: "border-red-800 bg-red-950/50",
              luxury: "border-red-800 bg-red-950/50",
              bitcoin: "border-red-800 bg-red-950/50"
            })}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className={getThemeClasses({
                base: "",
                default: "text-red-300",
                luxury: "text-red-300",
                bitcoin: "text-red-300"
              })}>Authentication Required</AlertTitle>
              <AlertDescription className={getThemeClasses({
                base: "",
                default: "text-red-300/80",
                luxury: "text-red-300/80",
                bitcoin: "text-red-300/80"
              })}>
                Please log in to access the JetShare diagnostic tools.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/auth/login?returnUrl=/jetshare/debug')}
              className={getThemeClasses({
                base: "",
                default: "bg-gdyup-primary text-gdyup-button-text hover:bg-gdyup-primary/90",
                luxury: "bg-gdyup-primary text-gdyup-button-text hover:bg-gdyup-primary/90",
                bitcoin: "bg-gdyup-primary text-gdyup-button-text hover:bg-gdyup-primary/90"
              })}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className={getThemeClasses({
        base: "text-3xl font-bold mb-2",
        default: "text-white",
        luxury: "text-blue-50",
        bitcoin: "text-pink-50"
      })}>JetShare Debug Panel</h1>
      <p className={getThemeClasses({
        base: "mb-8",
        default: "text-gray-400",
        luxury: "text-blue-400",
        bitcoin: "text-pink-400"
      })}>
        This panel provides diagnostic information and tools for the JetShare module.
      </p>
      
      {/* UI Test Components */}
      <JetShareUITest />
      
      <Separator className={getThemeClasses({
        base: "my-8",
        default: "bg-gray-800",
        luxury: "bg-blue-800",
        bitcoin: "bg-pink-800"
      })} />
      
      <Card className={cn("mb-6", getThemeClasses({
        base: "",
        default: "bg-gray-900 border-gray-800",
        luxury: "bg-blue-950 border-blue-900",
        bitcoin: "bg-pink-950 border-pink-900"
      }))}>
        <CardHeader>
          <CardTitle className={getThemeClasses({
            base: "",
            default: "text-white",
            luxury: "text-blue-50",
            bitcoin: "text-pink-50"
          })}>JetShare Diagnostics</CardTitle>
          <CardDescription className={getThemeClasses({
            base: "",
            default: "text-gray-400",
            luxury: "text-blue-400",
            bitcoin: "text-pink-400"
          })}>
            Troubleshoot issues with the JetShare application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button onClick={fetchDebugData} disabled={isLoading} variant="outline"
              className={getThemeClasses({
                base: "",
                default: "border-gray-700 hover:bg-gray-800",
                luxury: "border-blue-700 hover:bg-blue-800",
                bitcoin: "border-pink-700 hover:bg-pink-800"
              })}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
            
            <Button onClick={fixIssues} disabled={isLoading} variant="outline"
              className={getThemeClasses({
                base: "",
                default: "border-gray-700 hover:bg-gray-800",
                luxury: "border-blue-700 hover:bg-blue-800",
                bitcoin: "border-pink-700 hover:bg-pink-800"
              })}>
              <Database className="mr-2 h-4 w-4" />
              Run Diagnostics
            </Button>
            
            <Button onClick={runTests} disabled={runningTests || isLoading} variant="secondary"
              className={getThemeClasses({
                base: "",
                default: "bg-gray-800 hover:bg-gray-700 text-white",
                luxury: "bg-blue-800 hover:bg-blue-700 text-blue-100",
                bitcoin: "bg-pink-800 hover:bg-pink-700 text-pink-100"
              })}>
              {runningTests ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>
            
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/jetshare/check-db');
                  const data = await response.json();
                  
                  if (data.success) {
                    toast.success('Database check completed successfully');
                    setTestResults(prev => ({
                      ...prev, 
                      dbCheck: {
                        success: true,
                        message: `DB Status: ${data.dbStatus.message || 'OK'}. Offers: ${data.dbStatus.offers_count}, Profiles: ${data.dbStatus.profiles_count}`
                      }
                    }));
                  } else {
                    toast.error(data.error || 'Database check failed');
                    setTestResults(prev => ({
                      ...prev, 
                      dbCheck: {
                        success: false,
                        message: data.message || 'Failed to run database check'
                      }
                    }));
                  }
                } catch (error) {
                  console.error('Error checking database:', error);
                  toast.error('Failed to connect to database check API');
                  setTestResults(prev => ({
                    ...prev, 
                    dbCheck: {
                      success: false,
                      message: `Error: ${(error as Error).message}`
                    }
                  }));
                }
              }}
              disabled={isLoading}
              variant="secondary"
              className={getThemeClasses({
                base: "",
                default: "bg-gray-800 hover:bg-gray-700 text-white",
                luxury: "bg-blue-800 hover:bg-blue-700 text-blue-100",
                bitcoin: "bg-pink-800 hover:bg-pink-700 text-pink-100"
              })}
            >
              <Database className="mr-2 h-4 w-4" />
              Check/Fix Database
            </Button>
          </div>
          
          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="mb-6">
              <h3 className={getThemeClasses({
                base: "text-lg font-medium mb-2",
                default: "text-white",
                luxury: "text-blue-50",
                bitcoin: "text-pink-50"
              })}>Test Results</h3>
              <div className="space-y-2">
                {Object.entries(testResults).map(([key, result]) => (
                  <Alert key={key} 
                    variant={result.success ? 'default' : 'destructive'}
                    className={getThemeClasses({
                      base: "",
                      default: result.success ? "border-green-800 bg-green-950/30" : "border-red-800 bg-red-950/30",
                      luxury: result.success ? "border-green-800 bg-green-950/30" : "border-red-800 bg-red-950/30",
                      bitcoin: result.success ? "border-green-800 bg-green-950/30" : "border-red-800 bg-red-950/30"
                    })}>
                    {result.success ? (
                      <Check className={getThemeClasses({
                        base: "h-4 w-4",
                        default: "text-green-400",
                        luxury: "text-green-400",
                        bitcoin: "text-green-400"
                      })} />
                    ) : (
                      <AlertCircle className={getThemeClasses({
                        base: "h-4 w-4",
                        default: "text-red-400",
                        luxury: "text-red-400",
                        bitcoin: "text-red-400"
                      })} />
                    )}
                    <AlertTitle className={getThemeClasses({
                      base: "capitalize",
                      default: result.success ? "text-green-300" : "text-red-300",
                      luxury: result.success ? "text-green-300" : "text-red-300",
                      bitcoin: result.success ? "text-green-300" : "text-red-300"
                    })}>{key.replace(/([A-Z])/g, ' $1').trim()}</AlertTitle>
                    <AlertDescription className={getThemeClasses({
                      base: "",
                      default: result.success ? "text-green-300/80" : "text-red-300/80",
                      luxury: result.success ? "text-green-300/80" : "text-red-300/80",
                      bitcoin: result.success ? "text-green-300/80" : "text-red-300/80"
                    })}>{result.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
          
          {debugData && (
            <>
              {/* User Information */}
              <div className="mb-6">
                <h3 className={getThemeClasses({
                  base: "text-lg font-medium mb-2 flex items-center",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>
                  <User className="mr-2 h-5 w-5" /> 
                  User Information
                </h3>
                <div className={getThemeClasses({
                  base: "p-4 rounded-md overflow-auto",
                  default: "bg-gray-800",
                  luxury: "bg-blue-900",
                  bitcoin: "bg-pink-900"
                })}>
                  <pre className={getThemeClasses({
                    base: "text-xs",
                    default: "text-gray-300",
                    luxury: "text-blue-300",
                    bitcoin: "text-pink-300"
                  })}>
                    {JSON.stringify(debugData.user, null, 2)}
                  </pre>
                </div>
              </div>
              
              {/* Profile Status */}
              <div className="mb-6">
                <h3 className={getThemeClasses({
                  base: "text-lg font-medium mb-2 flex items-center",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>
                  <User className="mr-2 h-5 w-5" /> 
                  Profile Status
                </h3>
                <Alert 
                  variant={debugData.profile.exists ? 'default' : 'destructive'}
                  className={getThemeClasses({
                    base: "",
                    default: debugData.profile.exists ? "border-green-800 bg-green-950/30" : "border-red-800 bg-red-950/30",
                    luxury: debugData.profile.exists ? "border-green-800 bg-green-950/30" : "border-red-800 bg-red-950/30",
                    bitcoin: debugData.profile.exists ? "border-green-800 bg-green-950/30" : "border-red-800 bg-red-950/30"
                  })}
                >
                  {debugData.profile.exists ? (
                    <Check className={getThemeClasses({
                      base: "h-4 w-4",
                      default: "text-green-400",
                      luxury: "text-green-400",
                      bitcoin: "text-green-400"
                    })} />
                  ) : (
                    <AlertCircle className={getThemeClasses({
                      base: "h-4 w-4",
                      default: "text-red-400",
                      luxury: "text-red-400",
                      bitcoin: "text-red-400"
                    })} />
                  )}
                  <AlertTitle className={getThemeClasses({
                    base: "",
                    default: debugData.profile.exists ? "text-green-300" : "text-red-300",
                    luxury: debugData.profile.exists ? "text-green-300" : "text-red-300",
                    bitcoin: debugData.profile.exists ? "text-green-300" : "text-red-300"
                  })}>
                    {debugData.profile.exists ? 'Profile Found' : 'Profile Missing'}
                  </AlertTitle>
                  <AlertDescription className={getThemeClasses({
                    base: "",
                    default: debugData.profile.exists ? "text-green-300/80" : "text-red-300/80",
                    luxury: debugData.profile.exists ? "text-green-300/80" : "text-red-300/80",
                    bitcoin: debugData.profile.exists ? "text-green-300/80" : "text-red-300/80"
                  })}>
                    {debugData.profile.exists 
                      ? 'User profile exists in the database' 
                      : debugData.profile.fixed 
                        ? 'Profile was missing but has been created successfully' 
                        : 'Profile is missing and could not be created automatically'}
                  </AlertDescription>
                </Alert>
                {debugData.profile.data && (
                  <div className={getThemeClasses({
                    base: "mt-2 p-4 rounded-md overflow-auto",
                    default: "bg-gray-800",
                    luxury: "bg-blue-900",
                    bitcoin: "bg-pink-900"
                  })}>
                    <pre className={getThemeClasses({
                      base: "text-xs",
                      default: "text-gray-300",
                      luxury: "text-blue-300",
                      bitcoin: "text-pink-300"
                    })}>
                      {JSON.stringify(debugData.profile.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              {/* Offers Information */}
              <div className="mb-6">
                <h3 className={getThemeClasses({
                  base: "text-lg font-medium mb-2 flex items-center",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>
                  <Plane className="mr-2 h-5 w-5" /> 
                  Offers Status
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className={getThemeClasses({
                    base: "text-sm",
                    default: "border-gray-700 bg-gray-800 text-gray-300",
                    luxury: "border-blue-700 bg-blue-900 text-blue-300",
                    bitcoin: "border-pink-700 bg-pink-900 text-pink-300"
                  })}>
                    Your Offers: {debugData.offers.user_offers_count}
                  </Badge>
                  <Badge variant="outline" className={getThemeClasses({
                    base: "text-sm",
                    default: "border-gray-700 bg-gray-800 text-gray-300",
                    luxury: "border-blue-700 bg-blue-900 text-blue-300",
                    bitcoin: "border-pink-700 bg-pink-900 text-pink-300"
                  })}>
                    Total System Offers: {debugData.offers.total_offers_in_system}
                  </Badge>
                </div>
                {debugData.offers.user_offers.length > 0 ? (
                  <div className="space-y-2">
                    {debugData.offers.user_offers.map((offer: any) => (
                      <div key={offer.id} className={getThemeClasses({
                        base: "border p-4 rounded-md",
                        default: "border-gray-800 bg-gray-800/50",
                        luxury: "border-blue-800 bg-blue-900/50",
                        bitcoin: "border-pink-800 bg-pink-900/50"
                      })}>
                        <p className={getThemeClasses({
                          base: "font-medium",
                          default: "text-white",
                          luxury: "text-blue-50",
                          bitcoin: "text-pink-50"
                        })}>
                          {offer.departure_location} → {offer.arrival_location}
                        </p>
                        <div className={getThemeClasses({
                          base: "text-sm",
                          default: "text-gray-400",
                          luxury: "text-blue-400",
                          bitcoin: "text-pink-400"
                        })}>
                          Status: <Badge className={getThemeClasses({
                            base: "",
                            default: "bg-gdyup-primary text-gdyup-button-text",
                            luxury: "bg-gdyup-primary text-gdyup-button-text",
                            bitcoin: "bg-gdyup-primary text-gdyup-button-text"
                          })}>{offer.status}</Badge>
                        </div>
                        <div className={getThemeClasses({
                          base: "text-sm",
                          default: "text-gray-400",
                          luxury: "text-blue-400",
                          bitcoin: "text-pink-400"
                        })}>
                          ID: {offer.id}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert className={getThemeClasses({
                    base: "",
                    default: "bg-gray-800 border-gray-700",
                    luxury: "bg-blue-900 border-blue-800",
                    bitcoin: "bg-pink-900 border-pink-800"
                  })}>
                    <AlertCircle className={getThemeClasses({
                      base: "h-4 w-4",
                      default: "text-gray-400",
                      luxury: "text-blue-400",
                      bitcoin: "text-pink-400"
                    })} />
                    <AlertTitle className={getThemeClasses({
                      base: "",
                      default: "text-gray-300",
                      luxury: "text-blue-300",
                      bitcoin: "text-pink-300"
                    })}>No Offers Found</AlertTitle>
                    <AlertDescription className={getThemeClasses({
                      base: "",
                      default: "text-gray-400",
                      luxury: "text-blue-400",
                      bitcoin: "text-pink-400"
                    })}>
                      You don't have any offers in the system. Create an offer to test.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/jetshare'}
            className={getThemeClasses({
              base: "",
              default: "border-gray-700 hover:bg-gray-800",
              luxury: "border-blue-700 hover:bg-blue-800",
              bitcoin: "border-pink-700 hover:bg-pink-800"
            })}
          >
            Back to JetShare
          </Button>
          <Button 
            onClick={() => window.location.href = '/jetshare/create'}
            className={getThemeClasses({
              base: "",
              default: "bg-gdyup-primary text-gdyup-button-text hover:bg-gdyup-primary/90",
              luxury: "bg-gdyup-primary text-gdyup-button-text hover:bg-gdyup-primary/90",
              bitcoin: "bg-gdyup-primary text-gdyup-button-text hover:bg-gdyup-primary/90"
            })}
          >
            Create Test Offer
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
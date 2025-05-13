'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

export default function AuthTestPage() {
  const { user, loading, refreshSession } = useAuth();
  const [tokenData, setTokenData] = useState<any>(null);
  const [instanceId, setInstanceId] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();
  
  // Theme helpers
  const { 
    getThemedTextClasses, 
    getThemedButtonClasses, 
    getThemedBackgroundClasses
  } = useGdyupTheme();
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };
  
  useEffect(() => {
    // Check for localStorage data
    try {
      const storedToken = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
      setTokenData(storedToken ? JSON.parse(storedToken) : null);
      
      const storedInstanceId = localStorage.getItem('jetstream_instance_id');
      setInstanceId(storedInstanceId || 'Not set');
      
      addLog(`Auth loaded: User ${user ? 'found' : 'not found'}`);
      addLog(`Instance ID: ${storedInstanceId || 'Not set'}`);
    } catch (error) {
      addLog(`Error accessing localStorage: ${error}`);
    }
  }, [user]);
  
  const handleRefreshSession = async () => {
    try {
      addLog('Attempting to refresh session...');
      const result = await refreshSession();
      addLog(`Session refresh result: ${result ? 'Success' : 'Failed'}`);
      
      if (result) {
        // Re-check token data
        const storedToken = localStorage.getItem('sb-vjhrmizwqhmafkxbmfwa-auth-token');
        setTokenData(storedToken ? JSON.parse(storedToken) : null);
      }
    } catch (error) {
      addLog(`Error during refresh: ${error}`);
    }
  };
  
  const handleGenerateNewInstanceId = () => {
    try {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('jetstream_instance_id', uuid);
      setInstanceId(uuid);
      addLog(`Generated new instance ID: ${uuid}`);
    } catch (error) {
      addLog(`Error generating instance ID: ${error}`);
    }
  };
  
  const handleTestApiCall = async () => {
    try {
      addLog('Testing API call to JetShare...');
      
      const timestamp = Date.now();
      const requestId = Math.random().toString(36).substring(2, 8);
      
      // Use both instance ID and user ID for complete test
      const response = await fetch(`/api/jetshare/stats?t=${timestamp}&rid=${requestId}&instance_id=${instanceId}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Authorization': tokenData?.access_token ? `Bearer ${tokenData.access_token}` : ''
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog(`API call successful: ${JSON.stringify(data)}`);
      } else {
        addLog(`API call failed: ${response.status} - ${response.statusText}`);
        
        // Try to parse error response
        try {
          const errorData = await response.json();
          addLog(`Error details: ${JSON.stringify(errorData)}`);
        } catch (e) {
          addLog(`Could not parse error response`);
        }
      }
    } catch (error) {
      addLog(`Exception during API test: ${error}`);
    }
  };
  
  const handleDirectSessionCheck = async () => {
    try {
      addLog('Checking session directly from Supabase...');
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`Session check error: ${error.message}`);
      } else if (data.session) {
        addLog(`Session found: User ID ${data.session.user.id}`);
        addLog(`Session expiry: ${new Date(data.session.expires_at! * 1000).toISOString()}`);
      } else {
        addLog('No active session found');
      }
    } catch (error) {
      addLog(`Exception during session check: ${error}`);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card className={cn(
          getThemedBackgroundClasses('card'),
          "border border-gdyup-border"
        )}>
          <CardHeader>
            <CardTitle className={getThemedTextClasses()}>Authentication Test</CardTitle>
            <CardDescription className={getThemedTextClasses('muted')}>Loading authentication state...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <Card className={cn(
        "mb-6",
        getThemedBackgroundClasses('card'),
        "border border-gdyup-border"
      )}>
        <CardHeader>
          <CardTitle className={getThemedTextClasses()}>Authentication Test</CardTitle>
          <CardDescription className={getThemedTextClasses('muted')}>
            Test and debug authentication mechanisms for JetShare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={cn(
              "p-4 rounded-md",
              getThemedBackgroundClasses('secondary'),
              "border border-gdyup-border"
            )}>
              <h3 className={cn("font-medium mb-2", getThemedTextClasses())}>User Status</h3>
              {user ? (
                <div className="space-y-2">
                  <p className={getThemedTextClasses('success')}>✅ Authenticated</p>
                  <p className={getThemedTextClasses()}>User ID: {user.id}</p>
                  <p className={getThemedTextClasses()}>Email: {user.email}</p>
                </div>
              ) : (
                <p className={getThemedTextClasses('destructive')}>❌ Not authenticated</p>
              )}
            </div>
            
            <div className={cn(
              "p-4 rounded-md",
              getThemedBackgroundClasses('secondary'),
              "border border-gdyup-border"
            )}>
              <h3 className={cn("font-medium mb-2", getThemedTextClasses())}>Instance ID</h3>
              <p className={getThemedTextClasses()}>{instanceId}</p>
              <Button 
                onClick={handleGenerateNewInstanceId}
                variant="outline" 
                size="sm"
                className={cn("mt-2", getThemedButtonClasses('outline'))}
              >
                Generate New Instance ID
              </Button>
            </div>
            
            <div className={cn(
              "p-4 rounded-md",
              getThemedBackgroundClasses('secondary'),
              "border border-gdyup-border"
            )}>
              <h3 className={cn("font-medium mb-2", getThemedTextClasses())}>Auth Token Status</h3>
              {tokenData ? (
                <div className="space-y-2">
                  <p className={getThemedTextClasses('success')}>✅ Token found in localStorage</p>
                  <p className={getThemedTextClasses()}>Expires at: {tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toISOString() : 'Unknown'}</p>
                </div>
              ) : (
                <p className={getThemedTextClasses('destructive')}>❌ No token in localStorage</p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button className={getThemedButtonClasses()} onClick={handleRefreshSession}>
                Refresh Session
              </Button>
              <Button className={getThemedButtonClasses('outline')} onClick={handleDirectSessionCheck} variant="outline">
                Check Session
              </Button>
              <Button className={getThemedButtonClasses('outline')} onClick={handleTestApiCall} variant="outline">
                Test API Call
              </Button>
              <Button className={getThemedButtonClasses('secondary')} onClick={() => router.push('/jetshare/dashboard')} variant="secondary">
                Go to Dashboard
              </Button>
              <Button className={getThemedButtonClasses('secondary')} onClick={() => router.push('/auth/login')} variant="secondary">
                Go to Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className={cn(
        getThemedBackgroundClasses('card'),
        "border border-gdyup-border"
      )}>
        <CardHeader>
          <CardTitle className={getThemedTextClasses()}>Logs</CardTitle>
          <CardDescription className={getThemedTextClasses('muted')}>Action history and debug information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "h-[300px] overflow-y-auto p-4 rounded-md font-mono text-sm",
            getThemedBackgroundClasses('secondary')
          )}>
            {logs.length === 0 ? (
              <p className={getThemedTextClasses('muted')}>No logs yet</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={cn("pb-1", getThemedTextClasses())}>
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
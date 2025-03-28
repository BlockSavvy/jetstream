'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Code } from '@/components/ui/code';
import { Badge } from '@/components/ui/badge';
import { Terminal, Database, AlertTriangle, CheckCircle, RefreshCw, FileCode } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Development helper component for JetShare module
 * Provides tools for database setup, checking, and seeding
 */
export function DevModeHelpers() {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [sqlScript, setSqlScript] = useState<string | null>(null);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const checkDatabase = async () => {
    setLoadingAction('check');
    try {
      const response = await fetch('/api/jetshare/check-db');
      const data = await response.json();
      setDbStatus(data);
      
      if (data.success) {
        toast.success('Database check completed successfully');
      } else {
        toast.error('Database check found issues');
      }
    } catch (error) {
      console.error('Error checking database:', error);
      toast.error('Failed to check database status');
    } finally {
      setLoadingAction(null);
    }
  };
  
  const setupDatabase = async () => {
    setLoadingAction('setup');
    try {
      const response = await fetch('/api/jetshare/setup-db', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Database setup completed successfully');
        // Refresh database status
        checkDatabase();
      } else {
        if (data.sql) {
          setSqlScript(data.sql);
          toast.error('Please run the SQL script manually');
        } else {
          toast.error(data.message || 'Database setup failed');
        }
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      toast.error('Failed to setup database');
    } finally {
      setLoadingAction(null);
    }
  };
  
  const seedData = async () => {
    setLoadingAction('seed');
    try {
      const response = await fetch('/api/jetshare/seed', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Created ${data.offers?.length || 0} sample offers`);
      } else {
        toast.error(data.message || 'Failed to seed sample data');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed sample data');
    } finally {
      setLoadingAction(null);
    }
  };
  
  return (
    <Card className="border-dashed border-yellow-500 dark:border-yellow-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          JetShare Development Helpers
        </CardTitle>
        <CardDescription>
          These tools are only available in development mode and help troubleshoot JetShare functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="database">
          <TabsList className="mb-4">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="data">Sample Data</TabsTrigger>
            <TabsTrigger value="sql">SQL Scripts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="database">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkDatabase}
                  disabled={loadingAction === 'check'}
                >
                  {loadingAction === 'check' ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Check Database
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setupDatabase}
                  disabled={loadingAction === 'setup'}
                >
                  {loadingAction === 'setup' ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <FileCode className="mr-2 h-4 w-4" />
                      Setup/Repair Database
                    </>
                  )}
                </Button>
              </div>
              
              {dbStatus && (
                <Alert variant={dbStatus.success ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {dbStatus.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {dbStatus.success ? 'Database is healthy' : 'Database issues detected'}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="mt-2">
                    {dbStatus.message || dbStatus.error || 'Database check completed'}
                    
                    {dbStatus.dbStatus && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Function</Badge>
                          <span>{dbStatus.dbStatus.function_exists ? 'Available' : 'Missing'}</span>
                        </div>
                        
                        {typeof dbStatus.dbStatus.offers_count !== 'undefined' && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Offers</Badge>
                            <span>{dbStatus.dbStatus.offers_count}</span>
                          </div>
                        )}
                        
                        {typeof dbStatus.dbStatus.profiles_count !== 'undefined' && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Profiles</Badge>
                            <span>{dbStatus.dbStatus.profiles_count}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {dbStatus.instructions && (
                      <div className="mt-2 text-sm bg-muted p-2 rounded-md">
                        {dbStatus.instructions}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="data">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={seedData}
                  disabled={loadingAction === 'seed'}
                >
                  {loadingAction === 'seed' ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Sample Offers'
                  )}
                </Button>
              </div>
              
              <Alert>
                <AlertTitle>Sample Data Tools</AlertTitle>
                <AlertDescription>
                  Generate sample flight share offers to test the JetShare UI. 
                  These offers will be associated with your user account.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="sql">
            <div className="space-y-4">
              {sqlScript ? (
                <div>
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Manual SQL Required</AlertTitle>
                    <AlertDescription>
                      The API couldn't execute this SQL directly. Please copy and run this script in the Supabase SQL editor.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
                    <Code>{sqlScript}</Code>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTitle>SQL Scripts</AlertTitle>
                  <AlertDescription>
                    If database setup fails, the required SQL script will be displayed here for manual execution.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        These tools are only shown in development mode (NODE_ENV=development)
      </CardFooter>
    </Card>
  );
} 
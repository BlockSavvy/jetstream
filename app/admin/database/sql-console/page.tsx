'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase';
import { Spinner } from '@/components/ui/spinner';

export default function SqlConsolePage() {
  const [sqlText, setSqlText] = useState(`-- Example: Create a new table (Use with caution!)
-- CREATE TABLE IF NOT EXISTS example_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT now()
-- );

-- Example: Get table names
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename != 'schema_migrations';
`);
  
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const runSql = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch('/api/admin/database/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: sqlText }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute SQL');
      }
      
      setResults(data.result || []); // Expecting an array of results
    } catch (error: any) {
      console.error('Error executing SQL:', error);
      setError(error.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SQL Console</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Execute database migrations and run SQL queries (Use with caution)
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>SQL Query</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            placeholder="Enter your SQL query here..."
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={runSql} disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Running...
                </>
              ) : (
                'Run SQL'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}
      
      {results !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96 text-sm">
              {results.length > 0 
                ? JSON.stringify(results, null, 2)
                : 'Query executed successfully, no rows returned.'
              }
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
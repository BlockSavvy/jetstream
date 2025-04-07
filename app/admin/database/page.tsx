'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScatterChart } from 'lucide-react';
import Image from 'next/image';

export default function DatabaseExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [tableCounts, setTableCounts] = useState<{[key: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');
  const [isNarrating, setIsNarrating] = useState(false);
  const [schemaSummary, setSchemaSummary] = useState<any[]>([]);
  
  // Load table counts on mount
  useEffect(() => {
    const fetchTableCounts = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // Fetch row counts from RPC
        const { data, error } = await supabase.rpc('table_row_counts');
        
        if (error) {
          console.error('Error fetching table counts:', error);
          setLoading(false);
          return;
        }
        
        // Format the data into a more usable structure
        const counts: {[key: string]: number} = {};
        data.forEach((item: any) => {
          counts[item.table_name] = parseInt(item.row_count);
        });
        
        setTableCounts(counts);
        
        // Also fetch schema summaries
        await fetchSchemaSummaries();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchTableCounts();
  }, []);
  
  // Fetch schema summaries
  const fetchSchemaSummaries = async () => {
    try {
      const response = await fetch('/api/admin/database/summary');
      const data = await response.json();
      
      if (data.summaries) {
        setSchemaSummary(data.summaries);
      }
    } catch (error) {
      console.error('Error fetching schema summaries:', error);
    }
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    
    try {
      const response = await fetch('/api/admin/database/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching database:', error);
    } finally {
      setSearching(false);
    }
  };
  
  // Start narration using ElevenLabs
  const startNarration = async () => {
    setIsNarrating(true);
    
    try {
      const response = await fetch('/api/admin/narrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: `The JetStream database consists of ${Object.keys(tableCounts).length} tables. 
                 The main tables include users, profiles, flights, jets, and jetshare_offers.
                 The database is designed to support private aviation booking, jet sharing,
                 and administrative functions.`
        }),
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('Error with narration:', error);
    } finally {
      setIsNarrating(false);
    }
  };
  
  // Render the database explorer page
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Database Explorer</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Explore the database schema, view table statistics, and search data
          </p>
        </div>
        <Button 
          className="flex items-center gap-2" 
          onClick={startNarration}
          disabled={isNarrating}
        >
          {isNarrating ? 'Narrating...' : 'Narrate Schema'}
          <span className={`inline-block rounded-full w-2 h-2 ${isNarrating ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
        </Button>
      </div>
      
      <Tabs defaultValue="overview" className="w-full" onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Schema Overview</TabsTrigger>
          <TabsTrigger value="tables">Table Statistics</TabsTrigger>
          <TabsTrigger value="search">Semantic Search</TabsTrigger>
        </TabsList>
        
        {/* Schema Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema (ERD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[16/9] w-full rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center p-8">
                  <ScatterChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Entity Relationship Diagram</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Visualizes the relationships between tables in the JetStream database. The diagram shows primary keys, foreign keys, and table relationships.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Entity Relationship Diagram showing the relationships between tables in the JetStream database.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Table Relationships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))
                ) : (
                  schemaSummary.map((table, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <h3 className="font-medium">{table.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{table.description}</p>
                      <div className="mt-2">
                        <span className="text-xs font-semibold">Relations:</span>
                        <ul className="text-xs text-gray-500 ml-2 mt-1">
                          {table.relations?.map((rel: string, j: number) => (
                            <li key={j}>{rel}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Table Statistics Tab */}
        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Table Row Counts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  Array(9).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))
                ) : (
                  Object.entries(tableCounts)
                    .sort((a, b) => b[1] - a[1]) // Sort by row count desc
                    .map(([tableName, count]) => (
                      <Card key={tableName} className="flex flex-col">
                        <CardHeader className="py-2 px-4">
                          <CardTitle className="text-sm">{tableName}</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4 mt-auto">
                          <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">rows</p>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Semantic Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Semantic Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Search for tables and columns (e.g., 'user location data')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
                <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>
              
              <div className="space-y-4">
                {searchResults.length > 0 ? (
                  searchResults.map((result, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{result.name}</h3>
                        <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 px-2 py-1 rounded-full">
                          {result.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{result.text}</p>
                      {result.score && (
                        <div className="mt-2 text-xs text-gray-500">
                          Relevance: {Math.round(result.score * 100)}%
                        </div>
                      )}
                    </div>
                  ))
                ) : searching ? (
                  <div className="text-center py-8">
                    <ScatterChart className="mx-auto h-8 w-8 text-gray-400 animate-pulse" />
                    <p className="mt-2 text-gray-500">Searching database...</p>
                  </div>
                ) : searchQuery && !searching ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No results found. Try a different query.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Enter a search term to find relevant tables and columns.</p>
                    <div className="mt-2 text-sm">
                      <p>Example searches:</p>
                      <ul className="mt-1 text-amber-600 dark:text-amber-400">
                        <li>"tables related to users"</li>
                        <li>"flight booking data"</li>
                        <li>"where is location data stored"</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScatterChart, Download, X } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/spinner';

// Dynamically import Liam ERD component to avoid SSR issues
const LiamERD = dynamic(() => import('@/components/admin/LiamERD'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[16/9] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border">
      <div className="text-center">
        <Spinner className="h-8 w-8 mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading schema visualization...</p>
      </div>
    </div>
  ),
});

export default function DatabaseExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');
  const [isNarrating, setIsNarrating] = useState(false);
  const [schemaSummary, setSchemaSummary] = useState<any[]>([]);
  const [schemaLoaded, setSchemaLoaded] = useState(false);
  const [tableCardFilter, setTableCardFilter] = useState('');
  const [focusedTableForErd, setFocusedTableForErd] = useState<string | null>(null);
  
  // Load table counts on mount
  useEffect(() => {
    // Fetch table counts and schema summary
    const fetchDatabaseInfo = async () => {
      if (!schemaLoaded) {
        setLoading(true);
        
        try {
          // Define types for the fetched data
          type CountsResponse = { counts: Record<string, number> };
          type SchemaResponse = { tables: any[]; relationships: any[] };
          
          // Create promises but handle them separately
          const countsPromise = fetch('/api/admin/database/counts')
            .then(res => res.ok ? res.json() as Promise<CountsResponse> : { counts: {} })
            .catch(err => {
              console.error('Error fetching table counts:', err);
              return { counts: {} };
            });
            
          const schemaPromise = fetch('/api/admin/database/schema')
            .then(res => res.ok ? res.json() as Promise<SchemaResponse> : { tables: [], relationships: [] })
            .catch(err => {
              console.error('Error fetching schema:', err);
              return { tables: [], relationships: [] };
            });
          
          // Wait for both to complete
          const [countsData, schemaData] = await Promise.all([countsPromise, schemaPromise]);
          
          // Set table counts
          setTableCounts(countsData.counts || {});
          
          // Process schema data
          if (schemaData.tables && Array.isArray(schemaData.tables)) {
            const summary = schemaData.tables.map((table: any) => {
              const relations = (schemaData.relationships || [])
                .filter((rel: any) => rel.source_table === table.name || rel.target_table === table.name)
                .map((rel: any) => {
                  if (rel.source_table === table.name) {
                    return `→ ${rel.target_table} (via ${rel.source_column})`;
                  } else {
                    return `← ${rel.source_table} (via ${rel.target_column})`;
                  }
                });
              
              return {
                name: table.name,
                description: `Table with ${table.columns ? table.columns.length : 0} columns`,
                relations
              };
            });
            
            setSchemaSummary(summary);
          } else {
            const mockTables = ['profiles', 'jets', 'flights', 'bookings', 'jetshare_offers'];
            const mockSummary = mockTables.map(tableName => ({
              name: tableName,
              description: 'Table data unavailable',
              relations: []
            }));
            setSchemaSummary(mockSummary);
          }
          
          setSchemaLoaded(true);
        } catch (error) {
          console.error('Error fetching database info:', error);
          const mockTables = ['profiles', 'jets', 'flights', 'bookings', 'jetshare_offers'];
          const mockSummary = mockTables.map(tableName => ({
            name: tableName,
            description: 'Table data unavailable',
            relations: []
          }));
          setSchemaSummary(mockSummary);
          setSchemaLoaded(true);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchDatabaseInfo();
  }, [schemaLoaded]);
  
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
  
  // Download schema JSON
  const downloadSchema = async () => {
    try {
      const response = await fetch('/api/admin/database/download-schema');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jetstream-schema.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading schema:', error);
    }
  };
  
  // Function to handle focus request from table cards
  const handleFocusRequest = (tableName: string) => {
    setFocusedTableForErd(tableName);
    // Optionally scroll to the ERD section
    const erdSection = document.getElementById('erd-section');
    erdSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Function to clear focus, passed down to LiamERD
  const clearFocusForErd = () => {
    setFocusedTableForErd(null);
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
        <div className="flex gap-2">
          <Button 
            className="flex items-center gap-2" 
            onClick={startNarration}
            disabled={isNarrating}
          >
            {isNarrating ? 'Narrating...' : 'Narrate Schema'}
            <span className={`inline-block rounded-full w-2 h-2 ${isNarrating ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            asChild
          >
            <a href="/admin/database/sql-console">
              <span>SQL Console</span>
            </a>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full" onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Schema Overview</TabsTrigger>
          <TabsTrigger value="tables">Table Statistics</TabsTrigger>
          <TabsTrigger value="search">Semantic Search</TabsTrigger>
        </TabsList>
        
        {/* Schema Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card id="erd-section">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Database Schema (ERD)</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSchemaLoaded(false)}>
                  <span className="flex items-center gap-1">
                    <span>Refresh Schema</span>
                  </span>
                </Button>
                <Button variant="outline" size="sm" onClick={downloadSchema} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Schema
                </Button>
                {focusedTableForErd && (
                  <Button variant="outline" size="sm" onClick={clearFocusForErd} className="h-7 px-2 py-1 text-xs">
                    <X className="h-3 w-3 mr-1"/>
                    Clear ERD Focus
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {schemaLoaded ? (
                <div className="relative w-full rounded-lg border">
                  <LiamERD 
                    focusedTable={focusedTableForErd} 
                    onClearFocus={clearFocusForErd} 
                  />
                </div>
              ) : (
                <div className="relative aspect-[16/9] w-full rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Spinner className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Loading Entity Relationship Diagram</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Visualizing relationships between tables in the JetStream database...
                    </p>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Entity Relationship Diagram showing the relationships between tables in the JetStream database.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Table Relationships</CardTitle>
              <Input 
                type="text"
                placeholder="Filter tables..." 
                className="mt-2 max-w-xs h-8 text-xs"
                value={tableCardFilter}
                onChange={(e) => setTableCardFilter(e.target.value)}
              />
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
                  schemaSummary
                    .filter(table => !tableCardFilter || table.name.toLowerCase().includes(tableCardFilter.toLowerCase()))
                    .map((table, i) => (
                      <div 
                        key={`${table.name}-${i}`} 
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                        onClick={() => handleFocusRequest(table.name)}
                      >
                        <h3 className="font-medium">{table.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{table.description}</p>
                        {table.relations && table.relations.length > 0 && (
                           <div className="mt-2">
                            <span className="text-xs font-semibold">Relations:</span>
                            <ul className="text-xs text-gray-500 ml-2 mt-1">
                              {table.relations.map((rel: string, j: number) => (
                                <li key={j}>{rel}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
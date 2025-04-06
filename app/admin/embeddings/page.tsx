'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Pie, PieChart, Tooltip, Cell, ResponsiveContainer, Legend } from 'recharts';

interface EmbeddingStats {
  totalRequests: number;
  successRate: number;
  providerUsage: {
    cohere: number;
    openai: number;
  };
  fallbackRate: number;
}

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function EmbeddingsPage() {
  const [stats, setStats] = useState<EmbeddingStats | null>(null);
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>('7');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/embedding/logging?days=${timeframe}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch embedding stats: ${response.statusText}`);
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching embedding stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [timeframe]);
  
  // Format data for provider usage chart
  const providerData = stats ? [
    { name: 'Cohere', value: stats.providerUsage.cohere },
    { name: 'OpenAI', value: stats.providerUsage.openai }
  ] : [];
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Embeddings Analytics</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>
        
        <div className="mb-4 flex justify-end">
          <Button 
            variant={timeframe === '7' ? 'default' : 'outline'} 
            onClick={() => setTimeframe('7')}
            className="mr-2"
          >
            7 Days
          </Button>
          <Button 
            variant={timeframe === '30' ? 'default' : 'outline'} 
            onClick={() => setTimeframe('30')}
            className="mr-2"
          >
            30 Days
          </Button>
          <Button 
            variant={timeframe === '90' ? 'default' : 'outline'} 
            onClick={() => setTimeframe('90')}
          >
            90 Days
          </Button>
        </div>
        
        <TabsContent value="overview">
          {loading ? (
            <div className="flex justify-center p-10">Loading...</div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              Error: {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Requests</CardTitle>
                  <CardDescription>Last {timeframe} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{stats?.totalRequests || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                  <CardDescription>Percentage of successful embedding requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{stats ? Math.round(stats.successRate * 100) : 0}%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Fallback Rate</CardTitle>
                  <CardDescription>How often OpenAI fallback is used</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{stats ? Math.round(stats.fallbackRate * 100) : 0}%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Provider Usage</CardTitle>
                  <CardDescription>Distribution between providers</CardDescription>
                </CardHeader>
                <CardContent className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={providerData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {providerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Embedding Usage Details</CardTitle>
              <CardDescription>Detailed breakdown of embedding usage by object type</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Coming soon: Detailed breakdown by object type</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Usage by Object Type</h3>
                  <ul className="list-disc pl-5">
                    <li>JetShare Offers: Coming soon</li>
                    <li>Flights: Coming soon</li>
                    <li>User Profiles: Coming soon</li>
                    <li>AI Concierge Queries: Coming soon</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Recent Activity</h3>
                  <p className="text-sm text-gray-600">Detailed activity log will be available in the next version.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-gray-500">Note: Embedding usage directly impacts search quality and discovery accuracy.</p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
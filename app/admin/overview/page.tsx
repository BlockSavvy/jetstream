'use client';

import { useState, useEffect } from 'react';
import { getDashboardMetrics, getRecentJetShareOffers, DashboardMetrics } from '../utils/data-fetching';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UsersRound, 
  Plane, 
  BarChart, 
  TrendingUp,
  Timer,
  Users 
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartBarChart,
  Bar
} from 'recharts';

/**
 * Admin Overview Page
 * 
 * Displays high-level metrics and analytics for the platform including:
 * - Active user counts
 * - Offer statistics
 * - Flight data visualization
 * - User growth trends
 * 
 * Data is fetched directly from Supabase.
 */
export default function AdminOverviewPage() {
  // State for metrics and offers
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    userCount: 0,
    jetShareCount: 0,
    jetsCount: 0,
    crewCount: 0
  });
  const [recentOffers, setRecentOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch data when component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        const metricsData = await getDashboardMetrics();
        const offersData = await getRecentJetShareOffers(5);
        
        setMetrics(metricsData);
        setRecentOffers(offersData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Mock data for charts - will be replaced with actual data in future iterations
  const userData = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 600 },
    { name: 'Mar', users: 800 },
    { name: 'Apr', users: 1000 },
    { name: 'May', users: 1200 },
    { name: 'Jun', users: 1800 },
    { name: 'Jul', users: 2400 },
  ];

  const offerData = [
    { name: 'Jan', jetShare: 20, directFlights: 40 },
    { name: 'Feb', jetShare: 30, directFlights: 45 },
    { name: 'Mar', jetShare: 35, directFlights: 50 },
    { name: 'Apr', jetShare: 40, directFlights: 55 },
    { name: 'May', jetShare: 45, directFlights: 60 },
    { name: 'Jun', jetShare: 50, directFlights: 65 },
    { name: 'Jul', jetShare: 60, directFlights: 70 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersRound className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.userCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Platform user count</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active JetShare Offers</CardTitle>
            <Plane className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.jetShareCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Open JetShare offers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Jets</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.jetsCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Jets ready for booking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crew Members</CardTitle>
            <Timer className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.crewCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available crew members</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="offers">Offer Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>
                New user registrations over time
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={userData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="offers" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Offer Analytics</CardTitle>
              <CardDescription>
                JetShare vs Direct Flight offers
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartBarChart
                    data={offerData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="jetShare" fill="#8884d8" name="JetShare Offers" />
                    <Bar dataKey="directFlights" fill="#82ca9d" name="Direct Flight Offers" />
                  </RechartBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent JetShare Offers</CardTitle>
            <CardDescription>Latest offers submitted by users</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOffers.length > 0 ? (
              <ul className="space-y-4">
                {recentOffers.map((offer) => (
                  <li key={offer.id} className="flex items-start space-x-3">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                      <Plane className="h-4 w-4"/>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {offer.departure_location} → {offer.arrival_location}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(offer.flight_date).toLocaleDateString()} • 
                        Created by {offer.user && offer.user[0] ? `${offer.user[0].first_name || 'Unknown'} ${offer.user[0].last_name || ''}` : 'Unknown User'}
                      </p>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          offer.status === 'open' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                            : offer.status === 'accepted' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No recent offers found.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                { type: 'New Offer', time: '12m ago', desc: 'New JetShare offer created' },
                { type: 'Booking', time: '45m ago', desc: 'Flight booking confirmed' },
                { type: 'Crew', time: '2h ago', desc: 'New pilot registered' },
                { type: 'User', time: '3h ago', desc: '5 new users joined' }
              ].map((item, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                    {item.type === 'New Offer' ? <Plane className="h-4 w-4"/> : 
                     item.type === 'Booking' ? <TrendingUp className="h-4 w-4"/> : 
                     item.type === 'Crew' ? <Users className="h-4 w-4"/> : 
                     <UsersRound className="h-4 w-4"/>}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.type}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
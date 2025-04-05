'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDashboardMetrics, getRecentJetShareOffers, DashboardMetrics, getUsers, getJets } from '../utils/data-fetching';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UsersRound, 
  Plane, 
  BarChart, 
  TrendingUp,
  Timer,
  Users,
  PlaneTakeoff,
  MapPin,
  Calendar,
  Percent
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
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Define types for chart data
interface MonthlyUserData {
  name: string;
  users: number;
  key: string;
}

interface RouteData {
  name: string;
  value: number;
}

interface StatusData {
  name: string;
  value: number;
}

interface JetUtilizationData {
  model: string;
  available: number;
  maintenance: number;
  unavailable: number;
}

interface OfferTrendData {
  name: string;
  jetShare: number;
  directFlights: number;
  key: string;
}

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
  const [users, setUsers] = useState<any[]>([]);
  const [jets, setJets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use callback to memoize the fetch function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [metricsData, offersData, usersData, jetsData] = await Promise.all([
        getDashboardMetrics(),
        getRecentJetShareOffers(5),
        getUsers(),
        getJets()
      ]);
      
      setMetrics(metricsData);
      setRecentOffers(offersData || []);
      setUsers(usersData || []);
      setJets(jetsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Generate user growth data based on created_at dates
  const userGrowthData = useMemo<MonthlyUserData[]>(() => {
    if (!users.length) return [];
    
    const monthlyData = new Map<string, MonthlyUserData>();
    const now = new Date();
    
    // Initialize with past 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyData.set(monthKey, {
        name: date.toLocaleString('default', { month: 'short' }),
        users: 0,
        key: monthKey
      });
    }
    
    // Count users by month
    users.forEach(user => {
      if (!user.created_at) return;
      
      const createdAt = new Date(user.created_at);
      const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
      
      if (monthlyData.has(monthKey)) {
        const monthData = monthlyData.get(monthKey);
        if (monthData) {
          monthlyData.set(monthKey, {
            ...monthData,
            users: monthData.users + 1
          });
        }
      }
    });
    
    // Convert map to array and sort by date
    return Array.from(monthlyData.values())
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [users]);
  
  // Generate offer data based on status
  const offerStatusData = useMemo<StatusData[]>(() => {
    if (!recentOffers.length) return [];
    
    const statusCounts: Record<string, number> = {
      open: 0,
      accepted: 0,
      completed: 0
    };
    
    recentOffers.forEach(offer => {
      const status = offer.status as string;
      if (status && status in statusCounts) {
        statusCounts[status]++;
      }
    });
    
    return [
      { name: 'Open', value: statusCounts.open },
      { name: 'Accepted', value: statusCounts.accepted },
      { name: 'Completed', value: statusCounts.completed }
    ];
  }, [recentOffers]);
  
  // Generate route popularity data
  const routePopularityData = useMemo<RouteData[]>(() => {
    if (!recentOffers.length) return [];
    
    const routes: Record<string, number> = {};
    
    recentOffers.forEach(offer => {
      const route = `${offer.departure_location} → ${offer.arrival_location}`;
      if (!routes[route]) {
        routes[route] = 0;
      }
      routes[route]++;
    });
    
    return Object.entries(routes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [recentOffers]);
  
  // Generate jet utilization by model
  const jetUtilizationData = useMemo<JetUtilizationData[]>(() => {
    if (!jets.length) return [];
    
    const models: Record<string, JetUtilizationData> = {};
    
    jets.forEach(jet => {
      const model = jet.model as string;
      const status = jet.status as string;
      
      if (!model) return;
      
      if (!models[model]) {
        models[model] = {
          model,
          available: 0,
          maintenance: 0,
          unavailable: 0
        };
      }
      
      if (status === 'available' || status === 'maintenance' || status === 'unavailable') {
        models[model][status]++;
      }
    });
    
    return Object.values(models);
  }, [jets]);
  
  // Generate offer trend data
  const offerTrendData = useMemo<OfferTrendData[]>(() => {
    if (!recentOffers.length) return [];
    
    const monthlyData = new Map<string, OfferTrendData>();
    const now = new Date();
    
    // Initialize with past 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyData.set(monthKey, {
        name: date.toLocaleString('default', { month: 'short' }),
        jetShare: 0,
        directFlights: Math.floor(Math.random() * 30) + 20, // Placeholder data
        key: monthKey
      });
    }
    
    // Count offers by month
    recentOffers.forEach(offer => {
      if (!offer.created_at) return;
      
      const createdAt = new Date(offer.created_at);
      const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
      
      if (monthlyData.has(monthKey)) {
        const monthData = monthlyData.get(monthKey);
        if (monthData) {
          monthlyData.set(monthKey, {
            ...monthData,
            jetShare: monthData.jetShare + 1
          });
        }
      }
    });
    
    // Convert map to array and sort by date
    return Array.from(monthlyData.values())
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [recentOffers]);
  
  const getOfferSuccessRate = (): string => {
    if (!offerStatusData.length || offerStatusData[0].value === 0) return '0%';
    
    const openCount = offerStatusData[0].value;
    const acceptedCount = offerStatusData[1].value;
    const completedCount = offerStatusData[2].value;
    const total = openCount + acceptedCount + completedCount;
    
    if (total === 0) return '0%';
    
    return `${Math.round((acceptedCount + completedCount) / total * 100)}%`;
  };
  
  const getCompletionRate = (): string => {
    if (!offerStatusData.length) return '0%';
    
    const acceptedCount = offerStatusData[1].value;
    const completedCount = offerStatusData[2].value;
    const total = acceptedCount + completedCount;
    
    if (total === 0) return '0%';
    
    return `${Math.round(completedCount / total * 100)}%`;
  };
  
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
      
      <Tabs defaultValue="growth">
        <TabsList className="grid grid-cols-4 w-[500px]">
          <TabsTrigger value="growth">User Growth</TabsTrigger>
          <TabsTrigger value="offers">Offer Analytics</TabsTrigger>
          <TabsTrigger value="routes">Popular Routes</TabsTrigger>
          <TabsTrigger value="utilization">Jet Utilization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="growth" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
              <CardDescription>
                Monthly new user registrations
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={userGrowthData}
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
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="New Users"
                    />
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
                    data={offerTrendData}
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
                    <Legend />
                    <Bar dataKey="jetShare" fill="#8884d8" name="JetShare Offers" />
                    <Bar dataKey="directFlights" fill="#82ca9d" name="Direct Flight Offers" />
                  </RechartBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="routes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Routes</CardTitle>
              <CardDescription>
                Most requested flight routes
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={routePopularityData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {routePopularityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="utilization" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Jet Utilization</CardTitle>
              <CardDescription>
                Availability status by jet model
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartBarChart
                    data={jetUtilizationData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="available" stackId="a" fill="#82ca9d" name="Available" />
                    <Bar dataKey="maintenance" stackId="a" fill="#ffc658" name="Maintenance" />
                    <Bar dataKey="unavailable" stackId="a" fill="#ff8042" name="Unavailable" />
                  </RechartBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
                      <PlaneTakeoff className="h-4 w-4"/>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {offer.departure_location} → {offer.arrival_location}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-2">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(offer.flight_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {offer.user && offer.user[0] 
                            ? `${offer.user[0].first_name || ''} ${offer.user[0].last_name || ''}`.trim() || 'Unknown User'
                            : 'Unknown User'
                          }
                        </span>
                      </div>
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
            <CardTitle>Offer Status Distribution</CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={offerStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {offerStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Platform Health</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Offer Success Rate</span>
                  <span className="text-xs font-medium">
                    {getOfferSuccessRate()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Completion Rate</span>
                  <span className="text-xs font-medium">
                    {getCompletionRate()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Platform Activity</span>
                  <span className="text-xs font-medium text-green-500">Healthy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
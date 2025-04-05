'use client';

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
 * Charts use placeholder data which will be replaced with real data integration.
 */
export default function AdminOverviewPage() {
  // Placeholder data - will be replaced with real API data
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
            <div className="text-2xl font-bold">2,543</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
            <Plane className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Flights</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Jets</CardTitle>
            <Timer className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">-3% from last week</p>
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
            <CardTitle>Active Locations</CardTitle>
            <CardDescription>Top cities with active flight offers</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                { city: 'New York', count: 32 },
                { city: 'London', count: 28 },
                { city: 'Dubai', count: 25 },
                { city: 'Paris', count: 22 },
                { city: 'Tokyo', count: 18 }
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{item.city}</span>
                  <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {item.count} offers
                  </span>
                </li>
              ))}
            </ul>
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
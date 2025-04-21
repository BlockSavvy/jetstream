'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, PlaneTakeoff, Clock, CreditCard, BarChart4, CalendarClock } from 'lucide-react';
import JetShareDashboard from '../components/JetShareDashboard';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';
import { Container } from '@/app/gdyup/components/container';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  affiliation?: string;
  bio?: string;
  has_jet: boolean;
}

interface UserJet {
  id: string;
  tail_number: string;
  model: string;
  capacity: number;
  operator?: string;
  base_airport?: string;
  image_url?: string;
  manufacturer?: string;
  year?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  date: string;
  status: string;
}

interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  status: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jets, setJets] = useState<UserJet[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const profileResponse = await fetch(`/api/gdyup/profile?userId=${user.id}`);
        
        if (profileResponse.ok) {
          const { data: profileData } = await profileResponse.json();
          setProfile(profileData);
        }
        
        // Fetch user jets if they have any
        const jetsResponse = await fetch(`/api/gdyup/jets?userId=${user.id}`);
        
        if (jetsResponse.ok) {
          const { data: jetsData } = await jetsResponse.json();
          setJets(jetsData || []);
        }
        
        // Fetch user activity
        try {
          const activityResponse = await fetch(`/api/gdyup/activity?userId=${user.id}`);
          if (activityResponse.ok) {
            const { data: activityData } = await activityResponse.json();
            setActivities(activityData || []);
          }
        } catch (error) {
          console.error('Error fetching activity:', error);
          // In case the API doesn't exist yet, provide mock data
          setActivities([
            {
              id: '1',
              type: 'booking',
              description: 'Booked flight to Las Vegas',
              date: '2023-05-15',
              status: 'completed'
            },
            {
              id: '2',
              type: 'offer',
              description: 'Made offer on JetShare listing #1234',
              date: '2023-05-10',
              status: 'accepted'
            },
            {
              id: '3',
              type: 'listing',
              description: 'Created new JetShare listing',
              date: '2023-05-01',
              status: 'active'
            }
          ]);
        }
        
        // Fetch transactions
        try {
          const transactionsResponse = await fetch(`/api/gdyup/transactions?userId=${user.id}`);
          if (transactionsResponse.ok) {
            const { data: transactionsData } = await transactionsResponse.json();
            setTransactions(transactionsData || []);
          }
        } catch (error) {
          console.error('Error fetching transactions:', error);
          // In case the API doesn't exist yet, provide mock data
          setTransactions([
            {
              id: '1',
              amount: 5200,
              date: '2023-05-15',
              description: 'Payment for JetShare flight',
              status: 'completed'
            },
            {
              id: '2',
              amount: 3800,
              date: '2023-05-10',
              description: 'Booking deposit',
              status: 'completed'
            },
            {
              id: '3',
              amount: 1200,
              date: '2023-05-01',
              description: 'Listing fee',
              status: 'pending'
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (!loading) {
      loadUserData();
    }
  }, [user, loading]);
  
  if (loading || isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      </Container>
    );
  }
  
  // Get status color based on status string
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'accepted':
        return 'bg-green-600 text-white';
      case 'pending':
        return 'bg-yellow-600 text-white';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
    return (
    <div className="min-h-screen bg-gray-900">
      <Container>
        <div className="py-8">
          <h1 className="text-2xl font-bold mb-6 text-white">
            Welcome to GDY·UP, {profile?.first_name || 'Traveler'}!
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* User Profile Card */}
            <div className="md:col-span-4 bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700 text-white">
              <h2 className="text-lg font-semibold mb-4 text-white">Your Profile</h2>
              
              {profile ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="text-white">{profile.first_name} {profile.last_name}</p>
                  </div>
                  
                  {profile.role && (
                    <div>
                      <p className="text-sm text-gray-400">Role</p>
                      <p className="text-white">{profile.role}</p>
            </div>
          )}
                  
                  {profile.affiliation && (
                    <div>
                      <p className="text-sm text-gray-400">Affiliation</p>
                      <p className="text-white">{profile.affiliation}</p>
        </div>
                  )}
                  
                  {profile.bio && (
                    <div>
                      <p className="text-sm text-gray-400">Bio</p>
                      <p className="text-sm text-white">{profile.bio}</p>
      </div>
                  )}
                  
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                      onClick={() => window.location.href = '/gdyup/auth/profile-setup'}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Profile information not available</p>
              )}
      </div>
            
            {/* Main Content Area */}
            <div className="md:col-span-8 space-y-6">
              {/* Jets Panel */}
              <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Your Jets</h2>
                  
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-black"
                    onClick={() => window.location.href = '/gdyup/jets/add'}
                  >
                    {profile?.has_jet ? 'Add Another Jet' : 'Add a Jet'}
                  </Button>
                </div>
                
                {jets.length > 0 ? (
                  <div className="space-y-4">
                    {jets.map(jet => (
                      <div key={jet.id} className="border border-gray-700 rounded-md p-4 bg-gray-700">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-shrink-0 w-20 h-20 relative overflow-hidden rounded-md">
                            {jet.image_url ? (
                              <Image 
                                src={jet.image_url} 
                                alt={`${jet.model}`} 
                                width={80} 
                                height={80} 
                                className="object-cover"
                              />
                            ) : (
                              <div className="bg-gray-600 w-full h-full flex items-center justify-center">
                                <PlaneTakeoff className="h-10 w-10 text-gray-400" />
          </div>
        )}
      </div>
                          <div className="flex-grow">
                            <h3 className="font-medium text-white">{jet.tail_number}</h3>
                            <p className="text-sm text-gray-300">
                              {jet.manufacturer ? `${jet.manufacturer} ` : ''}{jet.model}
                              {jet.year ? ` (${jet.year})` : ''}
                            </p>
                            <div className="flex items-center gap-x-2 mt-2">
                              <Badge className="bg-gray-600 text-white">{jet.capacity} passengers</Badge>
                              {jet.base_airport && (
                                <Badge className="bg-blue-600 text-white">Based: {jet.base_airport}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-white border-gray-600 hover:bg-gray-600"
                              onClick={() => window.location.href = `/gdyup/jets/${jet.id}`}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                        
                        {jet.operator && (
                          <p className="text-sm mt-2 text-gray-300">Operator: {jet.operator}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">
                    {profile?.has_jet 
                      ? 'No jets found. Try adding one!' 
                      : 'You haven\'t added any jets yet.'}
                  </p>
                )}
              </div>
              
              {/* Activity and Transactions Panel */}
              <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
                <Tabs defaultValue="activity" className="w-full">
                  <div className="p-4 border-b border-gray-700">
                    <TabsList className="bg-gray-700">
                      <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                        <Clock className="mr-2 h-4 w-4" />
                        Activity
                      </TabsTrigger>
                      <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Transactions
                      </TabsTrigger>
                      <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                        <BarChart4 className="mr-2 h-4 w-4" />
                        Stats
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="activity" className="p-4">
                    <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
                    {activities.length > 0 ? (
                      <div className="space-y-3">
                        {activities.map(activity => (
                          <div key={activity.id} className="flex items-center justify-between border-b border-gray-700 pb-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <CalendarClock className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-white">{activity.description}</p>
                                <p className="text-sm text-gray-400">{activity.date}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">Your activity will appear here once you start using GDY·UP.</p>
                        <div className="mt-4">
                          <Button 
                            onClick={() => window.location.href = '/gdyup/listings'}
                            className="bg-primary hover:bg-primary/90 text-black"
                          >
                            Browse Listings
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="transactions" className="p-4">
                    <h3 className="text-lg font-semibold mb-4 text-white">Recent Transactions</h3>
                    {transactions.length > 0 ? (
                      <div className="space-y-3">
                        {transactions.map(transaction => (
                          <div key={transaction.id} className="flex items-center justify-between border-b border-gray-700 pb-3">
                            <div>
                              <p className="text-white">{transaction.description}</p>
                              <p className="text-sm text-gray-400">{transaction.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-medium">{formatCurrency(transaction.amount)}</p>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No transaction history available.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="stats" className="p-4">
                    <h3 className="text-lg font-semibold mb-4 text-white">Usage Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gray-700 border-gray-600 text-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-300">Total Flights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold">12</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-700 border-gray-600 text-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-300">Flight Hours</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold">48.5</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-700 border-gray-600 text-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-300">Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold">{formatCurrency(24500)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
      </div>
      </Container>
    </div>
  );
} 
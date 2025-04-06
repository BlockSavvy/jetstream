'use client';

import { useState, useEffect, useCallback } from 'react';
import { getJetShareOffers, JetShareOffer } from '../utils/data-fetching';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, ArrowRight, User, DollarSign, Calendar, Eye, Tag, RefreshCw, Download, FileSpreadsheet, TrendingUp, BarChart, PieChart, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedBadge } from '../components/enhanced-badge';
import { ActionTooltip } from '../components/action-tooltip';
import { JetShareStatusDialog } from '../components/dialogs/jetshare-status-dialog';
import { JetShareViewDialog } from '../components/dialogs/jetshare-view-dialog';
import { JetShareCreateDialog } from '../components/dialogs/jetshare-create-dialog';
import { JetShareDeleteDialog } from '../components/dialogs/jetshare-delete-dialog';
import { toast } from 'sonner';
import { useUi } from '../components/ui-context';
import { exportToCSV } from '../utils/export-utils';
import {
  LineChart,
  Line,
  BarChart as RechartBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartPieChart,
  Pie,
  Cell
} from 'recharts';

/**
 * Admin JetShare Offers Page
 * 
 * Displays and allows management of all JetShare offers in the system.
 * - Lists all offers with key details
 * - Shows offer status and user information
 * - Provides actions for managing offers
 * 
 * Data is fetched directly from Supabase.
 */
export default function AdminJetSharePage() {
  const [offers, setOffers] = useState<JetShareOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('offers');
  
  // Use UI context for dialog management
  const { 
    openJetShareStatus, 
    openJetShareView, 
    openJetShareCreate,
    openJetShareDelete,
    setRefreshOffers
  } = useUi();

  // Memoize the fetchOffers function to prevent infinite re-renders
  const fetchOffers = useCallback(async () => {
    try {
      const data = await getJetShareOffers();
      setOffers(data);
    } catch (error) {
      console.error('Error fetching JetShare offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers for dialogs and actions
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOffers();
    setIsRefreshing(false);
    toast.success('Offers refreshed');
  };
  
  const handleExport = () => {
    try {
      // Create a cleaned version of the data for export
      const exportData = offers.map(offer => {
        const { user, matched_user, ...offerData } = offer;
        
        return {
          ...offerData,
          creator_name: Array.isArray(user) && user.length > 0 ? 
            `${user[0].first_name || ''} ${user[0].last_name || ''}`.trim() : 'Unknown',
          creator_email: Array.isArray(user) && user.length > 0 ? user[0].email : 'Unknown',
          matched_user_name: Array.isArray(matched_user) && matched_user.length > 0 ? 
            `${matched_user[0].first_name || ''} ${matched_user[0].last_name || ''}`.trim() : 'None',
        };
      });
      
      exportToCSV(exportData, 'jetshare_offers');
      toast.success('Export successful');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  // Register the fetchOffers function with context only once after component mounts
  useEffect(() => {
    fetchOffers();
    
    // Store the memoized function in context
    setRefreshOffers(fetchOffers);
    
    // No need to include fetchOffers in the dependency array since it's memoized
  }, [setRefreshOffers, fetchOffers]);

  // Helper functions to format data
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Financial analytics data
  const getMonthlyRevenueData = () => {
    const monthlyData: Record<string, { month: string, revenue: number, matchedTrips: number }> = {};
    
    // Initialize past 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { month: monthKey, revenue: 0, matchedTrips: 0 };
    }
    
    // Process offers
    offers.forEach(offer => {
      if (offer.status === 'completed' && offer.created_at) {
        const date = new Date(offer.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (monthlyData[monthKey]) {
          // Estimate revenue: Assume 10% of offer amount
          const revenue = offer.requested_share_amount * 0.1;
          monthlyData[monthKey].revenue += revenue;
          monthlyData[monthKey].matchedTrips += 1;
        }
      }
    });
    
    return Object.values(monthlyData);
  };
  
  const getRouteRevenueData = () => {
    const routeData: Record<string, { route: string, revenue: number, count: number }> = {};
    
    offers.forEach(offer => {
      if (offer.status === 'completed' || offer.status === 'accepted') {
        const route = `${offer.departure_location} → ${offer.arrival_location}`;
        
        if (!routeData[route]) {
          routeData[route] = { route, revenue: 0, count: 0 };
        }
        
        // Estimate revenue: Assume 10% of offer amount
        const revenue = offer.requested_share_amount * 0.1;
        routeData[route].revenue += revenue;
        routeData[route].count += 1;
      }
    });
    
    // Sort by revenue and get top 5
    return Object.values(routeData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };
  
  const getValueDistributionData = () => {
    // Categorize offers by price ranges
    const ranges = [
      { name: 'Under $5k', min: 0, max: 5000, value: 0 },
      { name: '$5k-$10k', min: 5000, max: 10000, value: 0 },
      { name: '$10k-$20k', min: 10000, max: 20000, value: 0 },
      { name: '$20k-$30k', min: 20000, max: 30000, value: 0 },
      { name: '$30k+', min: 30000, max: Infinity, value: 0 }
    ];
    
    offers.forEach(offer => {
      for (const range of ranges) {
        if (offer.requested_share_amount >= range.min && offer.requested_share_amount < range.max) {
          range.value += 1;
          break;
        }
      }
    });
    
    return ranges;
  };
  
  const getTotalRevenue = () => {
    // Estimate total revenue: Assume 10% of each matched or completed offer
    return offers
      .filter(offer => offer.status === 'completed' || offer.status === 'accepted')
      .reduce((sum, offer) => sum + (offer.requested_share_amount * 0.1), 0);
  };
  
  const getAverageShare = () => {
    if (offers.length === 0) return 0;
    return offers.reduce((sum, offer) => sum + offer.requested_share_amount, 0) / offers.length;
  };
  
  const getMatchPercentage = () => {
    const total = offers.length;
    if (total === 0) return 0;
    
    const matched = offers.filter(o => o.status === 'accepted' || o.status === 'completed').length;
    return (matched / total) * 100;
  };
  
  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
        <h1 className="text-3xl font-bold">JetShare Offers</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={handleExport}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={openJetShareCreate}
          >
            <Plane className="mr-2 h-4 w-4" />
            Add JetShare Offer
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="offers" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>All JetShare Offers</CardTitle>
              <CardDescription>
                View and manage all seat-sharing flight offers
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flight Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.length > 0 ? (
                    offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-1">
                            <span>{offer.departure_location}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{offer.arrival_location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            <span>{formatDate(offer.flight_date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3 text-gray-500" />
                            <span>
                              {Array.isArray(offer.user) && offer.user.length > 0 ? 
                                `${offer.user[0].first_name || ''} ${offer.user[0].last_name || ''}`.trim() : 
                                'Unknown User'
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <EnhancedBadge status={offer.status}>
                            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                          </EnhancedBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3 text-gray-500" />
                            <span>{formatCurrency(offer.total_flight_cost)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3 text-gray-500" />
                            <span>{formatCurrency(offer.requested_share_amount)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(offer.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <ActionTooltip label="View Details">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openJetShareView(offer)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </ActionTooltip>
                            <ActionTooltip label="Change Status">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openJetShareStatus(offer)}
                              >
                                <Tag className="h-4 w-4" />
                              </Button>
                            </ActionTooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        No JetShare offers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {offers.filter(o => o.status === 'open').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting matches
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Accepted Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {offers.filter(o => o.status === 'accepted').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Matched and confirmed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {offers.filter(o => o.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Flights completed
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Revenue Trends</CardTitle>
                  <TrendingUp className="h-5 w-5 text-gray-500" />
                </div>
                <CardDescription>
                  Estimated monthly revenue from JetShare platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getMonthlyRevenueData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Platform Revenue"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top Revenue Routes</CardTitle>
                  <BarChart className="h-5 w-5 text-gray-500" />
                </div>
                <CardDescription>
                  Highest revenue generating routes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartBarChart data={getRouteRevenueData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="route" />
                      <YAxis
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Legend />
                      <Bar
                        dataKey="revenue"
                        name="Platform Revenue"
                        fill="#8884d8"
                      />
                    </RechartBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Price Distribution</CardTitle>
                  <PieChart className="h-5 w-5 text-gray-500" />
                </div>
                <CardDescription>
                  Share requests by price range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={getValueDistributionData()}
                        nameKey="name"
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => entry.name}
                      >
                        {getValueDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Financial Summary</CardTitle>
                  <Calculator className="h-5 w-5 text-gray-500" />
                </div>
                <CardDescription>
                  Key financial metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Estimated Total Revenue</h3>
                    <p className="text-2xl font-bold">{formatCurrency(getTotalRevenue())}</p>
                    <p className="text-xs text-gray-500 mt-1">Based on 10% platform fee</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Average Share Request</h3>
                    <p className="text-2xl font-bold">{formatCurrency(getAverageShare())}</p>
                    <p className="text-xs text-gray-500 mt-1">Across all offers</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Match Success Rate</h3>
                    <p className="text-2xl font-bold">{getMatchPercentage().toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-1">Accepted + completed offers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Include dialog components */}
      <JetShareStatusDialog />
      <JetShareViewDialog />
      <JetShareCreateDialog />
      <JetShareDeleteDialog />
    </div>
  );
} 
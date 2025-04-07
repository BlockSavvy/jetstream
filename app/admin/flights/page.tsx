'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFlightOffers, Flight } from '../utils/data-fetching';
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
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  ArrowRight, 
  Calendar, 
  DollarSign, 
  Users,
  Timer,
  Eye,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlightViewDialog } from '../components/dialogs/flight-view-dialog';
import { FlightCreateDialog } from '../components/dialogs/flight-create-dialog';
import { useUi } from '../components/ui-context';
import { toast } from 'sonner';

/**
 * Admin Flight Offers Management Page
 * 
 * Displays and allows management of all flight offers in the system:
 * - Lists all flight offers with key details
 * - Shows status and pricing information
 * - Provides actions for managing offers
 * 
 * Data is fetched directly from Supabase.
 */
export default function AdminFlightOffersPage() {
  const [offers, setOffers] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use UI context for dialog management
  const { 
    openFlightView, 
    openFlightCreate, 
    setRefreshFlights 
  } = useUi();

  // Memoize the fetch function to prevent re-renders
  const fetchFlights = useCallback(async () => {
    try {
      const data = await getFlightOffers();
      setOffers(data);
    } catch (error) {
      console.error('Error fetching flight offers:', error);
      toast.error('Failed to load flight offers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers for dialogs and actions
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFlights();
    setIsRefreshing(false);
    toast.success('Flight offers refreshed');
  };

  // Register the fetch function with context
  useEffect(() => {
    fetchFlights();
    
    // Store the memoized function in context
    setRefreshFlights(fetchFlights);
    
  }, [fetchFlights, setRefreshFlights]);

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge color mapping
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    boarding: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    in_air: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
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
        <h1 className="text-3xl font-bold">JetStream Flights</h1>
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
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={openFlightCreate}
          >
            <Plane className="mr-2 h-4 w-4" />
            Add New Flight
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Flights</CardTitle>
          <CardDescription>
            Manage all flight offers and schedules
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.length > 0 ? (
                offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-1">
                        <span>{offer.origin?.code || offer.origin_airport}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{offer.destination?.code || offer.destination_airport}</span>
                        <div className="ml-1 text-xs text-gray-500">
                          {offer.origin?.city && offer.destination?.city ? 
                            `${offer.origin.city} to ${offer.destination.city}` : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <span>{formatDate(offer.departure_time)}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Timer className="h-3 w-3 text-gray-500" />
                          <span className="text-xs">{formatTime(offer.departure_time)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Plane className="h-3 w-3 text-gray-500" />
                        <span>
                          {offer.jet ? 
                            `${offer.jet.manufacturer || ''} ${offer.jet.model || ''}`.trim() || offer.jet.tail_number : 
                            'N/A'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        statusColors[offer.status as keyof typeof statusColors] || 
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }>
                        {offer.status.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span>{offer.available_seats}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-gray-500" />
                        <span>{formatCurrency(offer.base_price)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openFlightView(offer)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No flight offers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {offers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All scheduled flights
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {offers.filter(o => ['scheduled', 'boarding'].includes(o.status)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled or boarding
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {offers.filter(o => o.status === 'in_air').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in air
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {offers.length > 0 ? 
                formatCurrency(offers.reduce((sum, o) => sum + o.base_price, 0) / offers.length) : 
                '$0'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per flight
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Include dialog components */}
      <FlightViewDialog />
      <FlightCreateDialog />
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Plane, ArrowRight, User, DollarSign, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    async function fetchOffers() {
      try {
        const data = await getJetShareOffers();
        setOffers(data);
      } catch (error) {
        console.error('Error fetching JetShare offers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

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

  // Status badge color mapping
  const statusColors = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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
        <h1 className="text-3xl font-bold">JetShare Offers</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            Filter
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-black">
            <Plane className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

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
                      <Badge className={
                        statusColors[offer.status as keyof typeof statusColors] || 
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }>
                        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                      </Badge>
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
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
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

      <div className="grid gap-4 md:grid-cols-3">
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
    </div>
  );
} 
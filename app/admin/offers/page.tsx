'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ChevronDown, Plane, Eye, Edit, Trash } from "lucide-react";

/**
 * Admin Offers Management Page
 * 
 * Displays and provides management for:
 * - JetShare offers
 * - Direct flight offers
 * 
 * Features:
 * - Tab-based viewing between offer types
 * - Search and filter functionality
 * - View offer details
 * - Edit/delete actions
 * 
 * This page uses placeholder data which will be replaced with real API integration.
 */
export default function AdminOffersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Placeholder data for JetShare offers
  const jetShareOffers = [
    { id: 'js-001', from: 'New York', to: 'Los Angeles', date: '2023-10-15', price: 3500, status: 'active', seats: 3, user: 'john@example.com' },
    { id: 'js-002', from: 'Miami', to: 'Chicago', date: '2023-10-17', price: 2800, status: 'pending', seats: 2, user: 'sarah@example.com' },
    { id: 'js-003', from: 'Boston', to: 'San Francisco', date: '2023-10-20', price: 4200, status: 'completed', seats: 4, user: 'mark@example.com' },
    { id: 'js-004', from: 'Seattle', to: 'Dallas', date: '2023-10-22', price: 3100, status: 'active', seats: 2, user: 'lisa@example.com' },
    { id: 'js-005', from: 'Denver', to: 'Atlanta', date: '2023-10-25', price: 2950, status: 'cancelled', seats: 3, user: 'robert@example.com' },
  ];
  
  // Placeholder data for direct flight offers
  const flightOffers = [
    { id: 'f-001', from: 'New York', to: 'London', date: '2023-10-15', price: 9500, status: 'scheduled', jet: 'Gulfstream G650', pilot: 'Captain Smith' },
    { id: 'f-002', from: 'Paris', to: 'Tokyo', date: '2023-10-18', price: 15800, status: 'boarding', jet: 'Bombardier Global 7500', pilot: 'Captain Johnson' },
    { id: 'f-003', from: 'Dubai', to: 'Singapore', date: '2023-10-21', price: 12200, status: 'completed', jet: 'Dassault Falcon 8X', pilot: 'Captain Williams' },
    { id: 'f-004', from: 'Los Angeles', to: 'Sydney', date: '2023-10-24', price: 18100, status: 'scheduled', jet: 'Gulfstream G700', pilot: 'Captain Brown' },
    { id: 'f-005', from: 'Frankfurt', to: 'New York', date: '2023-10-27', price: 10950, status: 'cancelled', jet: 'Bombardier Global 6000', pilot: 'Captain Davis' },
  ];

  // Filter JetShare offers based on search query and status filter
  const filteredJetShareOffers = jetShareOffers.filter(offer => {
    const matchesSearch = 
      searchQuery === '' || 
      offer.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      offer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter flight offers based on search query and status filter
  const filteredFlightOffers = flightOffers.filter(offer => {
    const matchesSearch = 
      searchQuery === '' || 
      offer.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      offer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'scheduled':
      case 'boarding':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Offers Management</h1>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by route, ID..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="boarding">Boarding</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button>
          <Filter className="mr-2 h-4 w-4" />
          More Filters
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="jetshare">
        <TabsList>
          <TabsTrigger value="jetshare">JetShare Offers</TabsTrigger>
          <TabsTrigger value="flights">Flight Offers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jetshare" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>JetShare Offers</CardTitle>
              <CardDescription>
                Manage all shared flight offers across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJetShareOffers.length > 0 ? (
                    filteredJetShareOffers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span>{offer.from}</span>
                            <Plane className="mx-2 h-3 w-3 rotate-90" />
                            <span>{offer.to}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(offer.date).toLocaleDateString()}</TableCell>
                        <TableCell>${offer.price.toLocaleString()}</TableCell>
                        <TableCell>{offer.seats}</TableCell>
                        <TableCell>{offer.user}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(offer.status)}>
                            {offer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        No offers found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="flights" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Flight Offers</CardTitle>
              <CardDescription>
                Manage all direct flight offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Jet</TableHead>
                    <TableHead>Pilot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFlightOffers.length > 0 ? (
                    filteredFlightOffers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span>{offer.from}</span>
                            <Plane className="mx-2 h-3 w-3 rotate-90" />
                            <span>{offer.to}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(offer.date).toLocaleDateString()}</TableCell>
                        <TableCell>${offer.price.toLocaleString()}</TableCell>
                        <TableCell>{offer.jet}</TableCell>
                        <TableCell>{offer.pilot}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(offer.status)}>
                            {offer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        No offers found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
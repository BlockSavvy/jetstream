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
import { 
  Search, 
  Filter, 
  Plane, 
  PlaneTakeoff, 
  Calendar, 
  Ruler, 
  GaugeCircle,
  Users,
  Eye,
  Edit,
  Trash,
  Plus
} from "lucide-react";

/**
 * Admin Jets Management Page
 * 
 * Provides an interface for administrators to manage jet inventory:
 * - View all jets with key specifications and status
 * - Search and filter jets by type, status, and capacity
 * - Add, edit, or remove jets from the system
 * 
 * This page uses placeholder data and will be integrated with the jets database.
 */
export default function AdminJetsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Placeholder jets data
  const jets = [
    { 
      id: 'j-001', 
      model: 'Gulfstream G650', 
      registration: 'N650JS', 
      type: 'Long Range', 
      capacity: 14, 
      range: 7000, 
      speed: 950, 
      status: 'available', 
      lastMaintenance: '2023-09-10',
      nextMaintenance: '2023-12-10',
      location: 'New York'
    },
    { 
      id: 'j-002', 
      model: 'Bombardier Global 7500', 
      registration: 'N7500B', 
      type: 'Ultra Long Range', 
      capacity: 19, 
      range: 7700, 
      speed: 925, 
      status: 'maintenance', 
      lastMaintenance: '2023-10-05',
      nextMaintenance: '2023-10-20',
      location: 'Chicago'
    },
    { 
      id: 'j-003', 
      model: 'Cessna Citation X', 
      registration: 'N100CX', 
      type: 'Super-Midsize', 
      capacity: 9, 
      range: 3460, 
      speed: 972, 
      status: 'in-flight', 
      lastMaintenance: '2023-08-22',
      nextMaintenance: '2023-11-22',
      location: 'In Transit (LAX → MIA)'
    },
    { 
      id: 'j-004', 
      model: 'Dassault Falcon 8X', 
      registration: 'N888DF', 
      type: 'Long Range', 
      capacity: 12, 
      range: 6450, 
      speed: 892, 
      status: 'available', 
      lastMaintenance: '2023-09-30',
      nextMaintenance: '2023-12-30',
      location: 'London'
    },
    { 
      id: 'j-005', 
      model: 'Embraer Phenom 300', 
      registration: 'N300EP', 
      type: 'Light', 
      capacity: 7, 
      range: 2010, 
      speed: 834, 
      status: 'scheduled', 
      lastMaintenance: '2023-09-15',
      nextMaintenance: '2023-12-15',
      location: 'Miami'
    },
  ];

  // Filter jets based on search query, status filter, and type filter
  const filteredJets = jets.filter(jet => {
    const matchesSearch = 
      searchQuery === '' || 
      jet.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jet.registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jet.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      jet.status === statusFilter;
    
    const matchesType = 
      typeFilter === 'all' || 
      jet.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in-flight':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Jets Inventory</h1>
        <Button className="bg-amber-500 hover:bg-amber-600 text-black">
          <Plus className="mr-2 h-4 w-4" />
          Add New Jet
        </Button>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by model, registration, location..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="in-flight">In Flight</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center">
              <Plane className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Jet Type" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Light">Light</SelectItem>
            <SelectItem value="Midsize">Midsize</SelectItem>
            <SelectItem value="Super-Midsize">Super-Midsize</SelectItem>
            <SelectItem value="Long Range">Long Range</SelectItem>
            <SelectItem value="Ultra Long Range">Ultra Long Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jets</CardTitle>
          <CardDescription>
            Manage all jets in the fleet inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Range (nm)</TableHead>
                <TableHead>Speed (km/h)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJets.length > 0 ? (
                filteredJets.map((jet) => (
                  <TableRow key={jet.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                          <Plane className="h-5 w-5 text-gray-500" />
                        </div>
                        <span>{jet.model}</span>
                      </div>
                    </TableCell>
                    <TableCell>{jet.registration}</TableCell>
                    <TableCell>{jet.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span>{jet.capacity} pax</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Ruler className="h-3 w-3 text-gray-500" />
                        <span>{jet.range} nm</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <GaugeCircle className="h-3 w-3 text-gray-500" />
                        <span>{jet.speed} km/h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(jet.status)}>
                        {jet.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{jet.location}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                    No jets found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 
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
  UserRound, 
  Calendar, 
  Star, 
  Clock,
  Mail,
  PhoneCall,
  Plane,
  Shield,
  Eye,
  Edit,
  UserCog,
  Plus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Admin Crews Management Page
 * 
 * Provides an interface for administrators to manage captains and crew members:
 * - View all crew with their qualifications and availability
 * - Search and filter by role, experience, and availability
 * - Manage assignments and training status
 * 
 * This page uses placeholder data and will be integrated with the crew database.
 */
export default function AdminCrewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Placeholder crew data
  const crews = [
    { 
      id: 'c-001', 
      name: 'Captain Michael Thompson', 
      role: 'Captain', 
      email: 'michael.t@example.com', 
      phone: '+1 (555) 123-4567', 
      experience: 12000, 
      qualifications: ['G650', 'Global 7500', 'Falcon 8X'], 
      rating: 4.9, 
      reviews: 42, 
      availability: 'available', 
      nextFlight: null,
      location: 'New York'
    },
    { 
      id: 'c-002', 
      name: 'First Officer Sarah Martinez', 
      role: 'Co-Pilot', 
      email: 'sarah.m@example.com', 
      phone: '+1 (555) 234-5678', 
      experience: 5800, 
      qualifications: ['Global 7500', 'Legacy 650'], 
      rating: 4.7, 
      reviews: 28, 
      availability: 'on-duty', 
      nextFlight: '2023-10-18',
      location: 'In Transit (JFK → LHR)'
    },
    { 
      id: 'c-003', 
      name: 'Flight Attendant Lisa Chen', 
      role: 'Cabin Crew', 
      email: 'lisa.c@example.com', 
      phone: '+1 (555) 345-6789', 
      experience: 3200, 
      qualifications: ['First Aid', 'VIP Service', 'Culinary'], 
      rating: 4.8, 
      reviews: 56, 
      availability: 'available', 
      nextFlight: null,
      location: 'Miami'
    },
    { 
      id: 'c-004', 
      name: 'Captain Robert Williams', 
      role: 'Captain', 
      email: 'robert.w@example.com', 
      phone: '+1 (555) 456-7890', 
      experience: 15000, 
      qualifications: ['G650', 'Citation X', 'Global 6000'], 
      rating: 5.0, 
      reviews: 61, 
      availability: 'unavailable', 
      nextFlight: null,
      location: 'Los Angeles'
    },
    { 
      id: 'c-005', 
      name: 'Flight Engineer James Peterson', 
      role: 'Engineer', 
      email: 'james.p@example.com', 
      phone: '+1 (555) 567-8901', 
      experience: 7500, 
      qualifications: ['Mechanical', 'Avionics', 'G650 Certified'], 
      rating: 4.6, 
      reviews: 33, 
      availability: 'training', 
      nextFlight: null,
      location: 'Denver'
    },
  ];

  // Filter crews based on search query, role filter, and availability filter
  const filteredCrews = crews.filter(crew => {
    const matchesSearch = 
      searchQuery === '' || 
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.qualifications.some(q => q.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = 
      roleFilter === 'all' || 
      crew.role.toLowerCase() === roleFilter.toLowerCase();
    
    const matchesAvailability = 
      availabilityFilter === 'all' || 
      crew.availability === availabilityFilter;
    
    return matchesSearch && matchesRole && matchesAvailability;
  });

  // Function to get availability badge color
  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'on-duty':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'training':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'unavailable':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Function to format flight hours
  const formatFlightHours = (hours: number) => {
    return `${Math.floor(hours / 1000)}k+ hours`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Captains & Crews</h1>
        <Button className="bg-amber-500 hover:bg-amber-600 text-black">
          <Plus className="mr-2 h-4 w-4" />
          Add Crew Member
        </Button>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, qualifications..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center">
              <UserRound className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Role" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="captain">Captain</SelectItem>
            <SelectItem value="co-pilot">Co-Pilot</SelectItem>
            <SelectItem value="cabin crew">Cabin Crew</SelectItem>
            <SelectItem value="engineer">Engineer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Availability" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="on-duty">On Duty</SelectItem>
            <SelectItem value="training">In Training</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flight Crew</CardTitle>
          <CardDescription>
            Manage captains, pilots, and cabin crew
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Qualifications</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCrews.length > 0 ? (
                filteredCrews.map((crew) => (
                  <TableRow key={crew.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={`https://i.pravatar.cc/40?u=${crew.id}`} alt={crew.name} />
                          <AvatarFallback>{crew.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span>{crew.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        crew.role === 'Captain' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' : 
                        crew.role === 'Co-Pilot' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                        crew.role === 'Cabin Crew' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }>
                        {crew.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="text-xs">{crew.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <PhoneCall className="h-3 w-3 text-gray-500" />
                          <span className="text-xs">{crew.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Plane className="h-3 w-3 text-gray-500" />
                        <span>{formatFlightHours(crew.experience)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {crew.qualifications.map((qual, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {qual}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span>{crew.rating} ({crew.reviews})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAvailabilityColor(crew.availability)}>
                        {crew.availability}
                      </Badge>
                      {crew.nextFlight && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Flight on {new Date(crew.nextFlight).toLocaleDateString()}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{crew.location}</TableCell>
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
                    No crew members found matching your filters.
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
'use client';

import { useState, useEffect } from 'react';
import { getCrews, Crew } from '../utils/data-fetching';
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
  Users, 
  User, 
  Star, 
  Medal,
  Phone,
  Eye, 
  MessageSquare,
  Mail,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Admin Crews Management Page
 * 
 * Displays and allows management of all pilots and crew members in the system:
 * - Lists crew members with their specializations
 * - Shows ratings and availability
 * - Provides actions for managing crew assignments
 * 
 * Data is fetched directly from Supabase.
 */
export default function AdminCrewsPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCrews() {
      try {
        const data = await getCrews();
        setCrews(data);
      } catch (error) {
        console.error('Error fetching crews:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCrews();
  }, []);

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
        <h1 className="text-3xl font-bold">Crews Management</h1>
        <Button className="bg-amber-500 hover:bg-amber-600 text-black">
          <Users className="mr-2 h-4 w-4" />
          Add Crew Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilots & Crew</CardTitle>
          <CardDescription>
            Manage all pilots and crew members
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Ratings</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crews.length > 0 ? (
                crews.map((crew) => (
                  <TableRow key={crew.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <div>{crew.name}</div>
                          <div className="text-xs text-gray-500">
                            {Array.isArray(crew.user) && crew.user.length > 0 ? 
                              `${crew.user[0].email || 'No email'}` : 
                              'No account linked'
                            }
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {crew.specializations && crew.specializations.map((spec, i) => (
                          <Badge key={i} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-amber-500 mr-1" />
                        <span>{crew.ratings_avg || 'N/A'}</span>
                        <span className="text-xs text-gray-500 ml-1">/ 5</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Mail className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No crew members found.
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
            <CardTitle className="text-sm font-medium">Total Crew</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crews.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active crew members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pilots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crews.filter(crew => 
                crew.specializations && 
                crew.specializations.some(s => 
                  s.toLowerCase().includes('pilot') || 
                  s.toLowerCase().includes('captain')
                )
              ).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Qualified flight crew
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {crews.length > 0 && crews.some(c => c.ratings_avg) ? 
                (crews.reduce((sum, crew) => sum + (crew.ratings_avg || 0), 0) / 
                 crews.filter(c => c.ratings_avg).length).toFixed(1) : 
                'N/A'
              }
              <Star className="h-4 w-4 text-amber-500 ml-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall crew performance
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
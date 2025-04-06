'use client';

import { useState, useEffect, useCallback } from 'react';
import { getJets, Jet } from '../utils/data-fetching';
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
  User, 
  Briefcase, 
  MapPin, 
  Star,
  Calendar,
  Edit,
  Gauge,
  RefreshCw,
  Trash2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JetCreateDialog } from '../components/dialogs/jet-create-dialog';
import { ActionTooltip } from '../components/action-tooltip';
import { toast } from 'sonner';
import { useUi } from '../components/ui-context';

/**
 * Admin Jets Management Page
 * 
 * Displays and allows management of all jets in the system:
 * - Lists all jets with key specifications
 * - Shows current availability status
 * - Provides actions for managing jets
 * 
 * Data is fetched directly from Supabase.
 */
export default function AdminJetsPage() {
  const [jets, setJets] = useState<Jet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use UI context for dialogs
  const { 
    openJetView, 
    openJetCreate, 
    openJetEdit, 
    openJetDelete, 
    setRefreshJets 
  } = useUi();

  // Memoize the fetchJets function to prevent re-renders
  const fetchJets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getJets();
      setJets(data);
    } catch (error) {
      console.error('Error fetching jets:', error);
      toast.error('Failed to load jets');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handler to refresh jets
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJets();
    setIsRefreshing(false);
    toast.success('Jets refreshed');
  };

  // Register the fetchJets function with context
  useEffect(() => {
    fetchJets();
    
    // Store the memoized function in context
    setRefreshJets(fetchJets);
  }, [fetchJets, setRefreshJets]);

  // Status badge color mapping
  const statusColors = {
    available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    unavailable: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
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
        <h1 className="text-3xl font-bold">Jets Management</h1>
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
            onClick={openJetCreate}
          >
            <Plane className="mr-2 h-4 w-4" />
            Add New Jet
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet</CardTitle>
          <CardDescription>
            Manage all jets in your fleet
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aircraft</TableHead>
                <TableHead>Tail Number</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Home Base</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Range (nm)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jets.length > 0 ? (
                jets.map((jet) => (
                  <TableRow key={jet.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                          <Plane className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <div>{jet.manufacturer} {jet.model}</div>
                          <div className="text-xs text-gray-500">{jet.year}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{jet.tail_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-gray-500" />
                        <span>
                          {Array.isArray(jet.owner) && jet.owner.length > 0 ? 
                            `${jet.owner[0].first_name || ''} ${jet.owner[0].last_name || ''}`.trim() : 
                            'Unknown Owner'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span>{jet.home_base_airport}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        statusColors[jet.status as keyof typeof statusColors] || 
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }>
                        {jet.status.charAt(0).toUpperCase() + jet.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Briefcase className="h-3 w-3 text-gray-500" />
                        <span>{jet.capacity} seats</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Gauge className="h-3 w-3 text-gray-500" />
                        <span>{jet.range_nm.toLocaleString()} nm</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <ActionTooltip label="View Details">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openJetView(jet)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip label="Edit">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openJetEdit(jet)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip label="Delete">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openJetDelete(jet)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                    No jets found.
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
            <CardTitle className="text-sm font-medium">Available Jets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jets.filter(jet => jet.status === 'available').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for booking
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jets.filter(jet => jet.status === 'maintenance').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Under scheduled service
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jets.length > 0 
                ? Math.round(jets.reduce((sum, jet) => sum + jet.capacity, 0) / jets.length) 
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Seats per aircraft
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Include dialog components */}
      <JetCreateDialog />
    </div>
  );
} 
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { 
  Search, 
  UserRound, 
  Shield, 
  Mail, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  UserCog,
  KeyRound,
  RefreshCw
} from "lucide-react";
import { createClient } from '@/lib/supabase';
import { EnhancedBadge } from '../components/enhanced-badge';
import { ActionTooltip } from '../components/action-tooltip';
import { UserEditDialog } from '../components/dialogs/user-edit-dialog';
import { UserRoleDialog } from '../components/dialogs/user-role-dialog';
import { UserPasswordResetDialog } from '../components/dialogs/user-password-reset';
import { UserViewDialog } from '../components/dialogs/user-view-dialog';
import { toast } from 'sonner';
import { User } from '../utils/data-fetching';
import { useUi } from '../components/ui-context';

/**
 * Admin Users Management Page
 * 
 * Provides an interface for administrators to manage user accounts:
 * - View users list with key information
 * - Search and filter users
 * - Manage user roles and permissions
 * - View user details and edit profiles
 * 
 * Data is fetched directly from Supabase.
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the UI context for dialog management
  const { 
    openUserView, 
    openUserEdit, 
    openUserRole, 
    openUserPasswordReset,
    setRefreshUsers
  } = useUi();

  // Memoize the fetchUsers function to prevent infinite re-renders
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Create the Supabase client
      const supabase = createClient();
      
      // Fetch profiles from the database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        return;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Register the fetchUsers function with context only once after component mounts
  useEffect(() => {
    fetchUsers();
    
    // Store the memoized function in context
    setRefreshUsers(fetchUsers);
    
    // No need to include fetchUsers in the dependency array since it's memoized
  }, [setRefreshUsers, fetchUsers]);

  // Handler for refresh button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
    toast.success('User list refreshed');
  };

  // Filter users based on search query, role, and verification status
  const filteredUsers = users.filter(user => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    const matchesSearch = 
      searchQuery === '' || 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'all' || 
      user.user_type === roleFilter;
    
    const matchesVerification = 
      verificationFilter === 'all' || 
      (verificationFilter === 'verified' && user.verification_status === 'verified') || 
      (verificationFilter === 'unverified' && user.verification_status !== 'verified');
    
    return matchesSearch && matchesRole && matchesVerification;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-black">
            <UserRound className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, ID..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by role" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="traveler">Traveler</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Verification status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage all user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                            <UserRound className="h-5 w-5 text-gray-500" />
                          </div>
                          <span>
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span>{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <EnhancedBadge className={
                          user.user_type === 'admin' ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800' : 
                          user.user_type === 'owner' ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800' :
                          'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
                        }>
                          {user.user_type || 'User'}
                        </EnhancedBadge>
                      </TableCell>
                      <TableCell>
                        {user.verification_status === 'verified' ? (
                          <span className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-500 mr-1" />
                            {user.verification_status || 'Unverified'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <ActionTooltip label="View User Profile">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openUserView(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Edit User Details">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openUserEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Manage Permissions">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openUserRole(user)}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip label="Reset Password">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openUserPasswordReset(user)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No users found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs - now using context, no need to pass props */}
      <UserViewDialog />
      <UserEditDialog />
      <UserRoleDialog />
      <UserPasswordResetDialog />
    </div>
  );
} 
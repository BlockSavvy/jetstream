'use client';

import { useState, useEffect } from 'react';
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
  UserRound, 
  Shield, 
  Mail, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  UserCog
} from "lucide-react";
import { createClient } from '@/lib/supabase';

// Define the User type to match your profiles table
interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  user_type?: string;
  verification_status?: string;
  created_at?: string;
  updated_at?: string;
}

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

  useEffect(() => {
    async function fetchUsers() {
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
          return;
        }
        
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

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
        <Button className="bg-amber-500 hover:bg-amber-600 text-black">
          <UserRound className="mr-2 h-4 w-4" />
          Add New User
        </Button>
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
                        <Badge className={
                          user.user_type === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' : 
                          user.user_type === 'owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        }>
                          {user.user_type || 'User'}
                        </Badge>
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
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <UserCog className="h-4 w-4" />
                          </Button>
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
    </div>
  );
} 
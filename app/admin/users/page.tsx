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
  Shield, 
  Mail, 
  PhoneCall, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  Trash,
  UserCog
} from "lucide-react";

/**
 * Admin Users Management Page
 * 
 * Provides an interface for administrators to manage user accounts:
 * - View users list with key information
 * - Search and filter users
 * - Manage user roles and permissions
 * - View user details and edit profiles
 * 
 * This page uses placeholder data and will be integrated with the user database.
 */
export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');

  // Placeholder user data
  const users = [
    { 
      id: 'u-001', 
      name: 'John Smith', 
      email: 'john@example.com', 
      phone: '+1 (555) 123-4567', 
      role: 'user', 
      verified: true, 
      status: 'active', 
      createdAt: '2023-08-15',
      lastLogin: '2023-10-12'
    },
    { 
      id: 'u-002', 
      name: 'Sarah Johnson', 
      email: 'sarah@example.com', 
      phone: '+1 (555) 234-5678', 
      role: 'admin', 
      verified: true, 
      status: 'active', 
      createdAt: '2023-07-22',
      lastLogin: '2023-10-14'
    },
    { 
      id: 'u-003', 
      name: 'Michael Brown', 
      email: 'michael@example.com', 
      phone: '+1 (555) 345-6789', 
      role: 'user', 
      verified: false, 
      status: 'pending', 
      createdAt: '2023-09-05',
      lastLogin: null
    },
    { 
      id: 'u-004', 
      name: 'Lisa Davis', 
      email: 'lisa@example.com', 
      phone: '+1 (555) 456-7890', 
      role: 'user', 
      verified: true, 
      status: 'active', 
      createdAt: '2023-08-30',
      lastLogin: '2023-10-10'
    },
    { 
      id: 'u-005', 
      name: 'Robert Wilson', 
      email: 'robert@example.com', 
      phone: '+1 (555) 567-8901', 
      role: 'user', 
      verified: true, 
      status: 'inactive', 
      createdAt: '2023-06-18',
      lastLogin: '2023-09-25'
    },
  ];

  // Filter users based on search query, role, and verification status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'all' || 
      user.role === roleFilter;
    
    const matchesVerification = 
      verificationFilter === 'all' || 
      (verificationFilter === 'verified' && user.verified) || 
      (verificationFilter === 'unverified' && !user.verified);
    
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
            <SelectItem value="user">User</SelectItem>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Status</TableHead>
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
                        <span>{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3 text-gray-500" />
                        <span>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <PhoneCall className="h-3 w-3 text-gray-500" />
                        <span>{user.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.role === 'admin' ? 
                        'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' : 
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
                  <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                    No users found matching your filters.
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
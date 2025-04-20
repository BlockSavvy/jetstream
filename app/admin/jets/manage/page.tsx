'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, User, Edit, Trash2, Eye, CheckSquare, XSquare } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Jet {
  id: string;
  manufacturer: string;
  model: string;
  year: string;
  tail_number: string;
  capacity: string;
  status: string;
  owner_id: string | null;
  home_base_airport: string;
  created_at: string;
}

interface JetUserAssignment {
  jet_id: string;
  user_id: string;
  role: 'owner' | 'operator' | 'crew' | 'passenger';
  permission_level: 'admin' | 'edit' | 'view';
}

// Main component
export default function ManageJets() {
  const router = useRouter();
  const [jets, setJets] = useState<Jet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJet, setSelectedJet] = useState<Jet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jetAssignments, setJetAssignments] = useState<JetUserAssignment[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('operator');
  const [selectedPermission, setSelectedPermission] = useState<string>('view');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jetToDelete, setJetToDelete] = useState<string | null>(null);
  const [customLayoutRequests, setCustomLayoutRequests] = useState<any[]>([]);

  // Fetch jets and users data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch jets
        const jetsResponse = await fetch('/api/jets');
        if (!jetsResponse.ok) throw new Error('Failed to fetch jets');
        const jetsData = await jetsResponse.json();

        // Fetch users
        const usersResponse = await fetch('/api/admin/users');
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();

        // Fetch jet assignments
        const assignmentsResponse = await fetch('/api/admin/jets/assignments');
        if (!assignmentsResponse.ok) throw new Error('Failed to fetch jet assignments');
        const assignmentsData = await assignmentsResponse.json();

        // Fetch custom layout requests
        const layoutRequestsResponse = await fetch('/api/admin/jets/layout-requests');
        if (!layoutRequestsResponse.ok) throw new Error('Failed to fetch layout requests');
        const layoutRequestsData = await layoutRequestsResponse.json();

        setJets(jetsData);
        setUsers(usersData);
        setJetAssignments(assignmentsData);
        setCustomLayoutRequests(layoutRequestsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter jets based on search query
  const filteredJets = jets.filter(jet => {
    const searchString = searchQuery.toLowerCase();
    return (
      jet.manufacturer.toLowerCase().includes(searchString) ||
      jet.model.toLowerCase().includes(searchString) ||
      jet.tail_number.toLowerCase().includes(searchString) ||
      jet.home_base_airport.toLowerCase().includes(searchString)
    );
  });

  // Handle assigning a user to a jet
  const handleAssignUser = async () => {
    if (!selectedJet || !selectedUser || !selectedRole || !selectedPermission) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/jets/assign-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jet_id: selectedJet.id,
          user_id: selectedUser,
          role: selectedRole,
          permission_level: selectedPermission,
        }),
      });

      if (!response.ok) throw new Error('Failed to assign user');

      // Update local state
      setJetAssignments([
        ...jetAssignments,
        {
          jet_id: selectedJet.id,
          user_id: selectedUser,
          role: selectedRole as 'owner' | 'operator' | 'crew' | 'passenger',
          permission_level: selectedPermission as 'admin' | 'edit' | 'view',
        },
      ]);

      toast.success('User assigned successfully');
      setIsAssignDialogOpen(false);
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error('Failed to assign user');
    }
  };

  // Handle removing a user assignment
  const handleRemoveAssignment = async (jetId: string, userId: string) => {
    try {
      const response = await fetch('/api/admin/jets/remove-assignment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jet_id: jetId,
          user_id: userId,
        }),
      });

      if (!response.ok) throw new Error('Failed to remove assignment');

      // Update local state
      setJetAssignments(jetAssignments.filter(
        assignment => !(assignment.jet_id === jetId && assignment.user_id === userId)
      ));

      toast.success('Assignment removed successfully');
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  // Handle delete jet
  const handleDeleteJet = async () => {
    if (!jetToDelete) return;

    try {
      const response = await fetch(`/api/jets/${jetToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete jet');

      // Update local state
      setJets(jets.filter(jet => jet.id !== jetToDelete));
      
      toast.success('Jet deleted successfully');
      setIsDeleteDialogOpen(false);
      setJetToDelete(null);
    } catch (error) {
      console.error('Error deleting jet:', error);
      toast.error('Failed to delete jet');
    }
  };

  // Handle approving a custom layout request
  const handleApproveLayoutRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/jets/layout-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve layout request');

      // Update local state
      setCustomLayoutRequests(customLayoutRequests.filter(request => request.id !== requestId));
      
      toast.success('Layout request approved');
    } catch (error) {
      console.error('Error approving layout request:', error);
      toast.error('Failed to approve layout request');
    }
  };

  // Handle rejecting a custom layout request
  const handleRejectLayoutRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/jets/layout-requests/${requestId}/reject`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reject layout request');

      // Update local state
      setCustomLayoutRequests(customLayoutRequests.filter(request => request.id !== requestId));
      
      toast.success('Layout request rejected');
    } catch (error) {
      console.error('Error rejecting layout request:', error);
      toast.error('Failed to reject layout request');
    }
  };

  // Get user name from id
  const getUserName = (userId: string) => {
    const user = users.find(user => user.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // Get jet assignments for a specific jet
  const getJetAssignments = (jetId: string) => {
    return jetAssignments.filter(assignment => assignment.jet_id === jetId);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Jets</h1>
        <Button 
          onClick={() => router.push('/jets/add')}
          className="bg-[#39FF14] hover:bg-[#32E012] text-black"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Jet
        </Button>
      </div>

      <Tabs defaultValue="jets" className="w-full mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="jets">Jets</TabsTrigger>
          <TabsTrigger value="layout-requests">
            Layout Requests
            {customLayoutRequests.length > 0 && (
              <Badge className="ml-2 bg-[#DC143C]">{customLayoutRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="jets">
          <div className="mb-4">
            <Input
              placeholder="Search jets by manufacturer, model, tail number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39FF14]"></div>
            </div>
          ) : filteredJets.length > 0 ? (
            <div className="bg-[#0D0D0D] rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 bg-gray-900">
                    <TableHead className="text-[#D8D8D8]">Manufacturer & Model</TableHead>
                    <TableHead className="text-[#D8D8D8]">Year</TableHead>
                    <TableHead className="text-[#D8D8D8]">Tail Number</TableHead>
                    <TableHead className="text-[#D8D8D8]">Capacity</TableHead>
                    <TableHead className="text-[#D8D8D8]">Status</TableHead>
                    <TableHead className="text-[#D8D8D8]">Home Base</TableHead>
                    <TableHead className="text-[#D8D8D8]">Users</TableHead>
                    <TableHead className="text-[#D8D8D8]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJets.map((jet) => (
                    <TableRow 
                      key={jet.id} 
                      className="border-gray-800 hover:bg-gray-900/50"
                    >
                      <TableCell className="font-medium text-white">
                        {jet.manufacturer} {jet.model}
                      </TableCell>
                      <TableCell className="text-[#D8D8D8]">{jet.year}</TableCell>
                      <TableCell className="text-[#D8D8D8]">{jet.tail_number}</TableCell>
                      <TableCell className="text-[#D8D8D8]">{jet.capacity}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            jet.status === 'available' 
                              ? 'bg-green-600' 
                              : jet.status === 'maintenance' 
                              ? 'bg-amber-600' 
                              : 'bg-blue-600'
                          }
                        >
                          {jet.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#D8D8D8]">{jet.home_base_airport}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getJetAssignments(jet.id).slice(0, 3).map((assignment, idx) => (
                            <Badge key={idx} variant="outline" className="bg-gray-800 border-gray-700">
                              {getUserName(assignment.user_id)} ({assignment.role})
                            </Badge>
                          ))}
                          {getJetAssignments(jet.id).length > 3 && (
                            <Badge variant="outline" className="bg-gray-800 border-gray-700">
                              +{getJetAssignments(jet.id).length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-700 hover:bg-gray-800"
                            onClick={() => {
                              setSelectedJet(jet);
                              setIsAssignDialogOpen(true);
                            }}
                          >
                            <User className="h-4 w-4 text-[#39FF14]" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-700 hover:bg-gray-800"
                            onClick={() => router.push(`/admin/jets/edit/${jet.id}`)}
                          >
                            <Edit className="h-4 w-4 text-[#D8D8D8]" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-700 hover:bg-gray-800"
                            onClick={() => {
                              setJetToDelete(jet.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-[#DC143C]" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-700 hover:bg-gray-800"
                            onClick={() => router.push(`/admin/jets/layouts/${jet.id}`)}
                          >
                            <Eye className="h-4 w-4 text-[#D8D8D8]" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-900 rounded-lg text-[#D8D8D8]">
              {searchQuery ? 'No jets match your search criteria' : 'No jets found'}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="layout-requests">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39FF14]"></div>
            </div>
          ) : customLayoutRequests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customLayoutRequests.map((request) => (
                <Card key={request.id} className="bg-[#0D0D0D] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Custom Layout Request</CardTitle>
                    <CardDescription className="text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-[#D8D8D8]">User</Label>
                      <p className="text-white">{getUserName(request.user_id)}</p>
                    </div>
                    <div>
                      <Label className="text-[#D8D8D8]">Jet</Label>
                      <p className="text-white">
                        {jets.find(jet => jet.id === request.jet_id)?.manufacturer || 'Unknown'}{' '}
                        {jets.find(jet => jet.id === request.jet_id)?.model || 'Jet'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-[#D8D8D8]">Request Details</Label>
                      <p className="text-white">{request.notes}</p>
                    </div>
                    <div>
                      <Label className="text-[#D8D8D8]">Total Seats</Label>
                      <p className="text-white">{request.total_seats}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-gray-800 pt-4">
                    <Button 
                      variant="outline" 
                      className="border-green-700 text-green-400 hover:bg-green-900/30"
                      onClick={() => handleApproveLayoutRequest(request.id)}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-red-700 text-red-400 hover:bg-red-900/30"
                      onClick={() => handleRejectLayoutRequest(request.id)}
                    >
                      <XSquare className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-900 rounded-lg text-[#D8D8D8]">
              No custom layout requests found
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* User Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-[#0D0D0D] text-[#D8D8D8] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Assign User to Jet</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedJet && `${selectedJet.manufacturer} ${selectedJet.model} (${selectedJet.tail_number})`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="user">User</Label>
              <Select onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={setSelectedRole} defaultValue="operator">
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                  <SelectItem value="passenger">Passenger</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="permission">Permission Level</Label>
              <Select onValueChange={setSelectedPermission} defaultValue="view">
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select permission level" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="view">View Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Current assignments */}
            {selectedJet && getJetAssignments(selectedJet.id).length > 0 && (
              <div>
                <Label>Current Assignments</Label>
                <div className="mt-2 p-3 bg-gray-900 rounded-md space-y-2">
                  {getJetAssignments(selectedJet.id).map((assignment, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{getUserName(assignment.user_id)} ({assignment.role})</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => handleRemoveAssignment(assignment.jet_id, assignment.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAssignDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignUser}
              className="bg-[#39FF14] hover:bg-[#32E012] text-black"
            >
              Assign User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#0D0D0D] text-[#D8D8D8] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this jet? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteJet}
              className="bg-[#DC143C] hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCog } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUi } from '../ui-context';

const userTypes = [
  { value: 'user', label: 'Standard User', description: 'Regular platform user with basic permissions' },
  { value: 'premium', label: 'Premium User', description: 'User with access to premium features' },
  { value: 'owner', label: 'Jet Owner', description: 'User who owns and manages jets' },
  { value: 'admin', label: 'Administrator', description: 'Full system access and management' },
];

const userRoles = [
  { value: 'user', label: 'User', description: 'Standard role with basic permissions' },
  { value: 'manager', label: 'Manager', description: 'Can manage specific resources' },
  { value: 'admin', label: 'Admin', description: 'Administrative privileges' },
  { value: 'super_admin', label: 'Super Admin', description: 'Complete system access' },
];

export function UserRoleDialog() {
  const { userRoleOpen, selectedUser, closeUserDialogs, refreshUsers } = useUi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [userType, setUserType] = useState<string>('');
  const [role, setRole] = useState<string>('');
  
  // Update form data when selectedUser changes
  useState(() => {
    if (selectedUser) {
      setUserType(selectedUser.user_type || 'user');
      setRole(selectedUser.role || 'user');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: userType,
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast.success('User roles updated successfully');
      closeUserDialogs();
      refreshUsers();
    } catch (error: any) {
      console.error('Error updating user roles:', error);
      toast.error(`Failed to update user roles: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={userRoleOpen} onOpenChange={closeUserDialogs}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Update user type and role permissions.
          </DialogDescription>
        </DialogHeader>
        
        {selectedUser && (
          <form onSubmit={handleSubmit}>
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-center mb-4">
                <Badge className="px-3 py-1 text-sm">{selectedUser.email}</Badge>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-type">User Type</Label>
                <Select
                  value={userType}
                  onValueChange={setUserType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div>{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">System Role</Label>
                <Select
                  value={role}
                  onValueChange={setRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((roleOption) => (
                      <SelectItem key={roleOption.value} value={roleOption.value}>
                        <div>
                          <div>{roleOption.label}</div>
                          <div className="text-xs text-gray-500">{roleOption.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update Permissions'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 
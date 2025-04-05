'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUi } from '../ui-context';

export function UserRoleDialog() {
  const { userRoleOpen, selectedUser, closeUserDialogs, refreshUsers } = useUi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('user');

  // Reset selected role when user changes
  useEffect(() => {
    if (selectedUser) {
      setSelectedRole(selectedUser.user_type || 'user');
    }
  }, [selectedUser]);

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser?.id) return;
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: selectedRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast.success(`Role updated to ${selectedRole}`);
      closeUserDialogs();
      refreshUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={userRoleOpen} onOpenChange={closeUserDialogs}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage User Permissions</DialogTitle>
          <DialogDescription>
            Change the user's role and permissions. This will affect what actions they can perform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedRole}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="traveler">Traveler</SelectItem>
                    <SelectItem value="user">Basic User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Current User: </span> 
                  {selectedUser?.first_name} {selectedUser?.last_name} ({selectedUser?.email})
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium">Current Role: </span> 
                  {selectedUser?.user_type || 'User'}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save permissions'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
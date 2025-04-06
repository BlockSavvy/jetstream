'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, User, Calendar, Shield, Edit } from 'lucide-react';
import { useUi } from '../ui-context';

export function UserViewDialog() {
  const { userViewOpen, selectedUser, closeUserDialogs, openUserEdit } = useUi();

  if (!selectedUser) return null;

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to get initials
  const getInitials = () => {
    if (!selectedUser.first_name && !selectedUser.last_name) return 'U';
    
    const firstInitial = selectedUser.first_name?.[0] || '';
    const lastInitial = selectedUser.last_name?.[0] || '';
    
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <Dialog open={userViewOpen} onOpenChange={closeUserDialogs}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center space-x-4 mt-2">
          <Avatar className="h-16 w-16">
            <AvatarImage 
              src={selectedUser.avatar_url || ''}
              alt={`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()}
            />
            <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="text-xl font-semibold">
              {selectedUser.first_name} {selectedUser.last_name}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {selectedUser.role || 'User'}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  selectedUser.verification_status === 'verified' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                }`}
              >
                {selectedUser.verification_status || 'Unverified'}
              </Badge>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-4">
          <div className="flex items-start">
            <Mail className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">{selectedUser.email || 'No email provided'}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <User className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">User Type</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">{selectedUser.user_type || 'Standard'}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Role</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">{selectedUser.role || 'User'}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Account Created</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">{formatDate(selectedUser.created_at)}</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              closeUserDialogs();
              openUserEdit(selectedUser);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedBadge } from '../enhanced-badge';
import { Shield, Calendar, Clock, Mail, UserRound, CheckCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useUi } from '../ui-context';

export function UserViewDialog() {
  const { userViewOpen, selectedUser, closeUserDialogs } = useUi();

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

  return (
    <Dialog open={userViewOpen} onOpenChange={closeUserDialogs}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            Complete profile information for this user.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              {selectedUser.avatar_url ? (
                <img 
                  src={selectedUser.avatar_url} 
                  alt={`${selectedUser.first_name} ${selectedUser.last_name}`} 
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <UserRound className="h-10 w-10 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {selectedUser.first_name} {selectedUser.last_name}
              </h3>
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 text-gray-500" />
                <span className="text-sm text-gray-500">{selectedUser.email}</span>
              </div>
              <div className="mt-2">
                <EnhancedBadge className={
                  selectedUser.user_type === 'admin' ? 'bg-amber-100 text-amber-800 border-amber-300' : 
                  selectedUser.user_type === 'owner' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                  'bg-blue-100 text-blue-800 border-blue-300'
                }>
                  {selectedUser.user_type || 'User'}
                </EnhancedBadge>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Account Status</div>
              <div className="flex items-center space-x-2">
                {selectedUser.verification_status === 'verified' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{selectedUser.verification_status || 'Unverified'}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">User Role</div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{selectedUser.user_type || 'Basic User'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Joined Date</div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatDate(selectedUser.created_at)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Last Updated</div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatDate(selectedUser.updated_at)}</span>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="text-sm font-medium">User ID</div>
            <div className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
              {selectedUser.id}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
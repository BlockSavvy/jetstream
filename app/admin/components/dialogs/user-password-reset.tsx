'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, KeyRound, Loader2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUi } from '../ui-context';

export function UserPasswordResetDialog() {
  const { userPasswordResetOpen, selectedUser, closeUserDialogs } = useUi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSendReset = async () => {
    if (!selectedUser?.email) {
      toast.error('No email address available for this user');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setResetSent(true);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeUserDialogs();
    // Reset state after dialog is closed
    setTimeout(() => setResetSent(false), 300);
  };

  return (
    <Dialog open={userPasswordResetOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            This will send a password reset email to the user.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          {resetSent ? (
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
              <p className="mb-2 font-semibold">Reset Link Sent!</p>
              <p className="text-sm text-muted-foreground">
                A password reset link has been sent to<br />
                <span className="font-medium">{selectedUser?.email}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{selectedUser?.email}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to send a password reset email to this user?
              </p>
              <div className="flex items-center space-x-2 text-amber-500 bg-amber-50 p-2 rounded text-sm">
                <KeyRound className="h-4 w-4" />
                <span>
                  This will invalidate their current password.
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {resetSent ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <Button onClick={handleSendReset} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
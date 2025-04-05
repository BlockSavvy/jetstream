'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUi } from '../ui-context';

export function JetShareDeleteDialog() {
  const { jetShareDeleteOpen, selectedOffer, closeJetShareDialogs, refreshOffers } = useUi();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!selectedOffer) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('jetshare_offers')
        .delete()
        .eq('id', selectedOffer.id);
      
      if (error) throw error;
      
      toast.success('JetShare offer deleted successfully');
      closeJetShareDialogs();
      refreshOffers();
    } catch (error: any) {
      console.error('Error deleting JetShare offer:', error);
      toast.error(`Failed to delete offer: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={jetShareDeleteOpen} onOpenChange={closeJetShareDialogs}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete this JetShare offer?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-md p-4 mb-4">
            <h4 className="font-medium text-sm text-amber-800 dark:text-amber-300 mb-2">
              Offer Details:
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Route:</span> {selectedOffer.departure_location} → {selectedOffer.arrival_location}
            </p>
            {selectedOffer.flight_date && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <span className="font-semibold">Date:</span> {new Date(selectedOffer.flight_date).toLocaleDateString()}
              </p>
            )}
            {Array.isArray(selectedOffer.user) && selectedOffer.user.length > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <span className="font-semibold">Created By:</span> {selectedOffer.user[0].first_name} {selectedOffer.user[0].last_name}
              </p>
            )}
          </div>
          
          {selectedOffer.status !== 'open' && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md p-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Warning: This offer has status "{selectedOffer.status}" and may already have a match or be in progress.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeJetShareDialogs}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
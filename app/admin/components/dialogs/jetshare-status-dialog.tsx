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
import { Loader2, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { EnhancedBadge } from '../enhanced-badge';
import { useUi } from '../ui-context';

export function JetShareStatusDialog() {
  const { jetShareStatusOpen, selectedOffer, closeJetShareDialogs, refreshOffers } = useUi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('open');

  useEffect(() => {
    if (selectedOffer) {
      setSelectedStatus(selectedOffer.status);
    }
  }, [selectedOffer]);

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOffer?.id) return;
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('jetshare_offers')
        .update({
          status: selectedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOffer.id);
      
      if (error) throw error;
      
      toast.success(`Status updated to ${selectedStatus}`);
      closeJetShareDialogs();
      refreshOffers();
    } catch (error) {
      console.error('Error updating JetShare status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={jetShareStatusOpen} onOpenChange={closeJetShareDialogs}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update JetShare Status</DialogTitle>
          <DialogDescription>
            Change the status of this JetShare offer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedStatus}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Tag className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Current Status: </span> 
                  <EnhancedBadge status={selectedOffer?.status as any}>
                    {selectedOffer?.status ? selectedOffer.status.charAt(0).toUpperCase() + selectedOffer.status.slice(1) : 'Unknown'}
                  </EnhancedBadge>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium">Route: </span> 
                  {selectedOffer?.departure_location} → {selectedOffer?.arrival_location}
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
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
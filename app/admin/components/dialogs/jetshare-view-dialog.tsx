'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedBadge } from '../enhanced-badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plane, 
  Calendar, 
  User, 
  DollarSign, 
  Clock,
  Trash2,
  Edit
} from 'lucide-react';
import { useUi } from '../ui-context';

export function JetShareViewDialog() {
  const { jetShareViewOpen, selectedOffer, closeJetShareDialogs, openJetShareStatus, openJetShareDelete } = useUi();

  if (!selectedOffer) return null;

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format currency helper
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={jetShareViewOpen} onOpenChange={closeJetShareDialogs}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>JetShare Offer Details</DialogTitle>
          <DialogDescription>
            Complete information about this JetShare offer.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium">
                {selectedOffer.departure_location} → {selectedOffer.arrival_location}
              </h3>
            </div>
            <EnhancedBadge status={selectedOffer.status}>
              {selectedOffer.status.charAt(0).toUpperCase() + selectedOffer.status.slice(1)}
            </EnhancedBadge>
          </div>

          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Flight Date</div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatDate(selectedOffer.flight_date)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Created By</div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {Array.isArray(selectedOffer.user) && selectedOffer.user.length > 0
                    ? `${selectedOffer.user[0].first_name || ''} ${selectedOffer.user[0].last_name || ''}`.trim() || 'Unknown User'
                    : 'Unknown User'
                  }
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Total Flight Cost</div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-bold">{formatCurrency(selectedOffer.total_flight_cost)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Requested Share</div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatCurrency(selectedOffer.requested_share_amount)}</span>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Matched Traveler</div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {selectedOffer.matched_user_id 
                  ? (Array.isArray(selectedOffer.matched_user) && selectedOffer.matched_user.length > 0
                    ? `${selectedOffer.matched_user[0].first_name || ''} ${selectedOffer.matched_user[0].last_name || ''}`.trim()
                    : 'Unknown User')
                  : 'No match yet'
                }
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="text-sm font-medium">Timestamps</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">Created: {formatDate(selectedOffer.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">Updated: {formatDate(selectedOffer.updated_at)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <div className="text-sm font-medium">Share Analysis</div>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs">Share Percentage:</span>
                <span className="text-xs font-medium">
                  {selectedOffer.total_flight_cost > 0 
                    ? `${Math.round((selectedOffer.requested_share_amount / selectedOffer.total_flight_cost) * 100)}%` 
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Cost After Match:</span>
                <span className="text-xs font-medium">
                  {formatCurrency(selectedOffer.total_flight_cost - selectedOffer.requested_share_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between items-center">
          <div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                closeJetShareDialogs();
                openJetShareDelete(selectedOffer);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                closeJetShareDialogs();
                openJetShareStatus(selectedOffer);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Change Status
            </Button>
            <Button 
              onClick={closeJetShareDialogs}
              size="sm"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
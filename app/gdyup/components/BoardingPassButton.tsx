import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Ticket, Wallet, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface BoardingPassButtonProps {
  transactionId?: string;
  offerId: string;
  isTestMode?: boolean;
}

export default function BoardingPassButton({ 
  transactionId, 
  offerId,
  isTestMode = false
}: BoardingPassButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleWalletLoading, setIsAppleWalletLoading] = useState(false);
  
  const downloadBoardingPass = async () => {
    setIsLoading(true);
    
    try {
      // Build the query parameters based on available IDs
      const idParam = transactionId 
        ? `transactionId=${transactionId}` 
        : `offerId=${offerId}`;
      
      // Add test flag if needed
      const testParam = isTestMode ? '&test=true' : '';
      
      // Call the API to generate boarding pass
      const response = await fetch(`/api/jetshare/generateBoardingPass?${idParam}${testParam}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate boarding pass');
      }
      
      // Open the boarding pass in a new tab
      window.open(data.downloadUrl, '_blank');
      toast.success('Boarding pass downloaded successfully');
    } catch (err) {
      console.error('Error downloading boarding pass:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to download boarding pass';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  const addToAppleWallet = async () => {
    setIsAppleWalletLoading(true);
    
    try {
      // Build the query parameters based on available IDs
      const idParam = transactionId 
        ? `transactionId=${transactionId}` 
        : `offerId=${offerId}`;
      
      // Add test flag if needed
      const testParam = isTestMode ? '&test=true' : '';
      
      // Call the API to generate Apple Wallet pass
      const response = await fetch(`/api/jetshare/generateBoardingPass?${idParam}${testParam}&format=wallet`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate Apple Wallet pass');
      }
      
      // In a real production app, this would open a .pkpass file that the OS would recognize
      // For our demo, we'll just open the simulated wallet pass endpoint
      window.open(data.walletUrl, '_blank');
      toast.success('Boarding pass added to Apple Wallet', {
        description: isTestMode ? 'Test mode: This is a simulated Apple Wallet pass' : undefined
      });
    } catch (err) {
      console.error('Error generating Apple Wallet pass:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to add to Apple Wallet';
      toast.error(errorMsg);
    } finally {
      setIsAppleWalletLoading(false);
    }
  };
  
  return (
    <div className="flex gap-2">
      <Button
        className="text-sm"
        variant="outline"
        disabled={isLoading}
        onClick={downloadBoardingPass}
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Ticket className="h-4 w-4 mr-2" />
            Boarding Pass
          </>
        )}
      </Button>
      
      <Button
        className="text-sm"
        variant="secondary"
        disabled={isAppleWalletLoading}
        onClick={addToAppleWallet}
      >
        {isAppleWalletLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            Add to Wallet
          </>
        )}
      </Button>
    </div>
  );
} 
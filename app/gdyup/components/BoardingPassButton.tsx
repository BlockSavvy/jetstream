'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Ticket, Wallet, Download, RefreshCw, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BoardingPassButtonProps {
  transactionId?: string;
  offerId: string;
  isTestMode?: boolean;
  variant?: 'default' | 'compact' | 'expanded';
  showQR?: boolean;
}

export default function BoardingPassButton({ 
  transactionId, 
  offerId,
  isTestMode = false,
  variant = 'default',
  showQR = true
}: BoardingPassButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleWalletLoading, setIsAppleWalletLoading] = useState(false);
  const [isQRLoading, setIsQRLoading] = useState(false);
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  const downloadBoardingPass = async () => {
    setIsLoading(true);
    
    try {
      // Construct the API endpoint URL
      const apiUrl = `/api/boardingpass/${offerId}?format=pdf${isTestMode ? '&test=true' : ''}`;
      
      // Fetch the boarding pass PDF
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download boarding pass: ${response.statusText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `boarding-pass-${offerId}.pdf`;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      toast.success('Boarding pass downloaded successfully!');
    } catch (error) {
      console.error('Error downloading boarding pass:', error);
      toast.error('Failed to download boarding pass. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const addToAppleWallet = async () => {
    setIsAppleWalletLoading(true);
    
    try {
      // Construct the API endpoint URL
      const apiUrl = `/api/boardingpass/${offerId}?format=pkpass${isTestMode ? '&test=true' : ''}`;
      
      // Fetch the Apple Wallet pass
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to generate Apple Wallet pass: ${response.statusText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `boarding-pass-${offerId}.pkpass`;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      toast.success('Apple Wallet pass generated successfully!');
    } catch (error) {
      console.error('Error generating Apple Wallet pass:', error);
      toast.error('Failed to generate Apple Wallet pass. Please try again later.');
    } finally {
      setIsAppleWalletLoading(false);
    }
  };
  
  const showNostrQR = async () => {
    setIsQRLoading(true);
    
    try {
      // Simulate API call to generate Nostr QR code
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real implementation, you would fetch the Nostr QR from your backend
      // For now, we'll just show a toast message
      toast.success('Nostr QR code will be displayed in a modal');
      
      // Here you would open a modal with the QR code
      // For now, let's just log to console
      console.log('Showing Nostr QR code for boarding pass:', offerId);
    } catch (error) {
      console.error('Error generating Nostr QR code:', error);
      toast.error('Failed to generate Nostr QR code. Please try again later.');
    } finally {
      setIsQRLoading(false);
    }
  };
  
  if (variant === 'compact') {
    return (
      <div className="flex gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={downloadBoardingPass}
            className="text-xs font-medium border-gdyup-border hover:bg-gdyup-bg-dark hover:text-gdyup-primary"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Ticket className="h-3 w-3" />
            )}
          </Button>
        </motion.div>
      </div>
    );
  }
  
  if (variant === 'expanded') {
    return (
      <motion.div 
        className={cn(
          "p-4 rounded-lg border space-y-3",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={cn("text-lg font-semibold mb-2", getThemedTextClasses())}>
          Boarding Pass Options
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              disabled={isLoading}
              onClick={downloadBoardingPass}
              className={cn(
                "h-14 rounded-md font-medium flex flex-col items-center justify-center space-y-1 w-full",
                getThemedButtonClasses('primary')
              )}
            >
              {isLoading ? (
                <motion.div 
                  className="flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </motion.div>
              ) : (
                <motion.div 
                  className="flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Ticket className="h-5 w-5" />
                  <span className="text-xs">Download PDF</span>
                </motion.div>
              )}
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              disabled={isAppleWalletLoading}
              onClick={addToAppleWallet}
              className="h-14 rounded-md font-medium flex flex-col items-center justify-center space-y-1 w-full bg-black text-white border border-gdyup-border hover:bg-gdyup-bg-dark"
            >
              {isAppleWalletLoading ? (
                <motion.div 
                  className="flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </motion.div>
              ) : (
                <motion.div 
                  className="flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="text-xs">Add to Apple Wallet</span>
                </motion.div>
              )}
            </Button>
          </motion.div>
          
          {showQR && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                disabled={isQRLoading}
                onClick={showNostrQR}
                className={cn(
                  "h-14 rounded-md font-medium flex flex-col items-center justify-center space-y-1 w-full",
                  getThemedButtonClasses('secondary')
                )}
                title="Nostr QR codes allow for decentralized verification of your boarding pass on the Nostr protocol, enhancing privacy and security"
              >
                {isQRLoading ? (
                  <motion.div 
                    className="flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="text-xs">Loading...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <QrCode className="h-5 w-5" />
                    <span className="text-xs">Nostr QR Code</span>
                  </motion.div>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }
  
  // Default variant
  return (
    <div className="flex gap-2">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={downloadBoardingPass}
          className="text-sm border-gdyup-border hover:bg-gdyup-bg-dark hover:text-gdyup-primary"
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
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          disabled={isAppleWalletLoading}
          onClick={addToAppleWallet}
          className={getThemedButtonClasses('primary')}
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
      </motion.div>
      
      {showQR && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            disabled={isQRLoading}
            onClick={showNostrQR}
            className="border-gdyup-secondary hover:bg-gdyup-secondary/20 text-gdyup-secondary"
          >
            {isQRLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Nostr QR
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
} 
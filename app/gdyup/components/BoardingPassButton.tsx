import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Ticket, Wallet, Download, RefreshCw, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { motion } from 'framer-motion';

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
  const { getThemeClasses, theme } = useGdyupTheme();
  
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to generate boarding pass');
      }
      
      const data = await response.json();
      
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to generate Apple Wallet pass');
      }
      
      const data = await response.json();
      
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
  
  const showNostrQR = async () => {
    setIsQRLoading(true);
    
    try {
      // Build the query parameters based on available IDs
      const idParam = transactionId 
        ? `transactionId=${transactionId}` 
        : `offerId=${offerId}`;
      
      // Add test flag if needed
      const testParam = isTestMode ? '&test=true' : '';
      
      // Call the API to generate QR code
      const response = await fetch(`/api/jetshare/generateBoardingPass?${idParam}${testParam}&format=qr`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to generate Nostr QR code');
      }
      
      const data = await response.json();
      
      // Open the QR code in a new window/tab
      window.open(data.qrUrl, '_blank');
      toast.success('Nostr QR code generated successfully');
    } catch (err) {
      console.error('Error generating Nostr QR code:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate Nostr QR code';
      toast.error(errorMsg);
    } finally {
      setIsQRLoading(false);
    }
  };
  
  if (variant === 'compact') {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={downloadBoardingPass}
          className={getThemeClasses({
            base: "text-xs font-medium",
            default: "border-gray-700 hover:bg-gray-800 hover:text-[#DAFF0D]",
            blue: "border-blue-700 hover:bg-blue-800 hover:text-blue-300",
            pink: "border-pink-700 hover:bg-pink-800 hover:text-pink-300"
          })}
        >
          {isLoading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Ticket className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  }
  
  if (variant === 'expanded') {
    return (
      <motion.div 
        className={getThemeClasses({
          base: "p-4 rounded-lg border space-y-3",
          default: "bg-black/20 border-gray-800",
          blue: "bg-blue-950/20 border-blue-900",
          pink: "bg-pink-950/20 border-pink-900"
        })}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={getThemeClasses({
          base: "text-lg font-semibold mb-2",
          default: "text-white",
          blue: "text-blue-100",
          pink: "text-pink-100"
        })}>
          Boarding Pass Options
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            disabled={isLoading}
            onClick={downloadBoardingPass}
            className={getThemeClasses({
              base: "h-14 rounded-md font-medium flex flex-col items-center justify-center space-y-1",
              default: "bg-gray-800 hover:bg-gray-700 text-white",
              blue: "bg-blue-800 hover:bg-blue-700 text-white",
              pink: "bg-pink-800 hover:bg-pink-700 text-white"
            })}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-xs">Loading...</span>
              </>
            ) : (
              <>
                <Ticket className="h-5 w-5" />
                <span className="text-xs">Download PDF</span>
              </>
            )}
          </Button>
          
          <Button
            disabled={isAppleWalletLoading}
            onClick={addToAppleWallet}
            className={getThemeClasses({
              base: "h-14 rounded-md font-medium flex flex-col items-center justify-center space-y-1",
              default: "bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black",
              blue: "bg-blue-500 hover:bg-blue-600 text-white",
              pink: "bg-pink-500 hover:bg-pink-600 text-white"
            })}
          >
            {isAppleWalletLoading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-xs">Loading...</span>
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                <span className="text-xs">Add to Apple Wallet</span>
              </>
            )}
          </Button>
          
          {showQR && (
            <Button
              disabled={isQRLoading}
              onClick={showNostrQR}
              className={getThemeClasses({
                base: "h-14 rounded-md font-medium flex flex-col items-center justify-center space-y-1",
                default: "bg-purple-700 hover:bg-purple-600 text-white",
                blue: "bg-purple-800 hover:bg-purple-700 text-white",
                pink: "bg-purple-800 hover:bg-purple-700 text-white"
              })}
            >
              {isQRLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </>
              ) : (
                <>
                  <QrCode className="h-5 w-5" />
                  <span className="text-xs">Nostr QR Code</span>
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    );
  }
  
  // Default variant
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        disabled={isLoading}
        onClick={downloadBoardingPass}
        className={getThemeClasses({
          base: "text-sm",
          default: "border-gray-700 hover:bg-gray-800 hover:text-[#DAFF0D]",
          blue: "border-blue-700 hover:bg-blue-800 hover:text-blue-300",
          pink: "border-pink-700 hover:bg-pink-800 hover:text-pink-300"
        })}
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
        variant="secondary"
        disabled={isAppleWalletLoading}
        onClick={addToAppleWallet}
        className={getThemeClasses({
          base: "text-sm",
          default: "bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black",
          blue: "bg-blue-500 hover:bg-blue-600 text-white",
          pink: "bg-pink-500 hover:bg-pink-600 text-white"
        })}
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
      
      {showQR && (
        <Button
          variant="outline"
          disabled={isQRLoading}
          onClick={showNostrQR}
          className={getThemeClasses({
            base: "text-sm",
            default: "border-purple-700 hover:bg-purple-900/50 text-purple-300",
            blue: "border-purple-700 hover:bg-purple-900/50 text-purple-300",
            pink: "border-purple-700 hover:bg-purple-900/50 text-purple-300"
          })}
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
      )}
    </div>
  );
} 
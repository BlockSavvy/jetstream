'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { JetShareOfferWithUser, JetShareTransactionWithDetails } from '@/types/jetshare';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Plane, Download, ExternalLink, RefreshCw, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import BoardingPassButton from './BoardingPassButton';

interface TransactionClientProps {
  offer: JetShareOfferWithUser;
  transactions: JetShareTransactionWithDetails[];
  user?: User;
  isOriginalOfferer: boolean;
  isTestMode?: boolean;
}

export default function TransactionClient({ 
  offer, 
  transactions, 
  user,
  isOriginalOfferer,
  isTestMode = false
}: TransactionClientProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const transaction = transactions.length > 0 ? transactions[0] : null;

  // Simplify the test mode useEffect to avoid TypeScript issues
  useEffect(() => {
    // Only show the test mode notification when isTestMode is true
    if (isTestMode) {
      toast.info('Viewing in test mode', {
        description: 'Some features may be limited without authentication'
      });
    }
  }, [isTestMode]);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-600">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-600">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline" className="dark:border-gray-600">{status}</Badge>;
    }
  };

  const downloadReceipt = async (transactionId: string) => {
    setIsDownloading(true);
    
    try {
      // Generate the receipt - pass test flag if in test mode
      const testParam = isTestMode || transactionId.startsWith('test-') ? '&test=true' : '';
      const response = await fetch(`/api/jetshare/generateReceipt?transactionId=${transactionId}${testParam}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate receipt');
      }
      
      // Download the generated receipt
      window.open(data.downloadUrl, '_blank');
      toast.success('Receipt downloaded successfully');
    } catch (err) {
      console.error('Error downloading receipt:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to download receipt';
      toast.error(errorMsg);
      
      // Special handling for auth errors in non-test mode
      if (err instanceof Error && err.message.includes('Unauthorized') && !isTestMode) {
        toast.info('Please sign in to download your receipt', {
          description: 'You will be redirected to login',
          duration: 5000
        });
        
        // Redirect to login with return URL
        setTimeout(() => {
          router.push(`/auth/login?returnUrl=/jetshare/transaction/${offer.id}`);
        }, 2000);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Also simplify the test mode display in the empty transaction card
  if (!transaction) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 jetstream-card">
        <CardContent className="pt-6">
          <div className="flex items-center text-amber-700 dark:text-amber-100 mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h2 className="text-lg font-medium">Transaction Details Processing</h2>
            <div className="ml-auto text-xs text-amber-500 dark:text-amber-300 font-mono">
              Flight #{offer.id?.toString().substring(0, 6)}
            </div>
          </div>
          <p className="text-amber-600 dark:text-amber-200 mb-3">Your payment has been received, but transaction details are still being processed.</p>
          
          {isTestMode && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md text-blue-700 dark:text-blue-200 text-sm mb-3 border border-blue-200 dark:border-blue-700">
              <p className="font-medium">Test Mode Active</p>
              <p>Transaction details are simulated and may not show complete information.</p>
            </div>
          )}
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-100 dark:border-gray-700">
            <h3 className="font-medium mb-2 dark:text-high-contrast">Offer Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">From</p>
                <p className="font-medium dark:text-high-contrast">{offer.departure_location}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">To</p>
                <p className="font-medium dark:text-high-contrast">{offer.arrival_location}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Flight Date</p>
                <p className="font-medium dark:text-high-contrast">{format(new Date(offer.flight_date), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-medium dark:text-high-contrast capitalize">{offer.status}</p>
              </div>
            </div>
          </div>
          
          <Button 
            className="mt-4 bg-amber-500 hover:bg-amber-600 text-white" 
            onClick={() => router.push('/jetshare/dashboard')}
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-2" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold dark:text-high-contrast">Transaction Details</h1>
      </div>
      
      <Card className="mb-6 jetstream-card dark:futuristic-border">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl dark:text-high-contrast">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Plane className="h-5 w-5 mr-2 rotate-90" />
                    {offer?.departure_location} → {offer?.arrival_location}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    Flight #{offer?.id?.toString().substring(0, 6)}
                  </div>
                </div>
              </CardTitle>
              <CardDescription className="mt-1 dark:text-medium-contrast">
                {offer ? format(new Date(offer.flight_date), 'EEEE, MMMM d, yyyy') : ''}
              </CardDescription>
            </div>
            {getPaymentStatusBadge(transaction.payment_status)}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">PAYMENT DETAILS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="font-medium dark:text-high-contrast">{formatCurrency(transaction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Handling Fee</p>
                  <p className="font-medium dark:text-high-contrast">{formatCurrency(transaction.handling_fee || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                  <p className="font-medium dark:text-high-contrast capitalize">{transaction.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Transaction Date</p>
                  <p className="font-medium dark:text-high-contrast">{format(new Date(transaction.transaction_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
            
            <Separator className="dark:bg-gray-700" />
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2 flex justify-between items-center">
                <span>TRANSACTION DETAILS</span>
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                  Txn #{transaction.id?.toString().substring(0, 6)}
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</p>
                  <p className="font-medium text-sm font-mono dark:text-high-contrast">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Reference</p>
                  <p className="font-medium text-sm font-mono truncate dark:text-high-contrast">{transaction.transaction_reference || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {transaction.payment_status === 'completed' && (
              <>
                <Separator className="dark:bg-gray-700" />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">USERS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Payer</p>
                      <p className="font-medium dark:text-high-contrast">
                        {transaction.payer?.first_name} {transaction.payer?.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recipient</p>
                      <p className="font-medium dark:text-high-contrast">
                        {transaction.recipient?.first_name} {transaction.recipient?.last_name}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between border-t dark:border-gray-700 pt-6 gap-4">
          <Button 
            variant="outline" 
            className="text-sm dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 w-full sm:w-auto"
            onClick={() => router.push('/jetshare/dashboard')}
          >
            Back to Dashboard
          </Button>
          
          {transaction.payment_status === 'completed' && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                className="text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                disabled={isDownloading}
                onClick={() => downloadReceipt(transaction.id)}
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </>
                )}
              </Button>
              
              <BoardingPassButton 
                transactionId={transaction.id}
                offerId={offer.id}
                isTestMode={isTestMode}
              />
            </div>
          )}
          
          {transaction.payment_status === 'pending' && transaction.payment_method === 'fiat' && (
            <Button 
              className="text-sm bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto"
              onClick={() => router.push(`/jetshare/payment/${offer.id}`)}
            >
              Complete Payment
            </Button>
          )}
          
          {transaction.payment_method === 'crypto' && transaction.payment_status === 'pending' && (
            <Button 
              className="text-sm w-full sm:w-auto"
              variant="outline"
              onClick={() => window.open('https://commerce.coinbase.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Coinbase
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {transactions.length > 1 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4 dark:text-high-contrast">Transaction History</h2>
          {transactions.slice(1).map(tx => (
            <Card key={tx.id} className="mb-4 jetstream-card dark:border-gray-700">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium dark:text-high-contrast">{format(new Date(tx.transaction_date), 'MMM d, yyyy')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tx.transaction_reference || tx.id}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 text-sm font-medium dark:text-high-contrast">{formatCurrency(tx.amount)}</span>
                    {getPaymentStatusBadge(tx.payment_status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 
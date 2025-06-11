'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { JetShareOfferWithUser, JetShareTransactionWithDetails } from '@/types/jetshare';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Plane, Download, ExternalLink, RefreshCw, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import BoardingPassButton from './BoardingPassButton';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

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
  
  // Get theme helpers
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses, getThemedBadgeClasses } = useGdyupTheme();
  
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
          <Badge variant="outline" className={cn(
            "payment-status-pending",
            getThemedBadgeClasses('warning')
          )}>
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className={cn(
            "payment-status-paid",
            getThemedBadgeClasses('success')
          )}>
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className={cn(
            "payment-status-unpaid",
            getThemedBadgeClasses('warning')
          )}>
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline" className="border-gdyup-border">{status}</Badge>;
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
      <Card className={cn(
        "gdyup-card",
        getThemedBackgroundClasses('card')
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center mb-2">
            <AlertCircle className={cn("h-5 w-5 mr-2", getThemedTextClasses('primary'))} />
            <h2 className={cn("text-lg font-medium", getThemedTextClasses())}>Transaction Details Processing</h2>
            <div className={cn("ml-auto text-xs font-mono", getThemedTextClasses('muted'))}>
              Flight #{offer.id?.toString().substring(0, 6)}
            </div>
          </div>
          <p className={cn("mb-3", getThemedTextClasses('secondary'))}>Your payment has been received, but transaction details are still being processed.</p>
          
          {isTestMode && (
            <div className={cn(
              "p-3 rounded-md text-sm mb-3",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border"
            )}>
              <p className={cn("font-medium", getThemedTextClasses())}>Test Mode Active</p>
              <p className={getThemedTextClasses('secondary')}>Transaction details are simulated and may not show complete information.</p>
            </div>
          )}
          
          <div className={cn(
            "p-4 rounded-md",
            getThemedBackgroundClasses('card'),
            "border-gdyup-border"
          )}>
            <h3 className={cn("font-medium mb-2", getThemedTextClasses())}>Offer Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className={getThemedTextClasses('muted')}>From</p>
                <p className={cn("font-medium", getThemedTextClasses())}>
                  {offer.departure_location}
                </p>
              </div>
              <div>
                <p className={getThemedTextClasses('muted')}>To</p>
                <p className={cn("font-medium", getThemedTextClasses())}>
                  {offer.arrival_location}
                </p>
              </div>
              <div>
                <p className={getThemedTextClasses('muted')}>Flight Date</p>
                <p className={cn("font-medium", getThemedTextClasses())}>
                  {format(new Date(offer.flight_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className={getThemedTextClasses('muted')}>Status</p>
                <p className={cn("font-medium capitalize", getThemedTextClasses())}>
                  {offer.status}
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            className={cn(
              "mt-4",
              getThemedButtonClasses('primary')
            )}
            onClick={() => router.push('/gdyup/dashboard')}
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
        <h1 className={cn("text-2xl font-bold", getThemedTextClasses())}>Transaction Details</h1>
      </div>
      
      <Card className={cn(
        "mb-6 gdyup-card",
        getThemedBackgroundClasses('card')
      )}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className={cn("text-xl", getThemedTextClasses())}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Plane className={cn("h-5 w-5 mr-2 rotate-90", getThemedTextClasses())} />
                    {offer?.departure_location} → {offer?.arrival_location}
                  </div>
                  <div className={cn("text-xs font-mono", getThemedTextClasses('muted'))}>
                    Flight #{offer?.id?.toString().substring(0, 6)}
                  </div>
                </div>
              </CardTitle>
              <CardDescription className={cn("mt-1", getThemedTextClasses('secondary'))}>
                {offer ? format(new Date(offer.flight_date), 'EEEE, MMMM d, yyyy') : ''}
              </CardDescription>
            </div>
            {getPaymentStatusBadge(transaction.payment_status)}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-5">
            <div>
              <h3 className={cn("text-sm font-medium mb-2", getThemedTextClasses('secondary'))}>PAYMENT DETAILS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={cn("text-sm", getThemedTextClasses('muted'))}>Amount</p>
                  <p className={cn("font-medium", getThemedTextClasses())}>
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <div>
                  <p className={cn("text-sm", getThemedTextClasses('muted'))}>Handling Fee</p>
                  <p className={cn("font-medium", getThemedTextClasses())}>
                    {formatCurrency(transaction.handling_fee || 0)}
                  </p>
                </div>
                <div>
                  <p className={cn("text-sm", getThemedTextClasses('muted'))}>Payment Method</p>
                  <p className={cn("font-medium capitalize", getThemedTextClasses())}>
                    {transaction.payment_method}
                  </p>
                </div>
                <div>
                  <p className={cn("text-sm", getThemedTextClasses('muted'))}>Transaction Date</p>
                  <p className={cn("font-medium", getThemedTextClasses())}>
                    {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            
            <Separator className="bg-gdyup-border" />
            
            <div>
              <h3 className={cn(
                "text-sm font-medium mb-2 flex justify-between items-center",
                getThemedTextClasses('secondary')
              )}>
                <span>TRANSACTION DETAILS</span>
                <span className={cn("text-xs font-mono", getThemedTextClasses('muted'))}>
                  Txn #{transaction.id?.toString().substring(0, 6)}
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={cn("text-sm", getThemedTextClasses('muted'))}>Transaction ID</p>
                  <p className={cn("font-medium text-sm font-mono", getThemedTextClasses())}>
                    {transaction.id}
                  </p>
                </div>
                <div>
                  <p className={cn("text-sm", getThemedTextClasses('muted'))}>Payment Reference</p>
                  <p className={cn("font-medium text-sm font-mono truncate", getThemedTextClasses())}>
                    {transaction.transaction_reference || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            {transaction.payment_status === 'completed' && (
              <>
                <Separator className="bg-gdyup-border" />
                
                <div>
                  <h3 className={cn("text-sm font-medium mb-2", getThemedTextClasses('secondary'))}>USERS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={cn("text-sm", getThemedTextClasses('muted'))}>Payer</p>
                      <p className={cn("font-medium", getThemedTextClasses())}>
                        {transaction.payer?.first_name} {transaction.payer?.last_name}
                      </p>
                    </div>
                    <div>
                      <p className={cn("text-sm", getThemedTextClasses('muted'))}>Recipient</p>
                      <p className={cn("font-medium", getThemedTextClasses())}>
                        {transaction.recipient?.first_name} {transaction.recipient?.last_name}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between border-t border-gdyup-border pt-6 gap-4">
          <Button 
            variant="outline" 
            className={cn(
              "text-sm border-gdyup-border",
              getThemedTextClasses(),
              "hover:bg-gdyup-bg-card w-full sm:w-auto"
            )}
            onClick={() => router.push('/gdyup/dashboard')}
          >
            Back to Dashboard
          </Button>
          
          {transaction.payment_status === 'completed' && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                className={cn(
                  "text-sm",
                  getThemedButtonClasses('primary')
                )}
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
              className={cn(
                "text-sm w-full sm:w-auto",
                getThemedButtonClasses('primary')
              )}
              onClick={() => router.push(`/gdyup/payment/${offer.id}`)}
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
          <h2 className={cn("text-lg font-medium mb-4", getThemedTextClasses())}>Transaction History</h2>
          {transactions.slice(1).map(tx => (
            <Card key={tx.id} className={cn(
              "mb-4 gdyup-card",
              getThemedBackgroundClasses('card')
            )}>
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={cn("font-medium", getThemedTextClasses())}>
                      {format(new Date(tx.transaction_date), 'MMM d, yyyy')}
                    </p>
                    <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                      {tx.transaction_reference || tx.id}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={cn("mr-3 text-sm font-medium", getThemedTextClasses())}>
                      {formatCurrency(tx.amount)}
                    </span>
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
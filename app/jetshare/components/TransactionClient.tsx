'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { JetShareOfferWithUser, JetShareTransactionWithDetails } from '@/types/jetshare';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Plane, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionClientProps {
  offer: JetShareOfferWithUser;
  transactions: JetShareTransactionWithDetails[];
  user: User;
  isOriginalOfferer: boolean;
}

export default function TransactionClient({ 
  offer, 
  transactions, 
  user,
  isOriginalOfferer 
}: TransactionClientProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const transaction = transactions.length > 0 ? transactions[0] : null;

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const downloadReceipt = async (transactionId: string) => {
    setIsDownloading(true);
    
    try {
      // Generate the receipt
      const response = await fetch(`/api/jetshare/generateReceipt?transactionId=${transactionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate receipt');
      }
      
      // Download the generated receipt
      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      console.error('Error downloading receipt:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to download receipt';
      toast.error(errorMsg);
    } finally {
      setIsDownloading(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Transaction Details</h1>
      </div>
      
      {!transaction ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-amber-700 mb-2">
              <AlertCircle className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-medium">No Transaction Found</h2>
            </div>
            <p className="text-amber-600">There are no transactions associated with this flight yet.</p>
            {offer && offer.status === 'accepted' && (
              <Button 
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-white" 
                onClick={() => router.push(`/jetshare/payment/${offer.id}`)}
              >
                Complete Payment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    <div className="flex items-center">
                      <Plane className="h-5 w-5 mr-2 rotate-90" />
                      {offer?.departure_location} → {offer?.arrival_location}
                    </div>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {offer ? format(new Date(offer.flight_date), 'EEEE, MMMM d, yyyy') : ''}
                  </CardDescription>
                </div>
                {getPaymentStatusBadge(transaction.payment_status)}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">PAYMENT DETAILS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Handling Fee</p>
                      <p className="font-medium">{formatCurrency(transaction.handling_fee || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium capitalize">{transaction.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transaction Date</p>
                      <p className="font-medium">{format(new Date(transaction.transaction_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">TRANSACTION DETAILS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="font-medium text-sm font-mono">{transaction.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Reference</p>
                      <p className="font-medium text-sm font-mono truncate">{transaction.transaction_reference || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {transaction.payment_status === 'completed' && (
                  <>
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">USERS</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Payer</p>
                          <p className="font-medium">
                            {transaction.payer?.first_name} {transaction.payer?.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Recipient</p>
                          <p className="font-medium">
                            {transaction.recipient?.first_name} {transaction.recipient?.last_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-6">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => router.push('/jetshare/dashboard')}
              >
                Back to Dashboard
              </Button>
              
              {transaction.payment_status === 'completed' && (
                <Button 
                  className="text-sm"
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
              )}
              
              {transaction.payment_status === 'pending' && transaction.payment_method === 'fiat' && (
                <Button 
                  className="text-sm bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => router.push(`/jetshare/payment/${offer.id}`)}
                >
                  Complete Payment
                </Button>
              )}
              
              {transaction.payment_method === 'crypto' && transaction.payment_status === 'pending' && (
                <Button 
                  className="text-sm"
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
              <h2 className="text-lg font-medium mb-4">Transaction History</h2>
              {transactions.slice(1).map(tx => (
                <Card key={tx.id} className="mb-4">
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{format(new Date(tx.transaction_date), 'MMM d, yyyy')}</p>
                        <p className="text-sm text-gray-500">{tx.transaction_reference || tx.id}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-3 text-sm font-medium">{formatCurrency(tx.amount)}</span>
                        {getPaymentStatusBadge(tx.payment_status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 
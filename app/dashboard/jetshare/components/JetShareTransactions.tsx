'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plane, Calendar, DollarSign, Receipt, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { JetShareTransactionWithDetails } from '@/types/jetshare';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SkeletonTransaction = () => (
  <div className="flex flex-col space-y-3 p-4 border rounded-lg">
    <div className="flex justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-24" />
    </div>
    <Skeleton className="h-4 w-full" />
    <div className="flex justify-between">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

export default function JetShareTransactions() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<JetShareTransactionWithDetails[]>([]);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/jetshare/getTransactions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load your transaction history');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch the transactions
    fetchTransactions();
  }, []);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'fiat':
        return 'Credit Card';
      case 'crypto':
        return 'Cryptocurrency';
      default:
        return method;
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <SkeletonTransaction key={index} />
        ))}
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-6">
          <DollarSign className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold mb-3">No Transactions Yet</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          You haven't made any JetShare transactions yet. Browse available flight shares to get started.
        </p>
        <Button asChild>
          <Link href="/jetshare/listings">Browse Flight Shares</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Your Transaction History</h2>
      
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {transaction.payer_user_id === 'user-1' ? 'Payment Sent' : 'Payment Received'}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(transaction.transaction_date), 'MMM d, yyyy')} at {format(new Date(transaction.transaction_date), 'h:mm a')}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-semibold ${transaction.payer_user_id === 'user-1' ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.payer_user_id === 'user-1' ? '-' : '+'}${transaction.amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getPaymentMethodLabel(transaction.payment_method)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Plane className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    Flight from {transaction.offer.departure_location} to {transaction.offer.arrival_location}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(transaction.offer.flight_date), 'EEE, MMM d, yyyy')} at {format(new Date(transaction.offer.flight_date), 'h:mm a')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      {transaction.payer_user_id === 'user-1' ? 
                        `Paid to ${transaction.recipient.first_name} ${transaction.recipient.last_name?.[0] || ''}` : 
                        `Received from ${transaction.payer.first_name} ${transaction.payer.last_name?.[0] || ''}`}
                    </span>
                  </div>
                  {getStatusBadge(transaction.payment_status)}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                <span>Fee: ${transaction.handling_fee.toLocaleString()}</span>
                <span className="mx-2">•</span>
                <span>Ref: {transaction.transaction_reference ? transaction.transaction_reference.substring(0, 8) + '...' : 'N/A'}</span>
              </div>
              
              <Button variant="ghost" size="sm" asChild>
                <Link href={transaction.receipt_url || '#'}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Receipt
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 
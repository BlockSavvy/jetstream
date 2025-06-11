import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoadingPayment() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="border-gdyup-border bg-gdyup-bg-card">
        <CardHeader>
          <CardTitle className="text-center text-gdyup-text">Loading Payment Details...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-gdyup-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
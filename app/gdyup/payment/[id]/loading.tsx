import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function LoadingPayment() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Loading Payment Details...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
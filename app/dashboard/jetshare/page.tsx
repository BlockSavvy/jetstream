import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Metadata } from 'next';
import JetShareOffers from './components/JetShareOffers';
import JetShareBookings from './components/JetShareBookings';
import JetShareTransactions from './components/JetShareTransactions';
import JetShareStats from './components/JetShareStats';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'My JetShares | Dashboard',
  description: 'Manage your flight shares, bookings, and transaction history.',
};

export default function DashboardJetSharePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My JetShares</h1>
        <p className="text-muted-foreground">
          Manage your flight shares, bookings, and transaction history.
        </p>
      </div>
      
      <JetShareStats />
      
      <Separator />
      
      <Tabs defaultValue="offers" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="offers">My Offers</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="offers" className="space-y-4 pt-4">
          <JetShareOffers />
        </TabsContent>
        
        <TabsContent value="bookings" className="space-y-4 pt-4">
          <JetShareBookings />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4 pt-4">
          <JetShareTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { Plane, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface JetShareStatsData {
  offerCount: number;
  acceptedCount: number;
  completedCount: number;
  totalSaved: number;
}

const StatCard = ({ isLoading, title, value, icon }: {
  isLoading: boolean;
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-7 w-1/2" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

export default function JetShareStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<JetShareStatsData>({
    offerCount: 0,
    acceptedCount: 0,
    completedCount: 0,
    totalSaved: 0,
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/jetshare/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch JetShare statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching JetShare statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch the statistics
    fetchStats();
  }, []);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        isLoading={isLoading}
        title="Active Offers"
        value={stats.offerCount}
        icon={<Plane className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        isLoading={isLoading}
        title="In Progress"
        value={stats.acceptedCount}
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        isLoading={isLoading}
        title="Completed"
        value={stats.completedCount}
        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        isLoading={isLoading}
        title="Total Cost Saved"
        value={`$${stats.totalSaved.toLocaleString()}`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
} 
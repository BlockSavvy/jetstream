'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { 
  Plane, 
  Calendar, 
  DollarSign, 
  Search, 
  Loader2, 
  Info,
  Filter,
  X,
  Badge,
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  CreditCard,
  Bitcoin,
  RefreshCw,
  LoaderCircle,
  MoveUp,
  MoveDown,
  MapPin,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { JetShareOfferWithUser, JetShareOfferStatus } from '@/types/jetshare';
import { Badge as UIBadge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@supabase/supabase-js';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Update the JetShareOfferWithUser type to include the isOwnOffer flag
interface EnhancedJetShareOfferWithUser extends JetShareOfferWithUser {
  isOwnOffer?: boolean;
}

// Type for user profile with verification status
interface UserWithVerification {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  verification_status?: string;
}

interface JetShareListingsContentProps {
  user: User | null;
}

// Placeholder component for empty state
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-6">
      <Plane className="h-8 w-8 text-amber-500" />
    </div>
    <h3 className="text-xl font-bold mb-3">No Flight Shares Available</h3>
    <p className="text-muted-foreground max-w-md mb-6">
      There are no flight shares available that match your criteria. Try adjusting your filters or check back later.
    </p>
    <Button variant="outline" onClick={() => window.location.reload()}>
      Refresh Listings
    </Button>
  </div>
);

// Skeleton loader for cards
const SkeletonCard = () => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full rounded-md" />
    </CardFooter>
  </Card>
);

export default function JetShareListingsContent({ user }: JetShareListingsContentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [offers, setOffers] = useState<EnhancedJetShareOfferWithUser[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<EnhancedJetShareOfferWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<EnhancedJetShareOfferWithUser | null>(null);
  const [sortOption, setSortOption] = useState('date-asc');
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [departureFilter, setDepartureFilter] = useState('');
  const [arrivalFilter, setArrivalFilter] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const supabase = createClient();
  
  // Add a new effect to check for offer status changes when the component gains focus
  useEffect(() => {
    // Function to check if page visibility changes (user returns to the tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing offers');
        fetchOffers();
      }
    };

    // Function to handle when user navigates back to this page
    const handleFocus = () => {
      console.log('Window regained focus, refreshing offers');
      fetchOffers();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Clean up event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Modify fetchOffers to add a cache-busting parameter and improve error handling
  const fetchOffers = async () => {
    console.log('Starting to fetch offers...');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching from API...');
      // Add a timestamp parameter to avoid caching issues
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 10);
      const response = await fetch(`/api/jetshare/getOffers?status=open&viewMode=marketplace&t=${timestamp}&rid=${randomId}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        
        // Display a friendly message regardless of error type
        setError('Unable to load flight share offers. Please try again later.');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      // Handle no offers case
      if (!data.offers || !Array.isArray(data.offers) || data.offers.length === 0) {
        console.log('No offers found in API response, showing empty state');
        setOffers([]);
        setFilteredOffers([]);
        setError('No flight shares available at the moment. Try checking back later or create your own offer.');
        setIsLoading(false);
        return;
      }
      
      // Mark offers by the current user if user is authenticated
      // Also filter out any non-open offers that might have been returned
      const processedOffers = data.offers
        .filter((offer: EnhancedJetShareOfferWithUser) => offer.status === 'open')
        .map((offer: EnhancedJetShareOfferWithUser) => {
          if (user && (offer.user_id === user.id || offer.isOwnOffer)) {
            return { ...offer, isOwnOffer: true };
          }
          return { ...offer, isOwnOffer: false };
        });
      
      console.log('Processed offers:', processedOffers.length);
      setOffers(processedOffers);
      setFilteredOffers(processedOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setError('Failed to load flight share offers. Please try again later.');
      // Set empty arrays to prevent undefined errors in the UI
      setOffers([]);
      setFilteredOffers([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch offers on mount and at intervals
  useEffect(() => {
    // Execute fetch on component mount
    fetchOffers();
    
    // Set up a refresh interval to occasionally reload the offers
    const interval = setInterval(() => {
      fetchOffers();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [user, router]);
  
  // Filter and sort offers
  useEffect(() => {
    console.log('Filter/sort effect running, offers length:', offers.length);
    let result = [...offers];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(offer => 
        offer.departure_location.toLowerCase().includes(term) ||
        offer.arrival_location.toLowerCase().includes(term)
      );
    }
    
    // Apply departure filter
    if (departureFilter) {
      result = result.filter(offer => 
        offer.departure_location.toLowerCase().includes(departureFilter.toLowerCase())
      );
    }
    
    // Apply arrival filter
    if (arrivalFilter) {
      result = result.filter(offer => 
        offer.arrival_location.toLowerCase().includes(arrivalFilter.toLowerCase())
      );
    }
    
    // Apply price filters
    if (minPriceFilter) {
      const minPrice = parseFloat(minPriceFilter);
      if (!isNaN(minPrice)) {
        result = result.filter(offer => offer.requested_share_amount >= minPrice);
      }
    }
    
    if (maxPriceFilter) {
      const maxPrice = parseFloat(maxPriceFilter);
      if (!isNaN(maxPrice)) {
        result = result.filter(offer => offer.requested_share_amount <= maxPrice);
      }
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.flight_date).getTime() - new Date(b.flight_date).getTime());
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.flight_date).getTime() - new Date(a.flight_date).getTime());
        break;
      case 'price-asc':
        result.sort((a, b) => a.requested_share_amount - b.requested_share_amount);
        break;
      case 'price-desc':
        result.sort((a, b) => b.requested_share_amount - a.requested_share_amount);
        break;
    }
    
    console.log('Setting filtered offers:', result.length);
    setFilteredOffers(result);
  }, [offers, searchTerm, sortOption, departureFilter, arrivalFilter, minPriceFilter, maxPriceFilter]);
  
  const handleOfferAccept = async (offer: EnhancedJetShareOfferWithUser) => {
    // Early validation
    if (!user) {
      toast.error('Please sign in to accept this offer');
      router.push(`/auth/signin?redirect=/jetshare/listings`);
      return;
    }
    
    if (offer.isOwnOffer) {
      toast.error('You cannot accept your own offer');
      return;
    }
    
    // Set the selected offer for the confirmation modal
    setSelectedOffer(offer);
    setShowConfirmDialog(true);
  };
  
  const confirmOfferAccept = async () => {
    if (!selectedOffer || !user) return;
    
    // Close the confirmation dialog
    setShowConfirmDialog(false);
    
    // Set accepting state to show loading UI
    setIsAccepting(true);
    
    try {
      console.log('Accepting offer:', selectedOffer.id);
      
      // Step 1: Call acceptOffer API to mark the offer as accepted
      const acceptResponse = await fetch('/api/jetshare/acceptOffer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        credentials: 'include',
        body: JSON.stringify({
          offer_id: selectedOffer.id,
          payment_method: 'fiat' // Default to fiat, will be changed in payment page if needed
        }),
      });
      
      if (!acceptResponse.ok) {
        const errorData = await acceptResponse.json();
        
        // Check if error is due to offer already being accepted by another user
        if (acceptResponse.status === 409 || 
            errorData.message?.includes('already') || 
            errorData.message?.includes('unavailable')) {
          console.error('Offer unavailable error:', errorData);
          toast.error('This offer is no longer available. It may have been accepted by another user.');
          
          // Refresh listings to remove this offer
          await fetchOffers();
          setIsAccepting(false);
          return;
        }
        
        // For other errors
        console.error('Error accepting offer:', errorData);
        throw new Error(errorData.message || 'Failed to accept the offer');
      }
      
      // Step 2: If successful, show a success message and redirect to payment page
      const acceptData = await acceptResponse.json();
      console.log('Offer accepted successfully:', acceptData);
      
      // Show success toast
      toast.success('Offer accepted successfully! Redirecting to payment...');
      
      // Remove this offer from the listings in the UI immediately
      setOffers(prev => prev.filter(o => o.id !== selectedOffer.id));
      setFilteredOffers(prev => prev.filter(o => o.id !== selectedOffer.id));
      
      // Redirect to payment page after a short delay (to allow seeing the toast)
      setTimeout(() => {
        router.push(`/jetshare/payment/${selectedOffer.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error in confirmOfferAccept:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept the offer. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };
  
  // Handle seed data for development
  const handleSeedData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jetshare/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to seed data');
      }
      
      // Refetch offers after seeding
      const offersResponse = await fetch('/api/jetshare/getOffers?status=open&viewMode=marketplace');
      
      if (!offersResponse.ok) {
        throw new Error('Failed to refresh offers');
      }
      
      const data = await offersResponse.json();
      setOffers(data.offers);
      setFilteredOffers(data.offers);
      toast.success('Sample data added successfully!');
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to add sample data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setDepartureFilter('');
    setArrivalFilter('');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setSearchTerm('');
  };
  
  // Render flight share cards
  const renderOfferCard = (offer: EnhancedJetShareOfferWithUser) => (
    <Card key={offer.id} className="overflow-hidden">
      <div className="relative">
        {offer.isOwnOffer && (
          <div className="absolute top-0 right-0 m-2 z-10">
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
              Your Offer
            </Badge>
          </div>
        )}
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{offer.departure_location} to {offer.arrival_location}</CardTitle>
              <CardDescription>
                <div className="flex items-center mt-1">
                  <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" />
                  <span>{new Date(offer.flight_date).toLocaleDateString()}</span>
                </div>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">${offer.requested_share_amount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {((offer.requested_share_amount / offer.total_flight_cost) * 100).toFixed(0)}% of ${offer.total_flight_cost.toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {offer.user?.first_name?.[0] || 'U'}
                {offer.user?.last_name?.[0] || 'U'}
              </AvatarFallback>
              {offer.user?.avatar_url && (
                <AvatarImage src={offer.user.avatar_url} alt={`${offer.user.first_name} ${offer.user.last_name}`} />
              )}
            </Avatar>
            <span className="text-sm">
              {offer.user?.first_name} {offer.user?.last_name?.[0] || ''}
              {(offer.user as UserWithVerification)?.verification_status === 'verified' && (
                <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
              )}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            variant={offer.isOwnOffer ? "outline" : "default"}
            onClick={() => setSelectedOffer(offer)}
            disabled={offer.isOwnOffer}
          >
            {offer.isOwnOffer ? "Your Own Offer" : "View Details"}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
  
  return (
    <div>
      {/* Debug state */}
      {/* {console.log('Rendering JetShareListingsContent, isLoading:', isLoading, 'filteredOffers:', filteredOffers.length)} */}
      {/* Search and filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by departure or arrival location..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-asc">Date (Earliest)</SelectItem>
                <SelectItem value="date-desc">Date (Latest)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              </SelectContent>
            </Select>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Options</SheetTitle>
                  <SheetDescription>
                    Narrow down flight shares based on your preferences.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-4 py-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Departure Location</label>
                    <Input
                      placeholder="E.g. New York"
                      value={departureFilter}
                      onChange={(e) => setDepartureFilter(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Arrival Location</label>
                    <Input
                      placeholder="E.g. Miami"
                      value={arrivalFilter}
                      onChange={(e) => setArrivalFilter(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Min"
                        type="number"
                        value={minPriceFilter}
                        onChange={(e) => setMinPriceFilter(e.target.value)}
                      />
                      <span>to</span>
                      <Input
                        placeholder="Max"
                        type="number"
                        value={maxPriceFilter}
                        onChange={(e) => setMaxPriceFilter(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <SheetFooter>
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                  <SheetClose asChild>
                    <Button>Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Active filters display */}
        {(departureFilter || arrivalFilter || minPriceFilter || maxPriceFilter) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {departureFilter && (
              <UIBadge variant="secondary" className="flex items-center gap-1">
                From: {departureFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setDepartureFilter('')}
                />
              </UIBadge>
            )}
            
            {arrivalFilter && (
              <UIBadge variant="secondary" className="flex items-center gap-1">
                To: {arrivalFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setArrivalFilter('')}
                />
              </UIBadge>
            )}
            
            {(minPriceFilter || maxPriceFilter) && (
              <UIBadge variant="secondary" className="flex items-center gap-1">
                Price: {minPriceFilter ? `$${minPriceFilter}` : '$0'} - {maxPriceFilter ? `$${maxPriceFilter}` : 'Any'}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setMinPriceFilter('');
                    setMaxPriceFilter('');
                  }}
                />
              </UIBadge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={clearFilters}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-semibold mb-2 md:mb-0">
            Available Flight Shares
            {!isLoading && filteredOffers.length > 0 && (
              <Badge className="ml-2 text-xs">
                {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'}
              </Badge>
            )}
          </h2>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/jetshare/offer')}>
              Create Offer
            </Button>
            <Button variant="outline" size="icon" onClick={handleSeedData} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* We have {filteredOffers.length} offers to display */}
            {filteredOffers.map((offer, index) => (
              <Fragment key={offer.id || index}>
                {renderOfferCard(offer)}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState />
            {error && (
              <p className="text-center text-red-500 mt-2">{error}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Payment confirmation dialog */}
      {selectedOffer && showConfirmDialog && (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Flight Share</DialogTitle>
              <DialogDescription>
                You are about to book a shared flight from {selectedOffer.departure_location} to {selectedOffer.arrival_location} for ${selectedOffer.requested_share_amount.toLocaleString()}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col space-y-2">
                <h3 className="font-medium">Payment Method</h3>
                <div className="flex space-x-2">
                  <Button 
                    className="w-full" 
                    onClick={() => confirmOfferAccept()}
                    disabled={isAccepting}
                  >
                    {isAccepting ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Pay with Card
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setSelectedOffer(null)}
                    disabled={isAccepting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="flex space-x-2 sm:justify-end">
              <Button variant="outline" onClick={() => {
                setShowConfirmDialog(false);
                setSelectedOffer(null);
                setIsAccepting(false);
              }}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Offer details dialog */}
      <Dialog open={selectedOffer !== null} onOpenChange={(open) => !open && setSelectedOffer(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedOffer && (
            <>
              <DialogHeader>
                <DialogTitle>Flight Share Details</DialogTitle>
                <DialogDescription>
                  Review the details of this flight share offer.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-3">
                <div className="flex justify-between items-center border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedOffer.departure_location}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 mx-2" />
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground rotate-90" />
                    <span className="font-medium">{selectedOffer.arrival_location}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedOffer.flight_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Requested Share</p>
                    <p className="font-medium">${selectedOffer.requested_share_amount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Flight Cost</p>
                    <p className="font-medium">${selectedOffer.total_flight_cost.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Share Percentage</p>
                    <p className="font-medium">
                      {((selectedOffer.requested_share_amount / selectedOffer.total_flight_cost) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Offered by</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar>
                      <AvatarFallback>
                        {selectedOffer.user?.first_name?.[0] || 'U'}
                        {selectedOffer.user?.last_name?.[0] || 'U'}
                      </AvatarFallback>
                      {selectedOffer.user?.avatar_url && (
                        <AvatarImage 
                          src={selectedOffer.user.avatar_url} 
                          alt={`${selectedOffer.user.first_name} ${selectedOffer.user.last_name}`} 
                        />
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedOffer.user?.first_name} {selectedOffer.user?.last_name}
                        {(selectedOffer.user as UserWithVerification)?.verification_status === 'verified' && (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 inline ml-1" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This flight share is offered by a verified JetShare user. The requested share amount is
                        {' '}{((selectedOffer.requested_share_amount / selectedOffer.total_flight_cost) * 100).toFixed(0)}%
                        {' '}of the total flight cost.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {!selectedOffer.isOwnOffer ? (
                <DialogFooter className="sm:justify-start">
                  <div className="w-full space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => confirmOfferAccept()}
                      disabled={isAccepting}
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Accept & Pay with Card
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              ) : (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedOffer(null)}>
                    Close
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
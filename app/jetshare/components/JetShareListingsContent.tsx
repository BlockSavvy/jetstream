'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  BadgeCheck
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
import { JetShareOfferWithUser } from '@/types/jetshare';
import { Badge as UIBadge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function JetShareListingsContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [offers, setOffers] = useState<JetShareOfferWithUser[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<JetShareOfferWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<JetShareOfferWithUser | null>(null);
  const [sortOption, setSortOption] = useState('date-asc');
  
  // Filter states
  const [departureFilter, setDepartureFilter] = useState('');
  const [arrivalFilter, setArrivalFilter] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  
  // Fetch offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch('/api/jetshare/getOffers?status=open');
        
        if (!response.ok) {
          throw new Error('Failed to fetch offers');
        }
        
        const data = await response.json();
        setOffers(data.offers);
        setFilteredOffers(data.offers);
      } catch (error) {
        console.error('Error fetching offers:', error);
        toast.error('Failed to load flight share offers');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOffers();
  }, []);
  
  // Filter and sort offers
  useEffect(() => {
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
    
    setFilteredOffers(result);
  }, [offers, searchTerm, sortOption, departureFilter, arrivalFilter, minPriceFilter, maxPriceFilter]);
  
  // Handle accepting an offer
  const handleAcceptOffer = async (paymentMethod: 'fiat' | 'crypto') => {
    if (!selectedOffer) return;
    
    setIsAccepting(true);
    
    try {
      // First, accept the offer
      const acceptResponse = await fetch('/api/jetshare/acceptOffer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: selectedOffer.id,
          payment_method: paymentMethod,
        }),
      });
      
      if (!acceptResponse.ok) {
        const errorData = await acceptResponse.json();
        throw new Error(errorData.message || 'Failed to accept offer');
      }
      
      // Then, process the payment
      const paymentResponse = await fetch('/api/jetshare/processPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: selectedOffer.id,
          payment_method: paymentMethod,
          payment_details: {
            amount: selectedOffer.requested_share_amount,
          },
        }),
      });
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Failed to process payment');
      }
      
      const paymentData = await paymentResponse.json();
      
      toast.success('Flight share accepted successfully!');
      
      // Redirect based on payment method
      if (paymentMethod === 'fiat' && paymentData.clientSecret) {
        // For Stripe, redirect to the payment confirmation page
        router.push(`/dashboard/jetshare/payment/stripe?intent=${paymentData.paymentIntentId}`);
      } else if (paymentMethod === 'crypto' && paymentData.checkoutInfo?.checkoutUrl) {
        // For Coinbase, redirect to the Coinbase checkout
        window.location.href = paymentData.checkoutInfo.checkoutUrl;
      } else {
        // Default fallback
        router.push('/dashboard/jetshare');
      }
      
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept offer');
    } finally {
      setIsAccepting(false);
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
  
  return (
    <div>
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
      
      {/* Results count */}
      {!isLoading && (
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredOffers.length === 1
            ? '1 flight share found'
            : `${filteredOffers.length} flight shares found`}
        </div>
      )}
      
      {/* Listings grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {offer.departure_location} to {offer.arrival_location}
                  </CardTitle>
                </div>
                <CardDescription>
                  {format(new Date(offer.flight_date), 'EEE, MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(offer.flight_date), 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Plane className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      {offer.user?.first_name?.[0]}{offer.user?.last_name?.[0]} • Verified Owner
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      ${offer.requested_share_amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Math.round((offer.requested_share_amount / offer.total_flight_cost) * 100)}% of ${offer.total_flight_cost.toLocaleString()})
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setSelectedOffer(offer)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Flight Share Details</DialogTitle>
                      <DialogDescription>
                        Review the details of this flight share before accepting.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {selectedOffer && (
                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Flight Route</h4>
                          <p className="text-lg font-semibold">{selectedOffer.departure_location} to {selectedOffer.arrival_location}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Date & Time</h4>
                          <p>{format(new Date(selectedOffer.flight_date), 'EEEE, MMMM d, yyyy')}</p>
                          <p>{format(new Date(selectedOffer.flight_date), 'h:mm a')}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Flight Owner</h4>
                          <div className="flex items-center">
                            <span className="bg-amber-100 dark:bg-amber-700/30 text-amber-800 dark:text-amber-200 p-1 rounded-full mr-2 h-8 w-8 flex items-center justify-center font-medium">
                              {selectedOffer.user?.first_name?.[0]}{selectedOffer.user?.last_name?.[0]}
                            </span>
                            <span>Verified Owner</span>
                            <BadgeCheck className="h-4 w-4 text-amber-500 ml-1" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Cost Details</h4>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                            <div className="flex justify-between mb-1">
                              <span>Share Amount:</span>
                              <span className="font-medium">${selectedOffer.requested_share_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm text-muted-foreground">
                              <span>Original Flight Cost:</span>
                              <span>${selectedOffer.total_flight_cost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-sm text-muted-foreground">
                              <span>Your Portion:</span>
                              <span>{Math.round((selectedOffer.requested_share_amount / selectedOffer.total_flight_cost) * 100)}%</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>JetShare Fee (7.5%):</span>
                              <span>${(selectedOffer.requested_share_amount * 0.075).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Terms & Conditions</h4>
                          <p className="text-sm text-muted-foreground">
                            By accepting this offer, you agree to JetStream's terms and conditions for flight sharing. 
                            Payment is processed securely through our platform.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleAcceptOffer('fiat')}
                        disabled={isAccepting}
                        className="w-full sm:w-auto"
                      >
                        {isAccepting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Pay with Card</>
                        )}
                      </Button>
                      <Button 
                        onClick={() => handleAcceptOffer('crypto')}
                        disabled={isAccepting}
                        className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600"
                      >
                        {isAccepting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Accept & Book <ArrowRight className="ml-2 h-4 w-4" /></>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 
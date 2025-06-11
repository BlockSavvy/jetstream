'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { 
  Search, 
  X, 
  Star, 
  Plane, 
  User,
  Users,
  Globe,
  Check, 
  ChevronsUpDown
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../../../lib/use-local-storage';
import { toast } from 'sonner';

// Define Jet interface
interface Jet {
  id: string;
  manufacturer: string;
  model: string;
  tail_number?: string;
  capacity?: number | string;
  range_nm?: number | string;
  cruise_speed_kts?: number | string;
  image_url?: string;
  thumbnail_url?: string;
  description?: string;
  is_popular?: boolean;
  display_name?: string;
  year?: number | string;
  owner_id?: string;
  max_altitude?: number | string;
  cabin_width?: number | string;
  cabin_height?: number | string;
  cabin_length?: number | string;
  interior_image_url?: string;
  berths?: boolean;
  lavatory?: boolean;
  galley?: boolean;
  entertainment?: string;
  wifi?: boolean;
  interior_type?: string;
}

interface MobileJetSelectorProps {
  value: string;
  className?: string;
  onChangeValue: string; // Required event name to dispatch instead of using function callback
}

export default function MobileJetSelector({ value, className, onChangeValue }: MobileJetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedJet, setSelectedJet] = useState<Jet | null>(null);
  const [jets, setJets] = useState<Jet[]>([]);
  const [filteredJets, setFilteredJets] = useState<Jet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteJets, setFavoriteJets] = useLocalStorage<Jet[]>('favorite-jets', []);
  const [recentJets, setRecentJets] = useLocalStorage<Jet[]>('recent-jets', []);
  const [showOnlyMyJets, setShowOnlyMyJets] = useState(true);
  
  // Get user session to determine user's jets
  const { user } = useAuth();
  const userId = user ? user.id : null;
  
  // Get theme functionality
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses, getThemedBadgeClasses, isMobile } = useGdyupTheme();
  
  // Format the display name of a jet
  const formatJetDisplay = useCallback((jet: Jet): string => {
    return jet.display_name || `${jet.manufacturer} ${jet.model}${jet.tail_number ? ` (${jet.tail_number})` : ''}`;
  }, []);
  
  // Get a safe image URL for a jet
  const getSafeImageUrl = (jet: Jet): string => {
    if (jet.image_url) return jet.image_url;
    
    try {
      const manufacturer = jet.manufacturer?.toLowerCase();
      const model = jet.model?.replace(/\s+/g, '-').toLowerCase();
      return `/images/jets/${manufacturer}/${model}.jpg`;
    } catch {
      return '/images/jets/default-jet.jpg';
    }
  };
  
  // Fetch jets from API or use fallback data
  useEffect(() => {
    const fetchJets = async () => {
      setIsLoading(true);
      
      try {
        // Get the current user's ID for filtering
        const userId = user ? user.id : null;
        
        // Use the correct API endpoint for GDYUP with correct parameters
        let apiUrl = '/api/jetshare/getJets';
        
        // Add timestamp to prevent caching issues
        const timestamp = Date.now();
        apiUrl += `?t=${timestamp}`;
        
        console.log(`Fetching jets from: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.jets && Array.isArray(data.jets)) {
          console.log(`Successfully fetched ${data.jets.length} jets from database`);
          
          const jetsList = data.jets.map((jet: Jet) => ({
            ...jet,
            display_name: `${jet.manufacturer} ${jet.model}${jet.tail_number ? ` (${jet.tail_number})` : ''}`,
            image_url: jet.image_url || getSafeImageUrl(jet)
          }));
          
          setJets(jetsList);
          
          // Initially filter to only show user's jets if we have a userId
          if (userId && showOnlyMyJets) {
            const userJets = jetsList.filter((jet: Jet) => jet.owner_id === userId);
            console.log(`Found ${userJets.length} jets owned by current user`);
            setFilteredJets(userJets);
          } else {
            setFilteredJets(jetsList);
          }
        } else {
          console.error('Invalid API response format:', data);
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Error fetching jets:', error);
        // Instead of using fallback data, show an empty list and notify user
        setJets([]);
        setFilteredJets([]);
        toast?.error && toast.error('Failed to load jets. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJets();
  }, [user, showOnlyMyJets]);
  
  // Find currently selected jet when value changes
  useEffect(() => {
    if (value && jets.length > 0) {
      const jet = jets.find(j => 
        formatJetDisplay(j) === value || 
        `${j.manufacturer} ${j.model}` === value
      );
      
      if (jet) {
        setSelectedJet(jet);
      }
    }
  }, [value, jets, formatJetDisplay]);
  
  // Handle search input changes
  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
    
    if (searchValue.length >= 2) {
      const searchLower = searchValue.toLowerCase();
      
      const filtered = jets.filter(jet => {
        const displayName = formatJetDisplay(jet).toLowerCase();
        const manufacturerMatches = jet.manufacturer.toLowerCase().includes(searchLower);
        const modelMatches = jet.model.toLowerCase().includes(searchLower);
        const tailMatches = jet.tail_number?.toLowerCase().includes(searchLower);
        const displayNameMatches = displayName.includes(searchLower);
        
        // Check if user is filtering by only their jets
        const isOwnedByUser = !showOnlyMyJets || !userId || jet.owner_id === userId;
        
        return (manufacturerMatches || modelMatches || tailMatches || displayNameMatches) && isOwnedByUser;
      });
      
      setFilteredJets(filtered);
    } else {
      // Apply just the ownership filter if search is empty
      const filtered = jets.filter(jet => !showOnlyMyJets || !userId || jet.owner_id === userId);
      setFilteredJets(filtered);
    }
  };
  
  // Toggle "My Jets" filter
  const toggleMyJetsFilter = () => {
    setShowOnlyMyJets(prev => !prev);
    
    // Re-apply filters based on new setting
    if (search.length >= 2) {
      handleSearch(search);
    } else {
      // Just apply ownership filter
      const filtered = jets.filter(jet => showOnlyMyJets || !userId || jet.owner_id === userId);
      setFilteredJets(filtered);
    }
  };
  
  // Toggle a jet as favorite
  const toggleFavorite = (jet: Jet) => {
    const isFavorite = favoriteJets.some((fav: Jet) => fav.id === jet.id);
    
    if (isFavorite) {
      setFavoriteJets((prev: Jet[]) => prev.filter((fav: Jet) => fav.id !== jet.id));
    } else {
      setFavoriteJets((prev: Jet[]) => [...prev, jet]);
    }
  };
  
  // Add a jet to recent selections
  const addToRecent = (jet: Jet) => {
    const filtered = recentJets.filter((recent: Jet) => recent.id !== jet.id);
    setRecentJets([jet, ...filtered.slice(0, 9)]);
  };
  
  // Handle jet selection
  const handleSelect = (jet: Jet) => {
    const formattedValue = formatJetDisplay(jet);
    setSelectedJet(jet);
    setIsOpen(false);
    
    // Add to recents
    addToRecent(jet);
    
    // Prepare event details
    const eventDetails = {
      value: formattedValue,
      jetId: jet.id,
      manufacturer: jet.manufacturer,
      model: jet.model,
      seatCapacity: jet.capacity,
      range_nm: jet.range_nm,
      cruise_speed_kts: jet.cruise_speed_kts,
      year: jet.year,
      tail_number: jet.tail_number,
      image_url: jet.image_url || getSafeImageUrl(jet)
    };
    
    // Dispatch both events for backward compatibility
    const jetChangeEvent = new CustomEvent('jetchange', { detail: eventDetails });
    window.dispatchEvent(jetChangeEvent);
    
    // Dispatch the custom event with the same details
    const customEvent = new CustomEvent(onChangeValue, { detail: eventDetails });
    window.dispatchEvent(customEvent);
  };
  
  // Format capacity for display
  const formatCapacity = (capacity?: number | string): string => {
    if (capacity === undefined || capacity === null || capacity === 0 || capacity === '0') {
      return '?';
    }
    return String(capacity);
  };
  
  // Render a jet item in the list
  const renderJetItem = (jet: Jet, index: number, isFavorited: boolean = false) => {
    const isOwned = jet.owner_id === userId;
    
    return (
      <div
        key={`${jet.id}-${index}`}
        className={cn(
          "px-3 py-3 hover:bg-opacity-70 cursor-pointer flex items-center justify-between border-b last:border-b-0 group",
          "hover:bg-gdyup-bg-card/80",
          "border-gdyup-border"
        )}
        onClick={() => handleSelect(jet)}
      >
        <div className="flex items-center space-x-3">
          <div className="relative w-12 h-12 rounded overflow-hidden border flex-shrink-0">
            <div className={cn(
              "absolute inset-0",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border"
            )}>
              {jet.image_url ? (
                <img 
                  src={jet.image_url}
                  alt={formatJetDisplay(jet)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/placeholder-jet.jpg";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plane className={cn("h-5 w-5", getThemedTextClasses('primary'))} />
                </div>
              )}
            </div>
          </div>
          
          <div>
            <p className={cn("font-medium text-sm", getThemedTextClasses())}>
              {`${jet.manufacturer} ${jet.model}`}
            </p>
            
            {jet.tail_number && (
              <p className={cn("text-xs", getThemedTextClasses('muted'))}>
                Tail: {jet.tail_number}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Favorite button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(jet);
            }}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isFavorited 
                ? "bg-black/60 shadow-md ring-1" 
                : "bg-black/50 hover:bg-black/70",
              isFavorited ? getThemedTextClasses('primary') : getThemedTextClasses('muted'),
              isFavorited ? "ring-gdyup-primary/50" : ""
            )}
          >
            <Star className={cn(
              "h-4 w-4",
              isFavorited ? "fill-gdyup-primary stroke-gdyup-primary" : "fill-none stroke-current"
            )} 
            strokeWidth={isFavorited ? 1.5 : 2} />
          </button>
          
          {/* Show owned jet badge */}
          {isOwned && (
            <Badge className={cn(
              "text-xs font-semibold px-2 shadow-md border",
              getThemedBadgeClasses('outline'),
              getThemedTextClasses('primary'),
              "border-gdyup-primary bg-black"
            )}>
              My Jet
            </Badge>
          )}
          
          {/* Show capacity */}
          <span className={cn("text-xs", getThemedTextClasses('muted'))}>
            {formatCapacity(jet.capacity)} seats
          </span>
        </div>
      </div>
    );
  };
  
  return (
    <div className={cn("relative w-full", className)}>
      {/* Button to open the mobile sheet or show selected jet */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-full relative rounded-md border p-2 text-left shadow-sm flex items-center justify-between h-14",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border",
          "hover:bg-gdyup-bg-card",
          getThemedTextClasses()
        )}
      >
        {selectedJet ? (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className={cn(
              "w-10 h-10 rounded overflow-hidden flex-shrink-0",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border"
            )}>
              <img 
                alt={formatJetDisplay(selectedJet)}
                src={selectedJet.image_url || '/images/placeholder-jet.jpg'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholder-jet.jpg";
                }}
              />
            </div>
            <div className="flex flex-col truncate">
              <span className={cn("font-medium truncate", getThemedTextClasses())}>
                {`${selectedJet.manufacturer} ${selectedJet.model}`}
              </span>
              <span className={cn("text-xs", getThemedTextClasses('muted'))}>
                {formatCapacity(selectedJet.capacity)} seats • {selectedJet.range_nm} nm range
              </span>
            </div>
          </div>
        ) : (
          <span className={getThemedTextClasses('muted')}>Select aircraft model</span>
        )}
        
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        
        {selectedJet && (
          <div className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/4",
            getThemedBackgroundClasses('primary'),
            "text-gdyup-button-text"
          )}>
            Selected
          </div>
        )}
      </button>
      
      {/* Mobile full-screen sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className={cn(
          "h-[85vh] p-0 pt-6",
          "bg-gdyup-bg-dark",
          getThemedTextClasses(),
          "border-t border-gdyup-border"
        )}>
          <SheetHeader className="px-4 mb-2">
            <SheetTitle className={cn(
              "text-lg font-bold",
              getThemedTextClasses()
            )}>
              Select Aircraft
            </SheetTitle>
          </SheetHeader>
          
          <div className="px-4 pb-2">
            <div className={cn(
              "flex items-center rounded-full overflow-hidden border",
              "bg-gdyup-bg-dark border-gdyup-border",
              getThemedTextClasses()
            )}>
              <Search className={cn("h-4 w-4 ml-3 mr-2", getThemedTextClasses('muted'))} />
              <Input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search aircraft model, manufacturer, or tail #"
                className={cn(
                  "border-0 bg-transparent h-12 pl-0 focus-visible:ring-0 focus-visible:ring-offset-0", 
                  getThemedTextClasses()
                )}
                autoFocus
              />
              {search && (
                <button 
                  type="button" 
                  onClick={() => {
                    setSearch('');
                    handleSearch('');
                  }}
                  className="h-7 w-7 mr-3 rounded-full bg-gdyup-bg-dark/40 flex items-center justify-center hover:bg-gdyup-bg-card/60 transition-colors border border-gdyup-border/30"
                >
                  <X className={cn("h-4 w-4", getThemedTextClasses('muted'))} style={{ strokeWidth: 2 }} />
                </button>
              )}
            </div>
          </div>
          
          <div className={cn(
            "flex px-4 border-b py-2 overflow-x-auto space-x-2 scrollbar-thin",
            "border-gdyup-border"
          )}>
            {/* My Jets filter */}
            <Button
              size="sm"
              variant={showOnlyMyJets ? "default" : "outline"}
              className={cn(
                "text-xs h-7 px-2",
                showOnlyMyJets 
                  ? getThemedButtonClasses('primary')
                  : "bg-gdyup-bg-dark/70 text-gdyup-text hover:bg-gdyup-bg-card border border-gdyup-border shadow-md"
              )}
              onClick={toggleMyJetsFilter}
            >
              <User className="h-3 w-3 mr-1" />
              My Jets
            </Button>
            
            {/* Capacity filters */}
            {[
              { label: 'All', value: null },
              { label: '4+ seats', value: 4 },
              { label: '8+ seats', value: 8 },
              { label: '12+ seats', value: 12 }
            ].map((filter) => (
              <Button
                key={filter.label}
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2 bg-gdyup-bg-dark/70 text-gdyup-text hover:bg-gdyup-bg-card border border-gdyup-border shadow-md"
              >
                {filter.label}
              </Button>
            ))}
          </div>
          
          <div className="overflow-y-auto flex-1 pb-16">
            {/* Favorites section */}
            {favoriteJets.length > 0 && (
              <div className="py-2">
                <div className={cn("px-4 py-1 text-sm font-medium", getThemedTextClasses('muted'))}>
                  Favorites
                </div>
                {favoriteJets.map((jet: Jet, idx: number) => 
                  renderJetItem(jet, idx, true)
                )}
              </div>
            )}
            
            {/* Main jet list based on filters */}
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gdyup-primary" />
              </div>
            ) : filteredJets.length > 0 ? (
              filteredJets
                .filter(jet => !favoriteJets.some((fav: Jet) => fav.id === jet.id))
                .map((jet: Jet, idx: number) => renderJetItem(jet, idx, false))
            ) : search.length >= 2 ? (
              <div className={cn("p-4 text-center", getThemedTextClasses())}>
                No jets found for &quot;{search}&quot;
              </div>
            ) : recentJets.length > 0 ? (
              recentJets
                .filter((jet: Jet) => !favoriteJets.some((fav: Jet) => fav.id === jet.id))
                .map((jet: Jet, idx: number) => renderJetItem(jet, idx, false))
            ) : (
              <div className={cn("p-4 text-center", getThemedTextClasses())}>
                No jets found. Please try again later.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 
'use client';

import React, { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MapPin, Search, X, Loader2, Globe, ChevronDown, Heart, Map, Star, CheckCircle } from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import useLocalStorage from '@/hooks/useLocalStorage';
import { debounce } from 'lodash';

// Define the Airport interface
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  is_private?: boolean;
  icao_code?: string;
}

// Define types for the component props
interface EnhancedLocationAutocompleteProps {
  value: string;
  name?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  airports?: Airport[];
  popularLocations?: string[];
  className?: string;
  variant?: 'departure' | 'arrival';
  error?: string;
}

// Define popular airports array for fallback
const POPULAR_AIRPORTS: Airport[] = [
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'USA' },
  { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'USA' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'USA' },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'USA' },
  { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'USA' },
];

function EnhancedLocationAutocomplete({
  value,
  name,
  onChange,
  onBlur,
  placeholder = 'Enter location',
  label,
  airports = [],
  popularLocations = [],
  className,
  variant = 'departure',
  error,
}: EnhancedLocationAutocompleteProps) {
  // State management
  const [results, setResults] = useState<Airport[]>([]);
  const [formattedResults, setFormattedResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentlySelected, setRecentlySelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [favoriteAirports, setFavoriteAirports] = useLocalStorage<Airport[]>('favorite-airports', []);
  const [recentAirports, setRecentAirports] = useLocalStorage<Airport[]>('recent-airports', []);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get theme functionality
  const { 
    theme, 
    isMobile,
    getThemedTextClasses,
    getThemedButtonClasses,
    getThemedBackgroundClasses,
    getThemedBadgeClasses 
  } = useGdyupTheme();

  // Color scheme based on variant - still keeping some variant-specific colors but with theme-aware base
  const colors = variant === 'departure' 
    ? { 
        bgClass: "bg-blue-600/30", 
        iconClass: "text-blue-100", 
        ringClass: "ring-blue-500/30",
        bgActiveClass: "bg-blue-900",
        textActiveClass: "text-blue-100",
        borderActiveClass: "border-blue-700"
      }
    : { 
        bgClass: "bg-amber-600/30", 
        iconClass: "text-amber-100", 
        ringClass: "ring-amber-500/30",
        bgActiveClass: "bg-amber-900",
        textActiveClass: "text-amber-100",
        borderActiveClass: "border-amber-700"
      };

  // Check if an airport is formatted in the "City (CODE)" format
  const hasSelectedAirport = value && value.trim() !== '' && value.match(/^(.*)\s+\(([A-Z]{3,4})\)$/);

  // Format the input text to highlight the airport code
  const formatDisplayText = (text: string) => {
    // Look for a pattern like "City Name (CODE)"
    const match = text?.match(/^(.*)\s+\(([A-Z]{3,4})\)$/);
    if (match) {
      return (
        <div className="flex items-center">
          <span>{match[1]}</span>
          <span className={cn(
            "ml-1 px-1.5 py-0.5 text-xs font-bold rounded shadow-sm",
            variant === 'departure' 
              ? "bg-blue-600/60 text-white border border-blue-500/50" 
              : "bg-amber-600/60 text-white border border-amber-500/50"
          )}>
            {match[2]}
          </span>
        </div>
      );
    }
    return text;
  };

  // Format airport for display
  const formatAirportDisplay = useCallback((airport: Airport): string => {
    return `${airport.city} (${airport.code})`;
  }, []);

  // Toggle favorite airport
  const toggleFavorite = (airport: Airport) => {
    const isFavorite = favoriteAirports.some(fav => fav.code === airport.code);
    
    if (isFavorite) {
      setFavoriteAirports(prev => prev.filter(fav => fav.code !== airport.code));
    } else {
      setFavoriteAirports(prev => [...prev, airport]);
    }
  };

  // Add to recent airports
  const addToRecent = (airport: Airport) => {
    // Remove if already exists
    const filtered = recentAirports.filter(recent => recent.code !== airport.code);
    
    // Add to the beginning (most recent)
    setRecentAirports([airport, ...filtered.slice(0, 9)]);
  };

  // Handle focus on input
  const handleFocus = () => {
    setIsFocused(true);
    
    // If we have a search value already, trigger search
    if (value && value.length >= 2) {
      debouncedSearch(value);
    } else {
      // Show popular destinations
      const popularSuggestions = getPopularSuggestions();
      setResults(popularSuggestions);
      setFormattedResults(popularSuggestions.map(formatAirportDisplay));
      setShowResults(true);
    }
  };

  // Handle blur
  const handleInternalBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowResults(false);
      
      if (onBlur) onBlur();
    }, 200);
  };

  // Get popular suggestions
  const getPopularSuggestions = useCallback(() => {
    // First show favorites if available
    if (favoriteAirports.length > 0) {
      return favoriteAirports.slice(0, 3).concat(
        // Then show recents not already in favorites
        recentAirports.filter(recent => 
          !favoriteAirports.some(fav => fav.code === recent.code)
        ).slice(0, 3)
      );
    }
    
    // Then show recent airports if available
    if (recentAirports.length > 0) {
      return recentAirports.slice(0, 6);
    }
    
    // Otherwise use airports from database if available
    if (airports && airports.length > 0) {
      const dbSuggestions = airports
        .filter(airport => airport.is_private !== true)
        .slice(0, 6);
      
      if (dbSuggestions.length > 0) {
        return dbSuggestions;
      }
    }
    
    // Fallback to predefined popular airports
    return POPULAR_AIRPORTS.slice(0, 6);
  }, [airports, favoriteAirports, recentAirports]);

  // Complete the debounced search function implementation
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      if (searchValue.length < 2) {
        setResults([]);
        setFormattedResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      
      startTransition(() => {
        try {
          let filtered: Airport[] = [];
          
          if (airports && airports.length > 0) {
            console.log(`LocationAutocomplete: Searching ${airports.length} airports for "${searchValue}"`);
            
            const searchLower = searchValue.toLowerCase();
            
            // First, prioritize direct code matches
            const codeMatches = airports.filter(airport => 
              airport.code.toLowerCase() === searchLower
            );
            
            // Then matches for ICAO code if available
            const icaoMatches = airports.filter(airport => 
              !codeMatches.includes(airport) && 
              airport.icao_code && 
              airport.icao_code.toLowerCase() === searchLower
            );
            
            // Then matches starting with search term
            const startsWithMatches = airports.filter(airport => 
              !codeMatches.includes(airport) && 
              !icaoMatches.includes(airport) && (
                airport.code.toLowerCase().startsWith(searchLower) || 
                airport.city.toLowerCase().startsWith(searchLower) ||
                (airport.icao_code && airport.icao_code.toLowerCase().startsWith(searchLower))
              )
            );
            
            // Finally contains matches
            const containsMatches = airports.filter(airport => 
              !codeMatches.includes(airport) &&
              !icaoMatches.includes(airport) &&
              !startsWithMatches.includes(airport) &&
              (airport.code.toLowerCase().includes(searchLower) || 
              airport.city.toLowerCase().includes(searchLower) ||
              airport.name.toLowerCase().includes(searchLower) ||
              airport.country.toLowerCase().includes(searchLower) ||
              (airport.icao_code && airport.icao_code.toLowerCase().includes(searchLower)))
            );
            
            filtered = [...codeMatches, ...icaoMatches, ...startsWithMatches, ...containsMatches];
          }
          
          // If no database airports available or filtered results are empty, try POPULAR_AIRPORTS
          if ((!airports || airports.length === 0 || filtered.length === 0) && POPULAR_AIRPORTS.length > 0) {
            console.log(`LocationAutocomplete: Using POPULAR_AIRPORTS fallback for search "${searchValue}"`);
            
            const searchLower = searchValue.toLowerCase();
            
            filtered = POPULAR_AIRPORTS.filter(airport => 
              airport.code.toLowerCase().includes(searchLower) ||
              airport.city.toLowerCase().includes(searchLower) ||
              airport.name.toLowerCase().includes(searchLower) ||
              airport.country.toLowerCase().includes(searchLower)
            );
          }
          
          // If still no results, use popularLocations prop as the last fallback
          if (filtered.length === 0 && popularLocations.length > 0) {
            console.log(`LocationAutocomplete: Using popularLocations fallback for search "${searchValue}"`);
            
            filtered = popularLocations
              .filter(location => location.toLowerCase().includes(searchValue.toLowerCase()))
              .map(location => {
                const match = location.match(/^(.*)\s+\(([A-Z]{3,4})\)$/);
                if (match) {
                  return {
                    city: match[1],
                    code: match[2],
                    name: `${match[1]} International Airport`,
                    country: 'Unknown',
                    is_private: false
                  };
                }
                return {
                  city: location,
                  code: 'UNK',
                  name: location,
                  country: 'Unknown',
                  is_private: false
                };
              });
          }
          
          // Limit results to 15 for performance
          filtered = filtered.slice(0, 15);
          const formatted = filtered.map(formatAirportDisplay);
          
          setResults(filtered);
          setFormattedResults(formatted);
          setShowResults(filtered.length > 0);
        } finally {
          setIsLoading(false);
        }
      });
    }, 300),
    [airports, popularLocations, formatAirportDisplay]
  );

  // Handle search on input change
  const handleSearch = (searchValue: string) => {
    onChange(searchValue);
    
    const isSelectedFormat = /^(.*)\s+\(([A-Z]{3,4})\)$/.test(searchValue);

    if (!isSelectedFormat && searchValue.length >= 2) {
      debouncedSearch(searchValue);
    } else {
      setResults([]);
      setFormattedResults([]);
      setShowResults(false);
    }
  };

  // Handle item selection
  const handleSelect = (airport: Airport) => {
    const formattedValue = formatAirportDisplay(airport);
    onChange(formattedValue);
    setShowResults(false);
    setRecentlySelected(true);
    
    // Add to recents
    addToRecent(airport);
    
    // Close mobile modal if open
    setShowFullModal(false);
    
    if (onBlur) onBlur();
    
    setTimeout(() => setRecentlySelected(false), 1500);
    
    if (inputRef.current) {
      inputRef.current.blur();
      
      setTimeout(() => {
        const event = new CustomEvent('locationSelect', {
          detail: { 
            name: name || inputRef.current?.name || '',
            value: formattedValue,
            airport
          }
        });
        
        if (event.detail.name || event.detail.value) {
          window.dispatchEvent(event);
        }
      }, 50);
    }
  };

  // Render an airport item
  const renderAirportItem = (airport: Airport, index: number, isFavorited: boolean = false, onlyIcon: boolean = false) => {
    const isPrivate = airport.is_private === true;
    
    return (
      <div
        key={`${airport.code}-${index}`}
        className={cn(
          "px-3 py-3 cursor-pointer flex items-center justify-between border-b last:border-b-0 group",
          "hover:bg-gray-700 border-gray-700/70"
        )}
        onClick={() => handleSelect(airport)}
      >
        <div className="flex-grow">
          <div className="flex items-center flex-wrap">
            <span className={getThemedTextClasses()}>{airport.city}</span>
            <span className={cn(
              "ml-2 px-1.5 py-0.5 text-xs font-bold rounded-md", 
              variant === 'departure' 
                ? colors.bgActiveClass + ' ' + colors.textActiveClass 
                : colors.bgActiveClass + ' ' + colors.textActiveClass
            )}>
              {airport.code}
            </span>
            {airport.icao_code && (
              <span className={cn(
                "ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-md shadow-sm",
                "bg-gray-800/80 text-gray-300 border-gray-700/70"
              )}>
                {airport.icao_code}
              </span>
            )}
            {isPrivate && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold bg-purple-900/80 text-purple-100 border border-purple-800/70 rounded-md shadow-sm">
                Private
              </span>
            )}
          </div>
          {!onlyIcon && airport.country && (
            <div className={cn("text-[10px] mt-0.5", getThemedTextClasses('muted'))}>
              {airport.country}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(airport);
          }}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity",
            "hover:bg-gray-800"
          )}
        >
          {isFavorited ? (
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" style={{ fill: '#DAFF0D', color: '#000000', stroke: '#000000', strokeWidth: 1 }} />
          ) : (
            <Star className="h-4 w-4 text-gray-400 group-hover:text-gray-300" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className={cn("block text-sm font-medium mb-1.5 ml-1", getThemedTextClasses())}>{label}</label>
      )}
      
      {/* Main input container */}
      <div 
        className={cn(
          "relative flex items-center overflow-hidden rounded-lg border",
          getThemedBackgroundClasses('card'),
          error ? "border-red-500" : 
            isFocused ? 
              (variant === 'departure' ? 
                cn("border-blue-400 ring-2", colors.ringClass) : 
                cn("border-amber-400 ring-2", colors.ringClass)
              ) : 
              "border-gdyup-border",
          recentlySelected && "ring-2 ring-green-500/40"
        )}
      >
        {/* Icon on the left */}
        <div className={cn("flex items-center justify-center h-12 w-12", colors.bgClass)}>
          <MapPin className={cn("h-5 w-5", colors.iconClass)} />
        </div>
        
        {/* Conditionally render either the formatted display or regular input */}
        {hasSelectedAirport ? (
          <div 
            className={cn("border-0 bg-transparent h-12 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-base flex items-center flex-1 cursor-text font-medium", getThemedTextClasses())}
            onClick={() => {
              if (isMobile) {
                setShowFullModal(true);
              } else {
                inputRef.current?.focus();
              }
            }}
          >
            {formatDisplayText(value)}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => handleSearch(e.target.value)}
              className="absolute opacity-0 pointer-events-none"
              onFocus={handleFocus}
              onBlur={handleInternalBlur}
              name={name}
            />
          </div>
        ) : (
          <>
            {isMobile ? (
              <div 
                className={cn("border-0 bg-transparent h-12 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-base flex items-center flex-1 cursor-text font-medium", getThemedTextClasses())}
                onClick={() => setShowFullModal(true)}
              >
                <span className="text-gray-500">
                  {variant === 'departure' ? 'From city or airport code' : 'To city or airport code'}
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="absolute opacity-0 pointer-events-none"
                  name={name}
                />
              </div>
            ) : (
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  type="text"
                  className={cn(
                    "bg-transparent h-11 border-0 focus-visible:ring-0",
                    error && "border-red-500 focus:border-red-500",
                    getThemedTextClasses(),
                    "placeholder:text-gray-400"
                  )}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleInternalBlur}
                  name={name}
                />
              </div>
            )}
          </>
        )}
        
        {/* Clear button or search/loading icon */}
        <div className="pr-3">
          {isLoading || isPending ? (
            <Loader2 className={cn("h-4 w-4 animate-spin", getThemedTextClasses('muted'))} />
          ) : value ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setResults([]);
                setFormattedResults([]);
                setShowResults(false);
                if (inputRef.current) inputRef.current.focus();
              }}
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center",
                getThemedBackgroundClasses('secondary'),
                "hover:bg-gray-600/90"
              )}
            >
              <X className={cn("h-4 w-4", getThemedTextClasses('muted'))} />
            </button>
          ) : (
            <Search className={cn("h-4 w-4", getThemedTextClasses('muted'))} />
          )}
        </div>
      </div>

      {/* Results dropdown for desktop */}
      {!isMobile && (
        <AnimatePresence>
          {showResults && (
            <motion.div 
              ref={resultsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute z-[100] mt-1 w-full rounded-lg shadow-lg overflow-hidden",
                getThemedBackgroundClasses('card'),
                "border border-gdyup-border"
              )}
              style={{ 
                maxHeight: '60vh',
                position: 'absolute',
                top: '100%',
                left: 0
              }}
            >
              <div className="max-h-[350px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {results.length > 0 ? (
                  results.map((airport, index) => 
                    renderAirportItem(
                      airport, 
                      index, 
                      favoriteAirports.some(fav => fav.code === airport.code)
                    )
                  )
                ) : (
                  <div className={cn("px-3 py-6 text-center", getThemedTextClasses('muted'))}>
                    <div>No airports found</div>
                  </div>
                )}
                
                {(!value || value.length < 2) && (
                  <div className="mt-2 border-t border-gray-700/50 pt-2">
                    <div className="px-3 py-1 text-xs text-gray-500 font-medium flex items-center">
                      <Globe className="h-3 w-3 mr-1 opacity-70" />
                      {favoriteAirports.length > 0 ? "Favorites & Recents" : "Popular destinations"}
                    </div>
                    <div className="py-1">
                      {getPopularSuggestions().map((airport, index) => 
                        renderAirportItem(
                          airport, 
                          index, 
                          favoriteAirports.some(fav => fav.code === airport.code)
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile full-screen sheet */}
      {isMobile && (
        <Sheet open={showFullModal} onOpenChange={setShowFullModal}>
          <SheetContent side="bottom" className={cn(
            "h-[85vh] p-0 pt-6",
            getThemedBackgroundClasses('card'),
            "border-t border-gdyup-border"
          )}>
            <SheetHeader className="px-4 mb-2">
              <SheetTitle className={getThemedTextClasses()}>
                {variant === 'departure' ? 'Departure Airport' : 'Arrival Airport'}
              </SheetTitle>
            </SheetHeader>
            
            <div className="px-4 pb-2">
              <div className={cn(
                "flex items-center rounded-full overflow-hidden border",
                getThemedBackgroundClasses('card'),
                "border-gdyup-border"
              )}>
                <Search className={cn("h-4 w-4 ml-3 mr-2", getThemedTextClasses('muted'))} />
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={variant === 'departure' ? 'Search departure city or airport code' : 'Search arrival city or airport code'}
                  className={cn("border-0 bg-transparent h-12 pl-0 focus-visible:ring-0 focus-visible:ring-offset-0", getThemedTextClasses())}
                  autoFocus
                />
                {value && (
                  <button 
                    type="button" 
                    onClick={() => {
                      onChange('');
                      setResults([]);
                      setFormattedResults([]);
                    }}
                    className={cn(
                      "h-7 w-7 mr-3 rounded-full flex items-center justify-center transition-colors",
                      getThemedBackgroundClasses('secondary')
                    )}
                  >
                    <X className={cn("h-4 w-4", getThemedTextClasses('muted'))} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={cn(
              "flex px-4 border-b py-2 overflow-x-auto space-x-2 scrollbar-thin scrollbar-thumb-gray-600",
              "border-gdyup-border"
            )}>
              {favoriteAirports.length > 0 && (
                <>
                  {favoriteAirports.slice(0, 5).map((airport, idx) => (
                    <Badge 
                      key={`fav-${airport.code}-${idx}`}
                      className={cn(
                        "cursor-pointer py-1 px-2 flex items-center gap-1 whitespace-nowrap",
                        getThemedBadgeClasses('primary')
                      )}
                      onClick={() => handleSelect(airport)}
                    >
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" style={{ fill: '#DAFF0D', color: '#000000', stroke: '#000000', strokeWidth: 1 }} />
                      {airport.city} ({airport.code})
                    </Badge>
                  ))}
                </>
              )}
            </div>
            
            <div className="overflow-y-auto flex-1 pb-16">
              {/* Favorites section */}
              {favoriteAirports.length > 0 && (
                <div className="py-2">
                  <div className={cn("px-4 py-1 text-sm font-medium", getThemedTextClasses('muted'))}>
                    Favorites
                  </div>
                  {favoriteAirports.map((airport, idx) => 
                    renderAirportItem(airport, idx, true, false)
                  )}
                </div>
              )}
              
              {/* Search results or recent airports */}
              <div className="py-2">
                <div className={cn("px-4 py-1 text-sm font-medium", getThemedTextClasses('muted'))}>
                  {results.length > 0 
                    ? `Search Results (${results.length})` 
                    : (recentAirports.length > 0 ? 'Recent Airports' : 'Popular Airports')}
                </div>
                
                {results.length > 0 ? (
                  results.map((airport, idx) => 
                    renderAirportItem(
                      airport, 
                      idx, 
                      favoriteAirports.some(fav => fav.code === airport.code),
                      false
                    )
                  )
                ) : recentAirports.length > 0 ? (
                  recentAirports
                    .filter(airport => !favoriteAirports.some(fav => fav.code === airport.code))
                    .map((airport, idx) => 
                      renderAirportItem(airport, idx, false, false)
                    )
                ) : (
                  POPULAR_AIRPORTS.map((airport, idx) => 
                    renderAirportItem(airport, idx, false, false)
                  )
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {error && (
        <p className="mt-1.5 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export { EnhancedLocationAutocomplete };
export default EnhancedLocationAutocomplete; 
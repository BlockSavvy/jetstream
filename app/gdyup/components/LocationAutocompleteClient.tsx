import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Search, MapPin, X, CheckCircle, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

// Popular airports to fall back to when API fails
const POPULAR_AIRPORTS = [
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA", is_private: false },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA", is_private: false },
  { code: "MIA", name: "Miami International Airport", city: "Miami", country: "USA", is_private: false },
  { code: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "USA", is_private: false },
  { code: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "USA", is_private: false },
  { code: "LHR", name: "Heathrow Airport", city: "London", country: "UK", is_private: false },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", is_private: false }
];

// Define Airport interface directly in this file to avoid import issues
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  is_private?: boolean;
  lat?: number;
  lng?: number;
}

export default function LocationAutocompleteClient({
  value = '',
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
}: {
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
}) {
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses, getThemedBadgeClasses } = useGdyupTheme();
  const [results, setResults] = useState<Airport[]>([]);
  const [formattedResults, setFormattedResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentlySelected, setRecentlySelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  // Function to format airport display
  const formatAirportDisplay = useCallback((airport: Airport): string => {
    return `${airport.city} (${airport.code})`;
  }, []);

  // Format the input text to highlight the airport code
  const formatDisplayText = (text: string) => {
    // Look for a pattern like "City Name (CODE)"
    const match = text?.match(/^(.*)\s+\(([A-Z]{3,4})\)$/);
    if (match) {
      return (
        <div className="flex items-center">
          <span>{match[1]}</span>
          <span className={cn(
            "ml-1 px-1.5 py-0.5 text-xs font-bold rounded shadow-sm border",
            variant === 'departure' 
              ? "bg-blue-600/60 text-white border-blue-500/50" 
              : "bg-amber-600/60 text-white border-amber-500/50"
          )}>
            {match[2]}
          </span>
        </div>
      );
    }
    return text;
  };

  // Instead of using a custom input component, conditionally render based on value
  const hasSelectedAirport = value && value.trim() !== '' && value.match(/^(.*)\s+\(([A-Z]{3,4})\)$/);

  // Add a focus handler to show popular destinations if no search is active
  const handleFocus = () => {
    setIsFocused(true);
    
    // If we have a search value already, trigger search
    if (value && value.length >= 2) {
      debouncedSearch(value);
    } else if (!showResults) {
      // Show popular destinations
      const popularSuggestions = getPopularSuggestions();
      setResults(popularSuggestions);
      setFormattedResults(popularSuggestions.map(formatAirportDisplay));
      setShowResults(true);
    }
  };

  // Handle blur to close dropdown
  const handleInternalBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowResults(false);
      
      if (onBlur) onBlur();
    }, 200);
  };
  
  // Debounced search function
  const debouncedSearch = useCallback((searchValue: string) => {
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
          
          // Then matches starting with search term
          const startsWithMatches = airports.filter(airport => 
            !codeMatches.includes(airport) && (
              airport.code.toLowerCase().startsWith(searchLower) || 
              airport.city.toLowerCase().startsWith(searchLower)
            )
          );
          
          // Finally contains matches
          const containsMatches = airports.filter(airport => 
            !codeMatches.includes(airport) &&
            !startsWithMatches.includes(airport) &&
            (airport.code.toLowerCase().includes(searchLower) || 
             airport.city.toLowerCase().includes(searchLower) ||
             airport.name.toLowerCase().includes(searchLower) ||
             airport.country.toLowerCase().includes(searchLower))
          );
          
          filtered = [...codeMatches, ...startsWithMatches, ...containsMatches];
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
  }, [airports, popularLocations, formatAirportDisplay]);

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

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get popular location suggestions
  const getPopularSuggestions = useCallback(() => {
    if (airports && airports.length > 0) {
      const dbSuggestions = airports
        .filter(airport => airport.is_private !== true)
        .slice(0, 8);
      
      if (dbSuggestions.length > 0) {
        return dbSuggestions;
      }
    }
    
    // Use our predefined POPULAR_AIRPORTS if available airports aren't available
    if (POPULAR_AIRPORTS && POPULAR_AIRPORTS.length > 0) {
      return POPULAR_AIRPORTS.slice(0, 6);
    }
    
    // Fallback to the popularLocations prop as a last resort
    return popularLocations.slice(0, 6).map(location => {
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
  }, [airports, popularLocations, POPULAR_AIRPORTS]);

  // Initial search on mount if needed
  useEffect(() => {
    const isSelectedFormat = value && /^(.*)\s+\(([A-Z]{3,4})\)$/.test(value);
    if (value && value.length >= 2 && !isSelectedFormat) {
      const timer = setTimeout(() => debouncedSearch(value), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className={cn("block text-sm font-medium mb-1.5 ml-1", getThemedTextClasses())}>{label}</label>
      )}
      
      <div 
        className={cn(
          "relative flex items-center overflow-hidden rounded-lg border",
          getThemedBackgroundClasses('card'),
          getThemedTextClasses(),
          "transition-all duration-200",
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
            className="border-0 bg-transparent h-12 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-base flex items-center flex-1 cursor-text font-medium"
            onClick={() => inputRef.current?.focus()}
          >
            {formatDisplayText(value)}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => handleSearch(e.target.value)}
              readOnly
              className="absolute opacity-0 pointer-events-none"
              onFocus={handleFocus}
              onBlur={handleInternalBlur}
              name={name}
            />
          </div>
        ) : (
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={variant === 'departure' ? 'From city or code' : 'To city or code'}
            className="border-0 bg-transparent h-12 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-base font-medium placeholder:text-gray-500"
            onFocus={handleFocus}
            onBlur={handleInternalBlur}
            name={name}
          />
        )}
        
        {/* Clear button or search/loading icon */}
        <div className="pr-3">
          {isLoading || isPending ? (
            <Loader2 className={cn("h-4 w-4 animate-spin", getThemedTextClasses('muted'))} />
          ) : value ? (
            <button 
              type="button"
              onClick={() => {
                onChange('');
                setResults([]);
                setFormattedResults([]);
                setShowResults(false);
                if (inputRef.current) inputRef.current.focus();
              }}
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center transition-colors",
                getThemedBackgroundClasses('secondary'),
                "hover:bg-gray-600/90"
              )}
            >
              <X className={cn("h-4 w-4", getThemedTextClasses())} />
            </button>
          ) : (
            <Search className={cn("h-4 w-4 mr-2", getThemedTextClasses('muted'))} />
          )}
        </div>

        {/* Success indicator when item selected */}
        <AnimatePresence>
          {recentlySelected && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-12 top-1/2 transform -translate-y-1/2"
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div 
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-[100] mt-1 w-full border rounded-lg shadow-lg overflow-hidden",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border"
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
                results.map((airport, index) => (
                  <div
                    key={`${airport.code}-${index}`}
                    className={cn(
                      "px-3 py-3 hover:bg-gray-700 cursor-pointer flex items-center group",
                      "border-b border-gray-700/70 last:border-b-0"
                    )}
                    onClick={() => handleSelect(airport)}
                  >
                    <div className="flex-grow">
                      <div className="flex items-center flex-wrap">
                        <span className={cn("font-medium truncate max-w-[150px]", getThemedTextClasses())}>{airport.city}</span>
                        <span className={cn(
                          "ml-2 px-1.5 py-0.5 text-xs font-bold rounded-md shadow-sm border", 
                          colors.bgActiveClass, colors.textActiveClass, colors.borderActiveClass
                        )}>
                          {airport.code}
                        </span>
                        {airport.is_private && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold bg-purple-900/80 text-purple-100 border border-purple-800/70 rounded-md shadow-sm">
                            Private
                          </span>
                        )}
                      </div>
                      <div className={cn("text-xs mt-0.5 truncate max-w-[250px]", getThemedTextClasses('muted'))}>{airport.name}</div>
                      {airport.country && (
                        <div className="text-[10px] text-gray-500">{airport.country}</div>
                      )}
                    </div>
                    <div className={cn(
                      "w-8 h-8 ml-2 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity", 
                      colors.bgActiveClass
                    )}>
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ))
              ) : (
                <div className={cn("px-3 py-6 text-center", getThemedTextClasses('muted'))}>
                  <p className="text-sm">No locations found</p>
                  <p className="text-xs mt-1 text-gray-500">Try a different search term</p>
                </div>
              )}
              
              {/* Popular destinations section */}
              {(!value || value.length < 2) && (
                <div className="mt-2 border-t border-gray-700/50 pt-2">
                  <div className="px-3 py-1 text-xs text-gray-500 font-medium flex items-center">
                    <Globe className="h-3 w-3 mr-1 opacity-70" />
                    Popular destinations
                  </div>
                  <div className="py-1">
                    {getPopularSuggestions().map((airport, index) => (
                      <div
                        key={`popular-${airport.code}-${index}`}
                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-b-0 flex items-center group"
                        onClick={() => handleSelect(airport)}
                      >
                        <div className="flex-grow">
                          <div className="flex items-center flex-wrap">
                            <span className={getThemedTextClasses()}>{airport.city}</span>
                            <span className={cn(
                              "ml-2 px-1.5 py-0.5 text-xs font-bold rounded-md", 
                              colors.bgActiveClass, colors.textActiveClass
                            )}>
                              {airport.code}
                            </span>
                            {airport.is_private && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold bg-purple-900/80 text-purple-100 border border-purple-800/70 rounded-md shadow-sm">
                                Private
                              </span>
                            )}
                          </div>
                          {airport.country && (
                            <div className="text-[10px] text-gray-500 mt-0.5">{airport.country}</div>
                          )}
                        </div>
                        <div className={cn(
                          "w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity", 
                          colors.bgActiveClass
                        )}>
                          <CheckCircle className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
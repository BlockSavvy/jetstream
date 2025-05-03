import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Search, MapPin, X, CheckCircle, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [results, setResults] = useState<Airport[]>([]);
  const [formattedResults, setFormattedResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentlySelected, setRecentlySelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Color scheme based on variant
  const colors = variant === 'departure' 
    ? { primary: 'bg-blue-500', secondary: 'text-blue-300', light: 'bg-blue-500/20', outline: 'border-blue-500/30' }
    : { primary: 'bg-amber-500', secondary: 'text-amber-300', light: 'bg-amber-500/20', outline: 'border-amber-500/30' };

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
          <span className={cn("ml-1 px-1.5 py-0.5 text-xs font-bold rounded shadow-sm", 
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
        // Only use popularLocations as fallback if no airports from database or filtered results are empty
        if ((!airports || airports.length === 0 || filtered.length === 0) && popularLocations.length > 0) {
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
  }, [airports, popularLocations]);

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
        <label className="block text-sm font-medium text-white mb-1.5 ml-1">{label}</label>
      )}
      
      {/* Debug info in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-6 right-0 text-[10px] text-gray-500 z-10">
          {airports.length > 0 ? (
            <span>Using {airports.length} airports</span>
          ) : (
            <span className="text-amber-500">No airport data</span>
          )}
        </div>
      )}
      
      <div 
        className={cn(
          "relative flex items-center overflow-hidden rounded-lg border",
          "bg-black text-white transition-all duration-200",
          error ? "border-red-500" : isFocused ? (variant === 'departure' ? "border-blue-400 ring-2 ring-blue-500/30" : "border-amber-400 ring-2 ring-amber-500/30") : "border-gray-700",
          recentlySelected && "ring-2 ring-green-500/40"
        )}
      >
        {/* Icon on the left */}
        <div className={cn("flex items-center justify-center h-12 w-12", variant === 'departure' ? "bg-blue-600/30" : "bg-amber-600/30")}>
          {variant === 'departure' ? (
            <MapPin className="h-5 w-5 text-blue-100" />
          ) : (
            <MapPin className="h-5 w-5 text-amber-100" />
          )}
        </div>
        
        {/* Conditionally render either the formatted display or regular input */}
        {hasSelectedAirport ? (
          <div 
            className="border-0 bg-transparent h-12 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-white flex items-center flex-1 cursor-text font-medium"
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
            className="border-0 bg-transparent h-12 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-white font-medium placeholder:text-gray-500"
            onFocus={handleFocus}
            onBlur={handleInternalBlur}
            name={name}
          />
        )}
        
        {/* Clear button or search/loading icon */}
        <div className="pr-3">
          {isLoading || isPending ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
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
              className="h-7 w-7 rounded-full bg-gray-700/80 flex items-center justify-center hover:bg-gray-600/90 transition-colors"
            >
              <X className="h-4 w-4 text-gray-300" />
            </button>
          ) : (
            <Search className="h-4 w-4 text-gray-400 mr-2" />
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
            className="absolute z-[100] mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
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
                    className="px-3 py-3 hover:bg-gray-700 cursor-pointer flex items-center border-b border-gray-700/70 last:border-b-0 group"
                    onClick={() => handleSelect(airport)}
                  >
                    <div className="flex-grow">
                      <div className="flex items-center flex-wrap">
                        <span className="text-white font-medium truncate max-w-[150px]">{airport.city}</span>
                        <span className={cn("ml-2 px-1.5 py-0.5 text-xs font-bold rounded-md shadow-sm", 
                          variant === 'departure' 
                            ? "bg-blue-900 text-blue-100 border border-blue-700" 
                            : "bg-amber-900 text-amber-100 border border-amber-700"
                        )}>
                          {airport.code}
                        </span>
                        {airport.is_private && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold bg-purple-900/80 text-purple-100 border border-purple-800/70 rounded-md shadow-sm">
                            Private
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]">{airport.name}</div>
                      {airport.country && (
                        <div className="text-[10px] text-gray-500">{airport.country}</div>
                      )}
                    </div>
                    <div className={cn("w-8 h-8 ml-2 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity", 
                      variant === 'departure' ? "bg-blue-900" : "bg-amber-900")}>
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-gray-400">
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
                            <span className="text-white">{airport.city}</span>
                            <span className={cn("ml-2 px-1.5 py-0.5 text-xs font-bold rounded-md", 
                              variant === 'departure' 
                                ? "bg-blue-900 text-blue-100" 
                                : "bg-amber-900 text-amber-100"
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
                        <div className={cn("w-7 h-7 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity", 
                          variant === 'departure' ? "bg-blue-800" : "bg-amber-800")}>
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
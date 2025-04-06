'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Search, MapPin, X, CheckCircle, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  is_private?: boolean;
  lat?: number;
  lng?: number;
}

// Server-safe props (all props must be serializable for server components)
type LocationAutocompleteProps = {
  value: string;
  placeholder?: string;
  label?: string;
  airports?: Airport[];
  popularLocations?: string[];
  className?: string;
  variant?: 'departure' | 'arrival';
  error?: string;
  name?: string; // Added for form identification
}

// The non-serializable client handlers need to be separated
// This component will be the entry point with client functionality
export default function LocationAutocomplete(props: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(props.value || '');
  
  // Function to handle input change
  const handleChange = (value: string) => {
    setInputValue(value);
    
    // Trigger a custom change event that the form can listen to
    const event = new CustomEvent('locationChange', {
      detail: { name: props.name, value }
    });
    window.dispatchEvent(event);
  };
  
  // Handle blur events
  const handleBlur = () => {
    const event = new CustomEvent('locationBlur', {
      detail: { name: props.name, value: inputValue }
    });
    window.dispatchEvent(event);
  };
  
  // Sync with external value changes
  useEffect(() => {
    if (props.value !== inputValue) {
      setInputValue(props.value || '');
    }
  }, [props.value, inputValue]);
  
  // Render the internal component with all handlers attached
  return (
    <LocationAutocompleteInternal
      {...props}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

// The internal component that doesn't need to worry about serialization
// since it's not directly exported
interface InternalProps extends LocationAutocompleteProps {
  onChange: (value: string) => void;
  onBlur: () => void;
}

function LocationAutocompleteInternal({
  value,
  onChange,
  onBlur,
  placeholder = 'Enter location',
  label,
  airports = [],
  popularLocations = [],
  className,
  variant = 'departure',
  error
}: InternalProps) {
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
              ? "bg-blue-600/40 text-white border border-blue-500/50" 
              : "bg-amber-600/40 text-white border border-amber-500/50"
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

  // Debounced search function
  const debouncedSearch = useCallback((searchValue: string) => {
    if (searchValue.length < 2) {
      setResults([]);
      setFormattedResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    
    // Use transition to avoid UI blocking during filtering
    startTransition(() => {
      try {
        let filtered: Airport[] = [];
        
        // Check if we have airports data to search
        if (airports && airports.length > 0) {
          filtered = airports.filter(airport => {
            const searchLower = searchValue.toLowerCase();
            return (
              airport.code.toLowerCase().includes(searchLower) || 
              airport.city.toLowerCase().includes(searchLower) ||
              airport.name.toLowerCase().includes(searchLower) ||
              airport.country.toLowerCase().includes(searchLower)
            );
          });
        } else {
          // Fallback to popular locations if no airports data
          filtered = popularLocations
            .filter(location => location.toLowerCase().includes(searchValue.toLowerCase()))
            .map(location => {
              // Parse out city and code from format like "New York (JFK)"
              const match = location.match(/^(.*)\s+\(([A-Z]{3})\)$/);
              if (match) {
                return {
                  city: match[1],
                  code: match[2],
                  name: `${match[1]} International Airport`,
                  country: 'Unknown'
                };
              }
              return {
                city: location,
                code: 'UNK',
                name: location,
                country: 'Unknown'
              };
            });
        }
        
        // Limit to 6 results for better mobile UX
        filtered = filtered.slice(0, 6);
        
        // Also create formatted results for display
        const formatted = filtered.map(formatAirportDisplay);
        
        setResults(filtered);
        setFormattedResults(formatted);
        setShowResults(filtered.length > 0);
      } finally {
        setIsLoading(false);
      }
    });
  }, [airports, popularLocations, formatAirportDisplay]);

  // Handle search when input changes
  const handleSearch = (searchValue: string) => {
    onChange(searchValue);
    debouncedSearch(searchValue);
  };

  // Handle selection from autocomplete
  const handleSelect = (airport: Airport) => {
    const formattedValue = formatAirportDisplay(airport);
    onChange(formattedValue);
    setShowResults(false);
    setRecentlySelected(true);
    
    // Visual feedback indication that fades after 1.5s
    setTimeout(() => setRecentlySelected(false), 1500);
    
    // Keep focus on input after selection for mobile UX
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle clicks outside to close dropdown
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

  // Prepare popular suggestions
  const getPopularSuggestions = useCallback(() => {
    if (!airports || airports.length === 0) {
      return popularLocations.slice(0, 4).map(location => {
        const match = location.match(/^(.*)\s+\(([A-Z]{3})\)$/);
        if (match) {
          return {
            city: match[1],
            code: match[2],
            name: `${match[1]} International Airport`,
            country: 'Unknown'
          };
        }
        return {
          city: location,
          code: 'UNK',
          name: location,
          country: 'Unknown'
        };
      });
    }
    
    // Filter for popular airports (could be enhanced to use actual popularity data)
    return airports
      .filter(airport => airport.is_private !== true)
      .slice(0, 4);
  }, [airports, popularLocations]);

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-white mb-1.5 ml-1">{label}</label>
      )}
      
      <div 
        className={cn(
          "relative flex items-center overflow-hidden rounded-lg border",
          "bg-gray-900/80 text-white transition-all duration-200",
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
              className="sr-only"
              onFocus={() => {
                setIsFocused(true);
                if (value.length > 1) {
                  debouncedSearch(value);
                }
              }}
              onBlur={() => {
                setIsFocused(false);
                onBlur();
              }}
            />
          </div>
        ) : (
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="border-0 bg-transparent h-12 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-white font-medium placeholder:text-gray-500"
            onFocus={() => {
              setIsFocused(true);
              if (value.length > 1) {
                debouncedSearch(value);
              }
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur();
            }}
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

      {/* Error message */}
      {error && (
        <div className="mt-1 text-red-500 text-sm ml-1">{error}</div>
      )}

      {/* Results dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div 
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="max-h-[240px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {results.length > 0 ? (
                results.map((airport, index) => {
                  return (
                    <div
                      key={`${airport.code}-${index}`}
                      className="px-3 py-2.5 hover:bg-gray-700 cursor-pointer flex items-center border-b border-gray-700/70 last:border-b-0 group"
                      onClick={() => handleSelect(airport)}
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mr-2", variant === 'departure' ? "bg-blue-500/30" : "bg-amber-500/30")}>
                        {variant === 'departure' ? (
                          <MapPin className="h-4 w-4 text-blue-200" />
                        ) : (
                          <MapPin className="h-4 w-4 text-amber-200" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium text-white">
                            {airport.city}
                          </span>
                          <Badge className={cn("ml-2 px-2 py-0.5 text-xs font-bold shadow-sm", variant === 'departure' ? "bg-blue-500/40 text-white border-blue-500/50" : "bg-amber-500/40 text-white border-amber-500/50")}>
                            {airport.code}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-300">{airport.name}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-gray-300">
                  {isLoading || isPending ? 'Searching...' : 'No results found'}
                </div>
              )}
            </div>

            {/* Popular suggestions - now always visible when dropdown is open */}
            <div className="border-t border-gray-700 px-3 py-2 text-xs text-gray-300 font-medium flex items-center bg-gray-700/80">
              <Globe className="h-3 w-3 mr-1.5" />
              Popular destinations
            </div>
            <div className="pb-2 px-2 grid grid-cols-2 gap-1 bg-gray-800">
              {getPopularSuggestions().map((airport, index) => (
                <div
                  key={`popular-${index}-${airport.code}`}
                  className="px-2 py-1.5 hover:bg-gray-700 cursor-pointer rounded-md text-sm text-gray-200 hover:text-white transition-colors flex items-center space-x-1"
                  onClick={() => handleSelect(airport)}
                >
                  <span>{airport.city}</span>
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-bold rounded bg-gray-600 text-white">{airport.code}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
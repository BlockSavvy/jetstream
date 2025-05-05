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
  const { theme, getThemeClasses, isMobile } = useGdyupTheme();

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
          <span className={getThemeClasses({
            base: "ml-1 px-1.5 py-0.5 text-xs font-bold rounded shadow-sm",
            default: variant === 'departure' 
              ? "bg-blue-600/60 text-white border border-blue-500/50" 
              : "bg-amber-600/60 text-white border border-amber-500/50",
            blue: "bg-blue-600/60 text-white border border-blue-500/50",
            pink: "bg-pink-600/60 text-white border border-pink-500/50"
          })}>
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

  // Get theme-specific class names
  const getThemeVariants = useCallback(() => {
    // Base styles that work for all themes
    const baseContainerStyles = "relative flex items-center overflow-hidden rounded-lg border";
    
    // Theme-specific variations
    if (variant === 'departure') {
      return getThemeClasses({
        base: baseContainerStyles,
        default: "bg-black text-white border-gray-700 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/30",
        blue: "bg-blue-950 text-white border-blue-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30",
        pink: "bg-pink-950 text-white border-pink-800 focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-400/30"
      });
    } else {
      return getThemeClasses({
        base: baseContainerStyles,
        default: "bg-black text-white border-gray-700 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/30",
        blue: "bg-blue-950 text-white border-blue-800 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30",
        pink: "bg-pink-950 text-white border-pink-800 focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-400/30"
      });
    }
  }, [variant, getThemeClasses, theme]);

  // Get icon container styles
  const getIconContainerStyles = () => {
    return getThemeClasses({
      base: "flex items-center justify-center h-12 w-12",
      default: variant === 'departure' ? "bg-blue-600/30" : "bg-amber-600/30",
      blue: "bg-blue-800/50",
      pink: "bg-pink-800/50"
    });
  };

  // Get icon styles
  const getIconStyles = () => {
    return getThemeClasses({
      base: "h-5 w-5",
      default: variant === 'departure' ? "text-blue-100" : "text-amber-100",
      blue: "text-blue-100",
      pink: "text-pink-100"
    });
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
        className={getThemeClasses({
          base: "px-3 py-3 hover:bg-opacity-70 cursor-pointer flex items-center justify-between border-b last:border-b-0 group",
          default: "hover:bg-gray-700 border-gray-700/70",
          blue: "hover:bg-blue-800 border-blue-800/70",
          pink: "hover:bg-pink-800 border-pink-800/70"
        })}
        onClick={() => handleSelect(airport)}
      >
        <div className="flex-grow">
          <div className="flex items-center flex-wrap">
            <span className="text-white">{airport.city}</span>
            <span className={getThemeClasses({
              base: "ml-2 px-1.5 py-0.5 text-xs font-bold rounded-md", 
              default: variant === 'departure' 
                ? "bg-blue-900 text-blue-100" 
                : "bg-amber-900 text-amber-100",
              blue: "bg-blue-800 text-blue-100",
              pink: "bg-pink-800 text-pink-100"
            })}>
              {airport.code}
            </span>
            {airport.icao_code && (
              <span className={getThemeClasses({
                base: "ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-md shadow-sm",
                default: "bg-gray-800/80 text-gray-300 border-gray-700/70",
                blue: "bg-blue-900/80 text-blue-300 border-blue-800/70",
                pink: "bg-pink-900/80 text-pink-300 border-pink-800/70"
              })}>
                {airport.icao_code}
              </span>
            )}
            {isPrivate && (
              <span className={getThemeClasses({
                base: "ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-md shadow-sm",
                default: "bg-purple-900/80 text-purple-100 border-purple-800/70",
                blue: "bg-blue-900/80 text-blue-100 border-blue-800/70", 
                pink: "bg-pink-900/80 text-pink-100 border-pink-800/70"
              })}>
                Private
              </span>
            )}
          </div>
          {!onlyIcon && airport.country && (
            <div className={getThemeClasses({
              base: "text-[10px] mt-0.5",
              default: "text-gray-500",
              blue: "text-blue-400/70",
              pink: "text-pink-400/70"
            })}>
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
          className={getThemeClasses({
            base: "h-8 w-8 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity",
            default: "hover:bg-gray-800",
            blue: "hover:bg-blue-900",
            pink: "hover:bg-pink-900" 
          })}
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
        <label className="block text-sm font-medium text-white mb-1.5 ml-1">{label}</label>
      )}
      
      {/* Main input container */}
      <div 
        className={cn(
          getThemeVariants(),
          error ? "border-red-500" : "",
          recentlySelected && "ring-2 ring-green-500/40"
        )}
      >
        {/* Icon on the left */}
        <div className={getIconContainerStyles()}>
          <MapPin className={getIconStyles()} />
        </div>
        
        {/* Conditionally render either the formatted display or regular input */}
        {hasSelectedAirport ? (
          <div 
            className="border-0 bg-transparent h-12 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-white flex items-center flex-1 cursor-text font-medium"
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
                className="border-0 bg-transparent h-12 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-white flex items-center flex-1 cursor-text font-medium"
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
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  className={cn(
                    getThemeClasses({
                      base: "pl-9 pr-9 py-2 h-11 rounded-xl shadow-sm",
                      default: "bg-transparent border-gray-700 focus:border-[#DAFF0D] text-white placeholder:text-gray-400",
                      blue: "bg-transparent border-blue-800 focus:border-blue-500 text-white placeholder:text-blue-400/70",
                      pink: "bg-transparent border-pink-800 focus:border-pink-500 text-white placeholder:text-pink-400/70",
                    }),
                    error && "border-red-500 focus:border-red-500",
                    className
                  )}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleInternalBlur}
                  name={name}
                />
                
                <Search className={getThemeClasses({
                  base: "w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2",
                  default: "text-gray-400",
                  blue: "text-blue-400/70",
                  pink: "text-pink-400/70"
                })} />
                
                {/* Clear button or search/loading icon */}
                <div className="pr-3">
                  {isLoading || isPending ? (
                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
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
                      className="h-7 w-7 rounded-full bg-gray-900/40 flex items-center justify-center hover:bg-gray-800/60 transition-colors border border-gray-700/30"
                    >
                      <X className="h-4 w-4 text-gray-400" style={{ color: '#9ca3af', stroke: '#9ca3af', strokeWidth: 2 }} />
                    </button>
                  ) : (
                    <Search className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                </div>
              </div>
            )}
          </>
        )}
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
              className={getThemeClasses({
                base: "absolute z-[100] mt-1 w-full border rounded-lg shadow-lg overflow-hidden",
                default: "bg-gray-800 border-gray-700",
                blue: "bg-blue-950 border-blue-800",
                pink: "bg-pink-950 border-pink-800"
              })}
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
                  <div className="px-3 py-6 text-center">
                    <div className="text-gray-400 text-sm">No airports found</div>
                  </div>
                )}
                
                {(!value || value.length < 2) && (
                  <div className={getThemeClasses({
                    base: "mt-2 border-t pt-2",
                    default: "border-gray-700/50",
                    blue: "border-blue-800/50",
                    pink: "border-pink-800/50" 
                  })}>
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
          <SheetContent side="bottom" className={getThemeClasses({
            base: "h-[85vh] p-0 pt-6",
            default: "bg-gray-900 text-white border-t border-gray-700",
            blue: "bg-blue-950 text-white border-t border-blue-800",
            pink: "bg-pink-950 text-white border-t border-pink-800" 
          })}>
            <SheetHeader className="px-4 mb-2">
              <SheetTitle className={getThemeClasses({
                base: "text-lg font-bold",
                default: "text-white",
                blue: "text-white",
                pink: "text-white"
              })}>
                {variant === 'departure' ? 'Departure Airport' : 'Arrival Airport'}
              </SheetTitle>
            </SheetHeader>
            
            <div className="px-4 pb-2">
              <div className={getThemeClasses({
                base: "flex items-center rounded-full overflow-hidden border",
                default: "bg-black text-white border-gray-700",
                blue: "bg-blue-950 text-white border-blue-800",
                pink: "bg-pink-950 text-white border-pink-800"
              })}>
                <Search className="h-4 w-4 ml-3 mr-2 text-gray-400" />
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={variant === 'departure' ? 'Search departure city or airport code' : 'Search arrival city or airport code'}
                  className="border-0 bg-transparent h-12 pl-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
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
                    className="h-7 w-7 mr-3 rounded-full bg-gray-900/40 flex items-center justify-center hover:bg-gray-800/60 transition-colors border border-gray-700/30"
                  >
                    <X className="h-4 w-4 text-gray-400" style={{ color: '#9ca3af', stroke: '#9ca3af', strokeWidth: 2 }} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={getThemeClasses({
              base: "flex px-4 border-b py-2 overflow-x-auto space-x-2 scrollbar-thin scrollbar-thumb-gray-600",
              default: "border-gray-800",
              blue: "border-blue-900",
              pink: "border-pink-900"
            })}>
              {favoriteAirports.length > 0 && (
                <>
                  {favoriteAirports.slice(0, 5).map((airport, idx) => (
                    <Badge 
                      key={`fav-${airport.code}-${idx}`}
                      className={getThemeClasses({
                        base: "cursor-pointer py-1 px-2 flex items-center gap-1 whitespace-nowrap",
                        default: "bg-amber-700/30 hover:bg-amber-700/50 text-white border-amber-700/50",
                        blue: "bg-blue-700/30 hover:bg-blue-700/50 text-white border-blue-700/50",
                        pink: "bg-pink-700/30 hover:bg-pink-700/50 text-white border-pink-700/50"
                      })}
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
                  <div className="px-4 py-1 text-sm text-gray-500 font-medium">
                    Favorites
                  </div>
                  {favoriteAirports.map((airport, idx) => 
                    renderAirportItem(airport, idx, true, false)
                  )}
                </div>
              )}
              
              {/* Search results or recent airports */}
              <div className="py-2">
                <div className="px-4 py-1 text-sm text-gray-500 font-medium">
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
        <p className={getThemeClasses({
          base: "mt-1.5 text-sm",
          default: "text-red-500",
          blue: "text-red-400",
          pink: "text-red-400"
        })}>
          {error}
        </p>
      )}
    </div>
  );
}

export { EnhancedLocationAutocomplete };
export default EnhancedLocationAutocomplete; 
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Users, Plane, Search, X, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { apiClient } from '../utils/api-client';

// Airport interface
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  is_private?: boolean;
}

// Elite field props - Fixed for Next.js client component serialization
interface EliteFieldProps {
  label: string;
  value: string;
  placeholder: string;
  icon: React.ComponentType<any>;
  type?: 'text' | 'search' | 'date' | 'time' | 'number';
  error?: string;
  className?: string;
  searchResults?: Airport[];
  variant?: 'departure' | 'arrival' | 'default';
  onValueChange?: (value: string) => void;
  onSearchTrigger?: (query: string) => Promise<void>;
}

// Elite iOS field component with perfect positioning
export function EliteField({
  label,
  value,
  placeholder,
  icon: Icon,
  type = 'text',
  error,
  className,
  searchResults = [],
  onValueChange,
  onSearchTrigger,
  variant = 'default'
}: EliteFieldProps) {
  const { getThemedTextClasses } = useGdyupTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle value changes
  const handleChange = useCallback((newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
  }, [onValueChange]);

  // Handle search with real database
  const handleSearch = useCallback(async (query: string) => {
    handleChange(query);
    
    if (onSearchTrigger && query.length >= 2) {
      setIsSearching(true);
      try {
        await onSearchTrigger(query);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setShowResults(false);
    }
  }, [handleChange, onSearchTrigger]);

  // Select result
  const selectResult = useCallback((airport: Airport) => {
    const formatted = `${airport.city} (${airport.code})`;
    handleChange(formatted);
    setShowResults(false);
    inputRef.current?.blur();
  }, [handleChange]);

  // iOS-optimized field styling
  const fieldClasses = cn(
    'relative w-full mb-6', // Extra bottom margin for iOS spacing
    className
  );

  const inputClasses = cn(
    // Base styling for iOS
    'w-full h-14 px-4 pl-12 pr-4 rounded-xl',
    'border-2 border-transparent',
    'bg-white/5 backdrop-blur-xl',
    'text-white text-base font-medium',
    'placeholder:text-white/50 placeholder:font-normal',
    'transition-all duration-300 ease-out',
    'focus:outline-none focus:ring-0',
    'active:scale-[0.98]',
    
    // iOS-specific optimizations
    '-webkit-appearance-none appearance-none',
    'touch-manipulation',
    'will-change-transform',
    
    // Focus state
    isFocused && [
      'bg-white/10',
      'border-white/20',
      'shadow-lg shadow-black/20',
      'transform scale-[1.02]'
    ],
    
    // Error state
    error && [
      'border-red-500/50',
      'bg-red-500/10'
    ],
    
    // Variant-specific styling
    variant === 'departure' && 'border-l-4 border-l-green-500/60',
    variant === 'arrival' && 'border-l-4 border-l-blue-500/60'
  );

  return (
    <div className={fieldClasses}>
      {/* Elite label */}
      <motion.label
        className={cn(
          'block text-sm font-semibold mb-2 text-white/90',
          'tracking-wide uppercase'
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>

      {/* Input container */}
      <div className="relative">
        {/* Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Icon 
            size={20} 
            className={cn(
              'transition-colors duration-200',
              isFocused ? 'text-white' : 'text-white/60'
            )} 
          />
        </div>

        {/* Input field */}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => type === 'search' ? handleSearch(e.target.value) : handleChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding results to allow selection
            setTimeout(() => setShowResults(false), 150);
          }}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />

        {/* Search indicator */}
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {/* Clear button */}
        {value && !isSearching && (
          <button
            type="button"
            onClick={() => {
              handleChange('');
              setShowResults(false);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {showResults && searchResults.length > 0 && (
          <motion.div
            ref={resultsRef}
            className={cn(
              'absolute top-full left-0 right-0 z-50 mt-2',
              'bg-black/95 backdrop-blur-xl rounded-xl border border-white/10',
              'max-h-64 overflow-y-auto',
              'shadow-2xl shadow-black/50'
            )}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {searchResults.slice(0, 8).map((airport, index) => (
              <motion.button
                key={airport.code}
                type="button"
                onClick={() => selectResult(airport)}
                className={cn(
                  'w-full px-4 py-3 text-left',
                  'hover:bg-white/10 active:bg-white/20',
                  'transition-colors duration-150',
                  'first:rounded-t-xl last:rounded-b-xl',
                  'border-b border-white/5 last:border-b-0'
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-white/60 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">
                      {airport.city} ({airport.code})
                    </div>
                    <div className="text-white/60 text-xs truncate">
                      {airport.name}, {airport.country}
                    </div>
                  </div>
                  {airport.is_private && (
                    <div className="text-xs text-yellow-400 font-medium bg-yellow-400/20 px-2 py-1 rounded-md">
                      Private
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mt-2 text-red-400 text-sm font-medium"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Elite departure/arrival field pair component - Fixed serialization
interface EliteLocationFieldsProps {
  departureValue: string;
  arrivalValue: string;
  departureError?: string;
  arrivalError?: string;
  className?: string;
  onDepartureValueChange?: (value: string) => void;
  onArrivalValueChange?: (value: string) => void;
}

export function EliteLocationFields({
  departureValue,
  arrivalValue,
  departureError,
  arrivalError,
  className,
  onDepartureValueChange,
  onArrivalValueChange
}: EliteLocationFieldsProps) {
  const [departureResults, setDepartureResults] = useState<Airport[]>([]);
  const [arrivalResults, setArrivalResults] = useState<Airport[]>([]);

  // Search airports function
  const searchAirports = useCallback(async (query: string): Promise<Airport[]> => {
    try {
      const results = await apiClient.searchAirports(query, 20);
      return results || [];
    } catch (error) {
      console.error('Airport search failed:', error);
      return [];
    }
  }, []);

  const handleDepartureSearch = useCallback(async (query: string) => {
    const results = await searchAirports(query);
    setDepartureResults(results);
  }, [searchAirports]);

  const handleArrivalSearch = useCallback(async (query: string) => {
    const results = await searchAirports(query);
    setArrivalResults(results);
  }, [searchAirports]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Departure Field */}
      <EliteField
        label="Departure"
        value={departureValue}
        placeholder="Where are you departing from?"
        icon={Plane}
        type="search"
        error={departureError}
        variant="departure"
        searchResults={departureResults}
        onValueChange={onDepartureValueChange}
        onSearchTrigger={handleDepartureSearch}
      />

      {/* Flight direction indicator */}
      <div className="flex justify-center">
        <motion.div
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          <Plane size={16} className="text-white/60" />
        </motion.div>
      </div>

      {/* Arrival Field */}
      <EliteField
        label="Arrival"
        value={arrivalValue}
        placeholder="Where are you going?"
        icon={MapPin}
        type="search"
        error={arrivalError}
        variant="arrival"
        searchResults={arrivalResults}
        onValueChange={onArrivalValueChange}
        onSearchTrigger={handleArrivalSearch}
      />
    </div>
  );
}

// Elite date/time picker field
interface EliteDateTimeFieldProps {
  label: string;
  value: string;
  type: 'date' | 'time';
  error?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function EliteDateTimeField({
  label,
  value,
  type,
  error,
  className,
  onValueChange
}: EliteDateTimeFieldProps) {
  return (
    <EliteField
      label={label}
      value={value}
      placeholder={type === 'date' ? 'Select date' : 'Select time'}
      icon={type === 'date' ? Calendar : Clock}
      type={type}
      error={error}
      className={className}
      onValueChange={onValueChange}
    />
  );
}

// Elite passenger count field
interface ElitePassengerFieldProps {
  value: number;
  min?: number;
  max?: number;
  error?: string;
  className?: string;
  onValueChange?: (value: number) => void;
}

export function ElitePassengerField({
  value,
  min = 1,
  max = 20,
  error,
  className,
  onValueChange
}: ElitePassengerFieldProps) {
  const handleChange = useCallback((val: string) => {
    const num = parseInt(val) || min;
    const finalValue = Math.min(Math.max(num, min), max);
    if (onValueChange) {
      onValueChange(finalValue);
    }
  }, [min, max, onValueChange]);

  const handleQuickSelect = useCallback((count: number) => {
    if (onValueChange) {
      onValueChange(count);
    }
  }, [onValueChange]);

  return (
    <div className={cn('relative', className)}>
      <EliteField
        label="Passengers"
        value={value.toString()}
        placeholder="Number of passengers"
        icon={Users}
        type="number"
        error={error}
        onValueChange={handleChange}
      />
      
      {/* Quick passenger buttons */}
      <div className="flex gap-2 mt-2">
        {[1, 2, 4, 6, 8].map((count) => (
          <motion.button
            key={count}
            type="button"
            onClick={() => handleQuickSelect(count)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium',
              'border border-white/20 bg-white/5',
              'hover:bg-white/10 active:scale-95',
              'transition-all duration-200',
              value === count && 'bg-white/20 border-white/40'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {count}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default EliteField; 
'use client';

import { useState } from 'react';
import LocationAutocompleteClient, { Airport } from './LocationAutocompleteClient';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

export type { Airport };

export default function LocationAutocomplete(props: {
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
  // This wrapper isolates the client component with the function props
  // from the server component boundaries
  return <LocationAutocompleteClient {...props} />;
} 
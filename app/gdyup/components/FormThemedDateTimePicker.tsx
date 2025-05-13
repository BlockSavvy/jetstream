'use client';

import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { ThemedDateTimePicker } from './ThemedDateTimePicker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

interface FormThemedDateTimePickerProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FormThemedDateTimePicker({
  name,
  label,
  description,
  placeholder,
  className,
  disabled = false,
}: FormThemedDateTimePickerProps) {
  const form = useFormContext();
  const { getThemedTextClasses } = useGdyupTheme();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          {label && (
            <FormLabel className={cn("text-sm font-medium", getThemedTextClasses())}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <ThemedDateTimePicker
              date={field.value}
              setDate={field.onChange}
              placeholder={placeholder}
              disabled={disabled || field.disabled}
              className={cn("w-full mt-1", className)}
            />
          </FormControl>
          {description && (
            <FormDescription className={getThemedTextClasses('muted')}>
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 
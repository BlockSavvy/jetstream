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
  const { theme, getThemeClasses } = useGdyupTheme();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          {label && (
            <FormLabel className={getThemeClasses({
              base: "text-white text-sm font-medium",
              default: "opacity-90",
              blue: "opacity-90",
              pink: "opacity-90"
            })}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <ThemedDateTimePicker
              date={field.value}
              setDate={field.onChange}
              placeholder={placeholder}
              disabled={disabled || field.disabled}
              className={cn(className, getThemeClasses({
                base: "w-full mt-1",
                default: "",
                blue: "",
                pink: ""
              }))}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 
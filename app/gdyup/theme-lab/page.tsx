'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import GdyupThemeSwitcher from '../components/GdyupThemeSwitcher';
import { ThemedIcon } from '../components/core';
import { PlaneTakeoff, CreditCard, QrCode } from 'lucide-react';
import { ThemedDateTimePicker } from '../components/ThemedDateTimePicker';
import { cn } from '@/lib/utils';

export default function ThemeLabPage() {
  const {
    getThemedButtonClasses,
    getThemedTextClasses,
    getThemedBackgroundClasses,
  } = useGdyupTheme();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  return (
    <div className="min-h-[100dvh] gdyup-app flex flex-col items-center py-10 space-y-8 px-4">
      <h1 className={cn('text-3xl font-bold', getThemedTextClasses())}>GDY·UP Theme-Lab</h1>

      <div className="flex items-center gap-4">
        <GdyupThemeSwitcher showLabels={false} />
        <span className={getThemedTextClasses('muted')}>Toggle themes to preview UI</span>
      </div>

      <section className="w-full max-w-lg grid gap-6">
        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button className={getThemedButtonClasses('primary')}>
            <ThemedIcon icon={PlaneTakeoff} size={18} className="mr-2" /> Primary
          </Button>
          <Button className={getThemedButtonClasses('secondary')}>Secondary</Button>
          <Button className={getThemedButtonClasses('outline')}>Outline</Button>
          <Button className={getThemedButtonClasses('ghost')}>Ghost</Button>
          <Button className={getThemedButtonClasses('destructive')}>Destructive</Button>
        </div>

        {/* Card preview */}
        <Card className={getThemedBackgroundClasses('card')}>
          <CardHeader>
            <CardTitle className={getThemedTextClasses()}>Upcoming Flight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className={getThemedTextClasses('muted')}>
              GDY-123 • Miami ✈ New York
            </p>
            <ThemedDateTimePicker date={selectedDate} setDate={setSelectedDate} />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button className={getThemedButtonClasses('primary')}>
              <ThemedIcon icon={CreditCard} size={18} className="mr-2" /> Pay Now
            </Button>
          </CardFooter>
        </Card>

        {/* QR Preview */}
        <div className="flex justify-center">
          <div
            className={cn(
              'p-6 rounded-lg flex flex-col items-center gap-4',
              getThemedBackgroundClasses('card')
            )}
          >
            <ThemedIcon 
              icon={QrCode} 
              size={64} 
              className="text-gdyup-primary" 
            />
            <p className={getThemedTextClasses('muted')}>Boarding Pass QR Placeholder</p>
          </div>
        </div>
      </section>
    </div>
  );
} 
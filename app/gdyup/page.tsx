'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Share, Search, Plane, Bitcoin, Sparkles, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClientContentWrapper } from './components/ClientContentWrapper';
import { useGdyupTheme } from './hooks/useGdyupTheme';

export default function GdyupPage() {
  return (
    <ClientContentWrapper>
      <PageContent />
    </ClientContentWrapper>
  );
}

function PageContent() {
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  return (
    <div className="container mx-auto px-4 md:px-6 pb-16 flex-1">
      {/* Hero Section */}
      <section className="py-8 md:py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-2">
            <div className="text-gdyup-primary drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]">
              GDY UP & SPLIT
            </div>
            <div className="text-gdyup-text">Private Jet Costs</div>
          </h1>
          <p className="text-xl sm:text-xl md:text-2xl text-gdyup-text mb-6 max-w-2xl mx-auto">
            List empty seats, connect with verified travelers, and recover up to 70% of your flight expenses.
          </p>
          
          {/* Two-sided marketplace CTAs */}
          <div className="flex flex-col gap-6 mb-8">
            <div className={cn(
              getThemedBackgroundClasses('card'),
              "shadow-lg rounded-xl p-5 border-l-4 border-gdyup-primary"
            )}>
              <h2 className="text-2xl font-bold text-gdyup-text mb-3">Have a booked private flight?</h2>
              <p className="text-lg text-gdyup-text-medium mb-4">List your empty seats and recover up to 70% of your expenses</p>
              <Button asChild size="lg" className={cn(
                getThemedButtonClasses('primary'),
                "w-full text-lg border-0 px-8 py-6 h-auto font-bold shadow-lg"
              )}>
                <Link href="/gdyup/direct-test" className="flex items-center justify-center">
                  <Share className="w-5 h-5 mr-2" />
                  List Your Seats
                </Link>
              </Button>
            </div>
            
            <div className={cn(
              getThemedBackgroundClasses('card'),
              "shadow-lg rounded-xl p-5 border-l-4 border-gdyup-primary"
            )}>
              <h2 className="text-2xl font-bold text-gdyup-text mb-3">Looking for private jet seats?</h2>
              <p className="text-lg text-gdyup-text-medium mb-4">Browse available flights at a fraction of the charter cost</p>
              <Button asChild size="lg" className={cn(
                getThemedButtonClasses('primary'),
                "w-full text-lg border-0 px-8 py-6 h-auto font-bold shadow-lg"
              )}>
                <Link href="/gdyup/test" className="flex items-center justify-center">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Flights
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Payment options badge */}
          <div className="flex items-center justify-center gap-3 text-base text-gdyup-text mt-4">
            <span className="text-gdyup-text">Accepts:</span>
            <div className="flex items-center gap-1">
              <CreditCard className="w-5 h-5 text-gdyup-text" />
              <span className="font-medium">Cards</span>
            </div>
            <div className="flex items-center gap-1">
              <Bitcoin className="w-5 h-5 text-gdyup-primary" />
              <span className="font-medium">Bitcoin</span>
            </div>
            <span>&</span>
            <span className="font-medium">Crypto</span>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-10 md:py-16 text-gdyup-text">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gdyup-primary drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]">Ultra-Simple P2P Jet Sharing</h2>
          <p className="text-xl text-gdyup-text max-w-2xl mx-auto">
            Already booked a private jet? Share empty seats and recoup your costs instantly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Steps */}
          <div className={cn(
            getThemedBackgroundClasses('card'),
            "p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gdyup-border transform hover:-translate-y-1 hover:border-gdyup-primary duration-300"
          )}>
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-gdyup-primary shadow-[0_0_20px_rgba(var(--gdyup-primary-rgb),0.3)]">
              <Plane className="w-7 h-7 text-gdyup-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-gdyup-text">List Your Flight</h3>
            <p className="text-base text-gdyup-text-medium text-center">
              Select available seats in 30 seconds. Set your price and watch your flight expenses drop.
            </p>
          </div>
          
          <div className={cn(
            getThemedBackgroundClasses('card'),
            "p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gdyup-border transform hover:-translate-y-1 hover:border-gdyup-primary duration-300"
          )}>
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-gdyup-primary shadow-[0_0_20px_rgba(var(--gdyup-primary-rgb),0.3)]">
              <Sparkles className="w-7 h-7 text-gdyup-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-gdyup-text">AI Concierge</h3>
            <p className="text-base text-gdyup-text-medium text-center">
              Our AI concierge finds perfect matches for your flight and handles all arrangements seamlessly.
            </p>
          </div>
          
          <div className={cn(
            getThemedBackgroundClasses('card'),
            "p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gdyup-border transform hover:-translate-y-1 hover:border-gdyup-primary duration-300"
          )}>
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-gdyup-primary shadow-[0_0_20px_rgba(var(--gdyup-primary-rgb),0.3)]">
              <Bitcoin className="w-7 h-7 text-gdyup-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-gdyup-text">Get Paid Directly</h3>
            <p className="text-base text-gdyup-text-medium text-center">
              Receive payments directly via credit card, Bitcoin or other crypto. We only take a 7.5% fee.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
} 
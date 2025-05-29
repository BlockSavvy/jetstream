'use client';

import React from 'react';
import Link from 'next/link';
import { Share, Search, Plane, Bitcoin, Sparkles, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from './hooks/useGdyupTheme';
import GdyupClientLayout from './components/GdyupClientLayout';

export default function GdyupPage() {
  return (
    <GdyupClientLayout>
      <PageContent />
    </GdyupClientLayout>
  );
}

function PageContent() {
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  return (
    <div className="main-content">
      {/* Hero Section */}
      <section className="px-6 py-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
            <div className="gdyup-title mb-2">
              GDY UP & SPLIT
            </div>
            <div className={getThemedTextClasses()}>Private Jet Costs</div>
          </h1>
          <p className={cn("text-xl sm:text-2xl mb-8 max-w-2xl mx-auto", getThemedTextClasses('secondary'))}>
            List empty seats, connect with verified travelers, and recover up to 70% of your flight expenses.
          </p>
          
          {/* Two-sided marketplace CTAs */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="elite-card p-6 border-l-4 border-gdyup-primary">
              <h2 className={cn("text-2xl font-bold mb-3", getThemedTextClasses())}>
                Have a booked private flight?
              </h2>
              <p className={cn("text-lg mb-4", getThemedTextClasses('secondary'))}>
                List your empty seats and recover up to 70% of your expenses
              </p>
              <Link href="/gdyup/list" className="block">
                <button className="btn-primary-elite w-full flex items-center justify-center gap-2">
                  <Share size={20} />
                  List Your Seats
                </button>
              </Link>
            </div>
            
            <div className="elite-card p-6 border-l-4 border-gdyup-primary">
              <h2 className={cn("text-2xl font-bold mb-3", getThemedTextClasses())}>
                Looking for private jet seats?
              </h2>
              <p className={cn("text-lg mb-4", getThemedTextClasses('secondary'))}>
                Browse available flights at a fraction of the charter cost
              </p>
              <Link href="/gdyup/browse" className="block">
                <button className="btn-primary-elite w-full flex items-center justify-center gap-2">
                  <Search size={20} />
                  Browse Flights
                </button>
              </Link>
            </div>
          </div>
          
          {/* Payment options badge */}
          <div className="flex items-center justify-center gap-4 text-base">
            <span className={getThemedTextClasses()}>Accepts:</span>
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-gdyup-text-subtle" />
              <span className="font-medium">Cards</span>
            </div>
            <div className="flex items-center gap-2">
              <Bitcoin size={20} className="text-gdyup-primary" />
              <span className="font-medium">Bitcoin</span>
            </div>
            <span>&</span>
            <span className="font-medium">Crypto</span>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="gdyup-title text-3xl md:text-4xl font-bold mb-4">
            Ultra-Simple P2P Jet Sharing
          </h2>
          <p className={cn("text-xl max-w-2xl mx-auto", getThemedTextClasses('secondary'))}>
            Already booked a private jet? Share empty seats and recoup your costs instantly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Steps */}
          <div className="elite-card p-6 text-center">
            <div className="w-16 h-16 bg-gdyup-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Plane size={28} className="text-gdyup-button-text" />
            </div>
            <h3 className={cn("text-xl font-bold mb-3", getThemedTextClasses())}>
              List Your Flight
            </h3>
            <p className={cn("text-base", getThemedTextClasses('secondary'))}>
              Select available seats in 30 seconds. Set your price and watch your flight expenses drop.
            </p>
          </div>
          
          <div className="elite-card p-6 text-center">
            <div className="w-16 h-16 bg-gdyup-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles size={28} className="text-gdyup-button-text" />
            </div>
            <h3 className={cn("text-xl font-bold mb-3", getThemedTextClasses())}>
              AI Concierge
            </h3>
            <p className={cn("text-base", getThemedTextClasses('secondary'))}>
              Our AI concierge finds perfect matches for your flight and handles all arrangements seamlessly.
            </p>
          </div>
          
          <div className="elite-card p-6 text-center">
            <div className="w-16 h-16 bg-gdyup-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bitcoin size={28} className="text-gdyup-button-text" />
            </div>
            <h3 className={cn("text-xl font-bold mb-3", getThemedTextClasses())}>
              Get Paid Directly
            </h3>
            <p className={cn("text-base", getThemedTextClasses('secondary'))}>
              Receive payments directly via credit card, Bitcoin or other crypto. We only take a 7.5% fee.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
} 
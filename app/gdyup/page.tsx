'use client';

import { useEffect, useState } from 'react';
import { ThemeDebugPanel } from './utils/theme-debug';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Share, Search, Plane, Banknote, Clock, CheckCircle, Bitcoin, Sparkles, CreditCard } from 'lucide-react';
import Image from 'next/image';

export default function GdyupPage() {
  const [isDevMode, setIsDevMode] = useState(false);
  
  useEffect(() => {
    // Check if we're in dev mode
    setIsDevMode(process.env.NODE_ENV === 'development');
  }, []);
  
  return (
    <div className="min-h-screen bg-[var(--gdyup-background)]">
      <div className="container mx-auto px-4 md:px-6 pb-16">
        {/* Hero Section */}
        <section className="py-8 md:py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-2">
              <div className="text-[var(--gdyup-primary)] drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]">
                GDY UP & SPLIT
              </div>
              <div className="text-[var(--gdyup-text)]">Private Jet Costs</div>
            </h1>
            <p className="text-xl sm:text-xl md:text-2xl text-[var(--gdyup-text)] mb-6 max-w-2xl mx-auto">
              List empty seats, connect with verified travelers, and recover up to 70% of your flight expenses.
            </p>
            
            {/* Two-sided marketplace CTAs */}
            <div className="flex flex-col gap-6 mb-8">
              {/* List seats CTA (emphasized) */}
              <div className="bg-[var(--gdyup-card-bg)] shadow-lg rounded-xl p-5 border-l-4 border-[var(--gdyup-primary)]">
                <h2 className="text-2xl font-bold text-[var(--gdyup-text)] mb-3">Have a booked private flight?</h2>
                <p className="text-lg text-[var(--gdyup-text-medium)] mb-4">List your empty seats and recover up to 70% of your expenses</p>
                <Button asChild size="lg" className="w-full text-lg text-black border-0 px-8 py-6 h-auto font-bold shadow-lg gdyup-primary-button">
                  <Link href="/gdyup/offer" className="flex items-center justify-center">
                    <Share className="w-5 h-5 mr-2" />
                    List Your Seats
                  </Link>
                </Button>
              </div>
              
              {/* Find seats CTA */}
              <div className="bg-[var(--gdyup-card-bg)] shadow-lg rounded-xl p-5 border-l-4 border-[var(--gdyup-primary)]">
                <h2 className="text-2xl font-bold text-[var(--gdyup-text)] mb-3">Looking for private jet seats?</h2>
                <p className="text-lg text-[var(--gdyup-text-medium)] mb-4">Browse available flights at a fraction of the charter cost</p>
                <Button asChild size="lg" className="w-full text-lg text-black border-0 px-8 py-6 h-auto font-bold shadow-lg gdyup-primary-button">
                  <Link href="/gdyup/listings" className="flex items-center justify-center">
                    <Search className="w-5 h-5 mr-2" />
                    Browse Flights
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Payment options badge */}
            <div className="flex items-center justify-center gap-3 text-base text-[var(--gdyup-text)] mt-4">
              <span className="text-[var(--gdyup-text)]">Accepts:</span>
              <div className="flex items-center gap-1">
                <CreditCard className="w-5 h-5 text-[var(--gdyup-text)]" />
                <span className="font-medium">Cards</span>
              </div>
              <div className="flex items-center gap-1">
                <Bitcoin className="w-5 h-5 text-[var(--gdyup-primary)]" />
                <span className="font-medium">Bitcoin</span>
              </div>
              <span>&</span>
              <span className="font-medium">Crypto</span>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-10 md:py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--gdyup-primary)] drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]">Ultra-Simple P2P Jet Sharing</h2>
            <p className="text-xl text-[var(--gdyup-text)] max-w-2xl mx-auto">
              Already booked a private jet? Share empty seats and recoup your costs instantly.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="bg-[var(--gdyup-card-bg)] p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-800 transform hover:-translate-y-1 hover:border-[var(--gdyup-primary)] duration-300">
              <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-[var(--gdyup-primary)] shadow-[0_0_20px_rgba(var(--gdyup-primary-rgb),0.3)]">
                <Plane className="w-7 h-7 text-[var(--gdyup-primary)]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center text-[var(--gdyup-text)]">List Your Flight</h3>
              <p className="text-base text-[var(--gdyup-text-medium)] text-center">
                Select available seats in 30 seconds. Set your price and watch your flight expenses drop.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-[var(--gdyup-card-bg)] p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-800 transform hover:-translate-y-1 hover:border-[var(--gdyup-primary)] duration-300">
              <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-[var(--gdyup-primary)] shadow-[0_0_20px_rgba(var(--gdyup-primary-rgb),0.3)]">
                <Sparkles className="w-7 h-7 text-[var(--gdyup-primary)]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center text-[var(--gdyup-text)]">AI Concierge</h3>
              <p className="text-base text-[var(--gdyup-text-medium)] text-center">
                Our AI concierge finds perfect matches for your flight and handles all arrangements seamlessly.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-[var(--gdyup-card-bg)] p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-800 transform hover:-translate-y-1 hover:border-[var(--gdyup-primary)] duration-300">
              <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto border-2 border-[var(--gdyup-primary)] shadow-[0_0_20px_rgba(var(--gdyup-primary-rgb),0.3)]">
                <Bitcoin className="w-7 h-7 text-[var(--gdyup-primary)]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center text-[var(--gdyup-text)]">Get Paid Directly</h3>
              <p className="text-base text-[var(--gdyup-text-medium)] text-center">
                Receive payments directly via credit card, Bitcoin or other crypto. We only take a 7.5% fee.
              </p>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-10 md:py-16 bg-[var(--gdyup-card-bg)] rounded-2xl my-10 border border-gray-800 shadow-xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--gdyup-text)]">Why Use <span className="text-[var(--gdyup-primary)] drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]">GDY UP</span></h2>
            <p className="text-xl text-[var(--gdyup-text-medium)] mb-8 max-w-2xl mx-auto">
              The fastest way to monetize empty seats on your private jet
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[var(--gdyup-primary)] shadow-[0_0_15px_rgba(var(--gdyup-primary-rgb),0.4)]">
                <Banknote className="w-6 h-6 text-[var(--gdyup-primary)]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-[var(--gdyup-text)]">70%+ Cost Recovery</h3>
              <p className="text-base text-[var(--gdyup-text-medium)] text-center">
                Fill more seats and recover the majority of your flight expenses
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[var(--gdyup-primary)] shadow-[0_0_15px_rgba(var(--gdyup-primary-rgb),0.4)]">
                <Clock className="w-6 h-6 text-[var(--gdyup-primary)]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-[var(--gdyup-text)]">30-Second Listing</h3>
              <p className="text-base text-[var(--gdyup-text-medium)] text-center">
                Our touch-optimized process gets your seats listed in seconds flat
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[var(--gdyup-primary)] shadow-[0_0_15px_rgba(var(--gdyup-primary-rgb),0.4)]">
                <Bitcoin className="w-6 h-6 text-[var(--gdyup-primary)]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-[var(--gdyup-text)]">Bitcoin Payments</h3>
              <p className="text-base text-[var(--gdyup-text-medium)] text-center">
                Accept Bitcoin and other cryptocurrencies directly with zero delay
              </p>
            </div>
            
            {/* Benefit 4 */}
            <div className="flex flex-col items-center transition-transform hover:-translate-y-1 duration-300">
              <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center mb-3 border-2 border-[var(--gdyup-primary)] shadow-[0_0_15px_rgba(var(--gdyup-primary-rgb),0.4)]">
                <Sparkles className="w-6 h-6 text-[var(--gdyup-primary)]" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-[var(--gdyup-text)]">AI Concierge</h3>
              <p className="text-base text-[var(--gdyup-text-medium)] text-center">
                Intelligent assistance to find matches and coordinate premium services
              </p>
            </div>
          </div>
        </section>
        
        {/* Theme Demo Section (only in dev mode) */}
        {isDevMode && (
          <section className="py-6 my-6 border border-gray-700 rounded-lg bg-[var(--gdyup-card-bg)] hidden md:block">
            <div className="px-6">
              <h2 className="text-xl font-semibold mb-2 text-[var(--gdyup-primary)]">Theme Preview</h2>
              <p className="text-[var(--gdyup-text-medium)] mb-4 text-sm">
                Current theme variables and styling (development only)
              </p>
              
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded flex flex-col items-center justify-center aspect-square bg-[var(--gdyup-primary)]">
                  <span className="font-bold text-black text-xs">Primary</span>
                </div>
                <div className="p-3 rounded flex flex-col items-center justify-center aspect-square bg-[var(--gdyup-secondary)]">
                  <span className="font-bold text-black text-xs">Secondary</span>
                </div>
                <div className="p-3 rounded flex flex-col items-center justify-center aspect-square bg-[var(--gdyup-button-bg)]">
                  <span className="font-bold text-black text-xs">Button</span>
                </div>
                <div className="p-3 rounded flex flex-col items-center justify-center aspect-square bg-[var(--gdyup-card-bg)]">
                  <span className="font-bold text-[var(--gdyup-text)] text-xs">Card BG</span>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Dual CTA Section */}
        <section className="py-10 md:py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--gdyup-text)]">Join the <span className="text-[var(--gdyup-primary)] drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]">GDY UP</span> Community</h2>
            <p className="text-xl text-[var(--gdyup-text-medium)] mb-8 max-w-2xl mx-auto">
              Whether you're offering empty seats or looking to fly private at a fraction of the cost, GDY UP connects you.
            </p>
            
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[var(--gdyup-card-bg)] shadow-lg p-5 rounded-xl border-l-4 border-[var(--gdyup-primary)]">
                <h3 className="text-xl font-bold mb-3 text-[var(--gdyup-text)]">For Jet Owners</h3>
                <p className="text-base text-[var(--gdyup-text-medium)] mb-4">Fill your empty seats and recover up to 70% of your costs</p>
                <Button asChild size="lg" className="w-full text-lg text-black border-0 px-6 py-4 h-auto font-bold shadow-lg gdyup-primary-button">
                  <Link href="/gdyup/offer" className="flex items-center justify-center">
                    <Share className="w-5 h-5 mr-2" />
                    List Your Seats
                  </Link>
                </Button>
              </div>
              
              <div className="bg-[var(--gdyup-card-bg)] shadow-lg p-5 rounded-xl border-l-4 border-[var(--gdyup-primary)]">
                <h3 className="text-xl font-bold mb-3 text-[var(--gdyup-text)]">For Travelers</h3>
                <p className="text-base text-[var(--gdyup-text-medium)] mb-4">Access private flights at a fraction of the typical cost</p>
                <Button asChild size="lg" className="w-full text-lg text-black border-0 px-6 py-4 h-auto font-bold shadow-lg gdyup-primary-button">
                  <Link href="/gdyup/listings" className="flex items-center justify-center">
                    <Search className="w-5 h-5 mr-2" />
                    Browse Flights
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Show debug panel in development */}
      {isDevMode && <ThemeDebugPanel />}
    </div>
  );
} 
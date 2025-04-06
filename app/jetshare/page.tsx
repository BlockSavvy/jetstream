import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Share, Search, Plane, Banknote, Clock, CheckCircle, Bitcoin, Sparkles, CreditCard, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function JetSharePage() {
  return (
    <div className="container mx-auto px-4 md:px-6 pb-16">
      {/* Hero Section */}
      <section className="py-8 md:py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500">
              Instantly Share & Offset
            </span>
            <span className="block text-gray-900 dark:text-white">Your Private Jet Costs</span>
          </h1>
          <p className="text-xl sm:text-xl md:text-2xl text-gray-800 dark:text-gray-200 mb-6 max-w-2xl mx-auto">
            List empty seats, connect with verified travelers, and recover up to 70% of your flight expenses.
          </p>
          
          {/* Two-sided marketplace CTAs */}
          <div className="flex flex-col gap-8 mb-8">
            {/* List seats CTA (emphasized) */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Have a booked private flight?</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">List your empty seats and recover up to 70% of your expenses</p>
              <Button asChild size="lg" className="w-full text-lg bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 h-auto">
                <Link href="/jetshare/offer">
                  <Share className="w-5 h-5 mr-2" />
                  List Your Seats
                </Link>
              </Button>
            </div>
            
            {/* Connecting arrow for mobile */}
            <div className="flex justify-center items-center">
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-700"></div>
            </div>
            
            {/* Find seats CTA */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Looking for private jet seats?</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">Browse available flights at a fraction of the charter cost</p>
              <Button asChild size="lg" variant="outline" className="w-full text-lg px-8 py-6 h-auto border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-800 dark:text-amber-400 dark:border-amber-400">
                <Link href="/jetshare/listings">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Flights
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Payment options badge */}
          <div className="flex items-center justify-center gap-3 text-base text-gray-700 dark:text-gray-300">
            <span>Accepts:</span>
            <div className="flex items-center gap-1">
              <CreditCard className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="font-medium">Cards</span>
            </div>
            <div className="flex items-center gap-1">
              <Bitcoin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
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
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">Ultra-Simple P2P Jet Sharing</h2>
          <p className="text-xl text-gray-800 dark:text-gray-200 max-w-2xl mx-auto">
            Already booked a private jet? Share empty seats and recoup your costs instantly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Step 1 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto">
              <Plane className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-gray-900 dark:text-white">List Your Flight</h3>
            <p className="text-base text-gray-700 dark:text-gray-300 text-center">
              Select available seats in 30 seconds. Set your price and watch your flight expenses drop.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-gray-900 dark:text-white">AI Concierge</h3>
            <p className="text-base text-gray-700 dark:text-gray-300 text-center">
              Our AI concierge finds perfect matches for your flight and handles all arrangements seamlessly.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto">
              <Bitcoin className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center text-gray-900 dark:text-white">Get Paid Directly</h3>
            <p className="text-base text-gray-700 dark:text-gray-300 text-center">
              Receive payments directly via credit card, Bitcoin or other crypto. We only take a 7.5% fee.
            </p>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-10 md:py-16 bg-gray-50 dark:bg-gray-900/50 rounded-2xl my-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">Why Use JetShare</h2>
            <p className="text-xl text-gray-800 dark:text-gray-200 max-w-2xl mx-auto">
              The fastest way to monetize empty seats on your private jet
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <Banknote className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-gray-900 dark:text-white">70%+ Cost Recovery</h3>
              <p className="text-base text-gray-700 dark:text-gray-300 text-center">
                Fill more seats and recover the majority of your flight expenses
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-gray-900 dark:text-white">30-Second Listing</h3>
              <p className="text-base text-gray-700 dark:text-gray-300 text-center">
                Our touch-optimized process gets your seats listed in seconds flat
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <Bitcoin className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-gray-900 dark:text-white">Bitcoin Payments</h3>
              <p className="text-base text-gray-700 dark:text-gray-300 text-center">
                Accept Bitcoin and other cryptocurrencies directly with zero delay
              </p>
            </div>
            
            {/* Benefit 4 */}
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-gray-900 dark:text-white">AI Concierge</h3>
              <p className="text-base text-gray-700 dark:text-gray-300 text-center">
                Intelligent assistance to find matches and coordinate premium services
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Dual CTA Section */}
      <section className="py-10 md:py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Join the JetShare Community</h2>
          <p className="text-xl text-gray-800 dark:text-gray-200 mb-8 max-w-2xl mx-auto">
            Whether you're offering empty seats or looking to fly private at a fraction of the cost, JetShare connects you.
          </p>
          
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-gray-800 shadow-md p-5 rounded-xl">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">For Jet Owners</h3>
              <p className="text-base text-gray-700 dark:text-gray-300 mb-4">Fill your empty seats and recover up to 70% of your costs</p>
              <Button asChild size="lg" className="w-full text-lg bg-amber-500 hover:bg-amber-600 text-white px-6 py-4 h-auto">
                <Link href="/jetshare/offer">
                  <Share className="w-5 h-5 mr-2" />
                  List Your Seats
                </Link>
              </Button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">For Travelers</h3>
              <p className="text-base text-gray-700 dark:text-gray-300 mb-4">Access private flights at a fraction of the typical cost</p>
              <Button asChild size="lg" variant="outline" className="w-full text-lg px-6 py-4 h-auto border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-800 dark:text-amber-400 dark:border-amber-400">
                <Link href="/jetshare/listings">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Flights
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 
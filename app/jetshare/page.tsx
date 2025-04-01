import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Share, Search, Plane, Banknote, Clock, CheckCircle } from 'lucide-react';

export default function JetSharePage() {
  return (
    <div className="container mx-auto px-4 md:px-6 pb-16">
      {/* Hero Section */}
      <section className="py-12 md:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-amber-700">
              Instantly Share & Offset
            </span>
            <br />
            Your Private Jet Costs
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Connect with verified travelers to split your flight expenses and make private aviation more accessible.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 h-auto">
              <Link href="/jetshare/offer">
                <Share className="w-5 h-5 mr-2" />
                Offer a Flight Share
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-800">
              <Link href="/jetshare/listings">
                <Search className="w-5 h-5 mr-2" />
                Find Available JetShares
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-12 md:py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How JetShare Works</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Our streamlined process makes sharing your private flight simple, secure, and rewarding.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Step 1 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
              <Plane className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-center">List Your Flight</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Already booked a private jet? Offer a portion of your seats to offset your costs. Define the exact share you want to offer.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
              <CheckCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-center">Get Matched</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Verified users can browse and accept your offer. We handle all verification and booking details for your peace of mind.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
              <Banknote className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-center">Receive Payment</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Once your offer is accepted, receive secure payment directly via Stripe Connect or crypto. We only take a small 7.5% handling fee.
            </p>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl my-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits of JetShare</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience smarter, more cost-efficient private aviation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Banknote className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Reduce Costs</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Offset your private jet expenses by up to 50% or more by sharing your flight.
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Quick & Effortless</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                List your flight in seconds. Our streamlined process saves you time and hassle.
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Verified Users</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Every passenger is thoroughly vetted for a premium, secure experience.
              </p>
            </div>
            
            {/* Benefit 4 */}
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Share className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Secure Payments</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Both fiat and crypto payment options with secure, transparent transactions.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Share Your Flight?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Join the growing community of smart jet travelers who are maximizing their investment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 h-auto">
              <Link href="/jetshare/offer">
                <Share className="w-5 h-5 mr-2" />
                Offer a Flight Share
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-800">
              <Link href="/jetshare/listings">
                <Search className="w-5 h-5 mr-2" />
                Find Available JetShares
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ChevronRight,
  Check,
  Plane,
  Calendar,
  Users,
  Shield,
  Briefcase,
  Heart,
  Lock,
  Star,
  Anchor,
  BirdIcon as Helicopter,
  Car,
  Ticket,
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.png"
            alt="Private Jet"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 z-10"></div>

        <div className="container relative z-20 px-4 md:px-6 mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in">
            Redefine Luxury Travel—Private Jets On-Demand, Simplified.
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto">
            Seamless fractional jet experiences. Personalized flights, effortlessly matched.
          </p>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-6 text-lg rounded-full"
          >
            Reserve Your Flight Now
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 dark:text-white">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mb-6">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Choose your destination and dates</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Select where you want to go and when. Our platform handles the rest, finding the perfect flight options
                for your journey.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">
                Our AI matches you with the perfect jet and fellow travelers
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Our proprietary algorithm finds compatible co-travelers and the ideal aircraft for your specific needs.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mb-6">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Fly effortlessly with unprecedented comfort</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Enjoy a seamless travel experience with premium service, luxurious amenities, and unparalleled
                convenience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jet Owners & Operators Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 dark:text-white">Jet Owners & Operators</h2>
          <h3 className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 text-center mb-16 max-w-3xl mx-auto">
            Maximize Your Jet's Potential—Effortlessly
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30 transition-colors duration-300">
                <svg
                  className="h-10 w-10 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Zero-Hassle Monetization</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Let JetStream manage your aircraft with total transparency and simplicity. We handle the logistics while
                you enjoy the returns.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30 transition-colors duration-300">
                <svg
                  className="h-10 w-10 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Blockchain-Backed Security</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Every transaction secured and verified, visible instantly on-chain. Complete peace of mind with
                immutable record-keeping.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30 transition-colors duration-300">
                <svg
                  className="h-10 w-10 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Optimized Revenue</h3>
              <p className="text-gray-700 dark:text-gray-300">
                AI-driven booking maximizes your jet's earning potential during idle periods. Turn downtime into profit
                with intelligent scheduling.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-6 text-lg rounded-full"
            >
              List Your Jet Today
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Fractional Ownership Made Simple Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 dark:text-white">Fractional Ownership Made Simple</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm flex flex-col items-center text-center h-full transform transition-transform duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/50 flex items-center justify-center mb-6">
                <svg
                  className="h-8 w-8 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Purchase Fractional Tokens</h3>
              <p className="text-gray-700 dark:text-gray-300 flex-grow">
                Acquire digital tokens representing ownership in a specific aircraft. Buy as many or as few as match your
                travel needs and budget.
              </p>
              <div className="w-16 h-1 bg-amber-500 rounded-full mt-6"></div>
              <div className="text-amber-500 font-bold mt-4">01</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm flex flex-col items-center text-center h-full transform transition-transform duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/50 flex items-center justify-center mb-6">
                <svg
                  className="h-8 w-8 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Book Flights Instantly</h3>
              <p className="text-gray-700 dark:text-gray-300 flex-grow">
                Book flights instantly or join shared journeys using your fractional tokens. Our AI matches you with
                compatible travelers and optimal routes.
              </p>
              <div className="w-16 h-1 bg-amber-500 rounded-full mt-6"></div>
              <div className="text-amber-500 font-bold mt-4">02</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm flex flex-col items-center text-center h-full transform transition-transform duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/50 flex items-center justify-center mb-6">
                <svg
                  className="h-8 w-8 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  <path d="M16 2v4" />
                  <path d="M8 22h8" />
                  <path d="M12 16v6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Enjoy Luxury Travel</h3>
              <p className="text-gray-700 dark:text-gray-300 flex-grow">
                Enjoy seamless, flexible luxury travel on-demand. Experience premium service, exclusive amenities, and
                unparalleled comfort on every journey.
              </p>
              <div className="w-16 h-1 bg-amber-500 rounded-full mt-6"></div>
              <div className="text-amber-500 font-bold mt-4">03</div>
            </div>
          </div>

          <div className="text-center">
            <Button className="bg-white hover:bg-gray-100 text-amber-500 border-2 border-amber-500 font-semibold px-8 py-6 text-lg rounded-full">
              Explore Fractional Ownership
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Curated Connections in the Sky Section */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Curated Connections in the Sky</h2>
          <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto">
            Our AI algorithm intelligently pairs travelers based on professional interests, family-friendly
            environments, social preferences, or privacy needs, ensuring every flight enhances your travel experience
            beyond just convenience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="bg-gray-800 p-8 rounded-xl flex flex-col items-center text-center h-full transform transition-all duration-300 hover:bg-gray-700">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <Briefcase className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Business Networking</h3>
              <p className="text-gray-300 flex-grow">
                Connect with industry peers, potential partners, and like-minded professionals during your journey.
              </p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl flex flex-col items-center text-center h-full transform transition-all duration-300 hover:bg-gray-700">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <Heart className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Family & Leisure Friendly</h3>
              <p className="text-gray-300 flex-grow">
                Travel with others who share your family values or leisure interests for a more enjoyable experience.
              </p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl flex flex-col items-center text-center h-full transform transition-all duration-300 hover:bg-gray-700">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <Lock className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Exclusive Privacy</h3>
              <p className="text-gray-300 flex-grow">
                Opt for complete privacy with dedicated cabins or entire aircraft for your most confidential journeys.
              </p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl flex flex-col items-center text-center h-full transform transition-all duration-300 hover:bg-gray-700">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <Star className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Event & Experience Driven</h3>
              <p className="text-gray-300 flex-grow">
                Join flights centered around specific events, from sports championships to exclusive cultural
                experiences.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-6 text-lg rounded-full">
              Discover Intelligent Matching
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits/Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 dark:text-white">Premium Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-sm">
              <div className="flex items-start mb-4">
                <div className="mr-4 bg-amber-500 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">Fractional Seat Ownership</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Enjoy the benefits of private jet ownership without the full cost. Purchase only the seats you need,
                    when you need them.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-sm">
              <div className="flex items-start mb-4">
                <div className="mr-4 bg-amber-500 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">AI-Driven Social & Professional Matching</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our intelligent system pairs you with like-minded travelers, creating opportunities for networking
                    and connections.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-sm">
              <div className="flex items-start mb-4">
                <div className="mr-4 bg-amber-500 p-2 rounded-lg">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">Blockchain Transparency</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    All transactions and ownership records are secured on blockchain, ensuring complete transparency and
                    security.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-sm">
              <div className="flex items-start mb-4">
                <div className="mr-4 bg-amber-500 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">Effortless Booking & Management</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our intuitive platform makes scheduling, managing, and modifying your flights simple and
                    stress-free.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Our Users Say Section */}
      <section id="testimonials" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 dark:text-white">What Our Members Say</h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
            Discover how JetStream is transforming the private aviation experience for our members
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md flex flex-col h-full transform transition-all duration-300 hover:shadow-lg">
              <div className="mb-6">
                <div className="flex text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <div className="relative mb-6">
                  <svg
                    className="absolute top-0 left-0 w-8 h-8 text-gray-200 dark:text-gray-700 transform -translate-x-4 -translate-y-4"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                  >
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                  <p className="text-gray-700 dark:text-gray-300 text-lg italic relative z-10 pl-2">
                    "JetStream has transformed how I travel for business. The matching algorithm is exceptional."
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center">
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-4">
                  <Image
                    src="/placeholder.svg?height=56&width=56"
                    alt="Michael D."
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Michael D.</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CEO, Tech Innovations</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md flex flex-col h-full transform transition-all duration-300 hover:shadow-lg">
              <div className="mb-6">
                <div className="flex text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <div className="relative mb-6">
                  <svg
                    className="absolute top-0 left-0 w-8 h-8 text-gray-200 dark:text-gray-700 transform -translate-x-4 -translate-y-4"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                  >
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                  <p className="text-gray-700 dark:text-gray-300 text-lg italic relative z-10 pl-2">
                    "The fractional ownership model makes perfect sense for my lifestyle and budget."
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center">
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-4">
                  <Image
                    src="/placeholder.svg?height=56&width=56"
                    alt="Jordan R."
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Jordan R.</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Venture Capitalist</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md flex flex-col h-full transform transition-all duration-300 hover:shadow-lg">
              <div className="mb-6">
                <div className="flex text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <div className="relative mb-6">
                  <svg
                    className="absolute top-0 left-0 w-8 h-8 text-gray-200 dark:text-gray-700 transform -translate-x-4 -translate-y-4"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                  >
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                  <p className="text-gray-700 dark:text-gray-300 text-lg italic relative z-10 pl-2">
                    "The AI matching is surprisingly accurate; my flights now double as invaluable networking
                    opportunities."
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center">
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-4">
                  <Image
                    src="/placeholder.svg?height=56&width=56"
                    alt="Sophia L."
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Sophia L.</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Marketing Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beyond the Sky—Coming Soon Section */}
      <section className="py-24 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Beyond the Sky—Coming Soon</h2>
          <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto">
            Soon, JetStream expands to luxury yachts, helicopters, and beyond. Seamlessly integrate your land, sea, and
            air travel experiences into one luxurious, intuitive ecosystem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-xl flex flex-col items-center text-center h-full transform transition-all duration-300 hover:bg-gray-700/50">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <Anchor className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Luxury Yachts</h3>
              <p className="text-gray-300 flex-grow">
                Experience the same fractional ownership model for premium yachts. Navigate the world's most exclusive
                waters with unparalleled elegance.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-xl flex flex-col items-center text-center h-full transform transition-all duration-300 hover:bg-gray-700/50">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <Helicopter className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Helicopters</h3>
              <p className="text-gray-300 flex-grow">
                Unlock urban mobility with our helicopter network. From rooftop to rooftop, experience the ultimate in
                convenient luxury travel.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-xl flex flex-col items-center text-center h-full transform transition-all duration-300 hover:bg-gray-700/50">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <Car className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Luxury Vehicles</h3>
              <p className="text-gray-300 flex-grow">
                Complete your journey with our curated fleet of premium vehicles. Seamless transitions from air to
                ground, maintaining the luxury experience.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-xl flex flex-col items-center text-center h-full transform transition-all duration-300 hover:bg-gray-700/50">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
                <Ticket className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Exclusive Events</h3>
              <p className="text-gray-300 flex-grow">
                Gain priority access to the world's most coveted events and experiences, available exclusively to
                JetStream members.
              </p>
            </div>
          </div>

          <div className="max-w-md mx-auto bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 p-8 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-center">Be first to know—Join our waitlist</h3>
            <form className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold w-full">Join Waitlist</Button>
            </form>
            <p className="text-gray-400 text-sm mt-4 text-center">
              We respect your privacy. Your information will never be shared.
            </p>
          </div>
        </div>
      </section>

      {/* Footer with Newsletter */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-6">JetStream</h2>
              <p className="text-gray-400 mb-6 max-w-md">
                Redefining luxury travel with innovative technology and unparalleled service. Experience the future of
                private aviation.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6">Join Our Exclusive Community</h3>
              <p className="text-gray-400 mb-6">
                Be the first to receive updates on new destinations, exclusive offers, and luxury travel insights.
              </p>
              <form className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
                <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">Subscribe</Button>
              </form>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-16 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} JetStream. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


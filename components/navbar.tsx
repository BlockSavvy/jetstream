"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { UserNav } from "@/components/user-nav"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Determine if we're on the landing page or another page
  const isLandingPage = pathname === "/"
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Determine background color based on page and scroll state
  const headerBgClass = () => {
    if (isLandingPage) {
      return isScrolled ? "bg-gray-900/95 backdrop-blur-sm" : "bg-gray-900/50 backdrop-blur-sm"
    }
    return isScrolled ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b" : "bg-white dark:bg-gray-900 border-b"
  }

  // Text color based on page type
  const textColorClass = isLandingPage ? "text-white" : "text-gray-900 dark:text-white"
  const hoverColorClass = isLandingPage ? "hover:text-amber-400" : "hover:text-amber-600 dark:hover:text-amber-400"

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "py-4" : "py-6"
      } ${headerBgClass()}`}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className={`font-bold text-2xl ${textColorClass}`}>
            JetStream
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isLandingPage && (
              <>
                <Link href="#how-it-works" className={`${textColorClass} ${hoverColorClass} transition-colors`}>
                  How It Works
                </Link>
                <Link href="#features" className={`${textColorClass} ${hoverColorClass} transition-colors`}>
                  Features
                </Link>
                <Link href="#testimonials" className={`${textColorClass} ${hoverColorClass} transition-colors`}>
                  Testimonials
                </Link>
              </>
            )}
            <Link 
              href="/crew" 
              className={`${textColorClass} ${hoverColorClass} transition-colors ${pathname === '/crew' ? 'font-semibold' : ''}`}
            >
              Crew
            </Link>
            <Link 
              href="/flights" 
              className={`${textColorClass} ${hoverColorClass} transition-colors ${pathname === '/flights' ? 'font-semibold' : ''}`}
            >
              Flights
            </Link>
            <Link 
              href="/jetshare" 
              className={`${textColorClass} ${hoverColorClass} transition-colors ${pathname.startsWith('/jetshare') ? 'font-semibold' : ''}`}
            >
              JetShare
            </Link>
            <Link 
              href="/pulse" 
              className={`${textColorClass} ${hoverColorClass} transition-colors ${pathname === '/pulse' ? 'font-semibold' : ''}`}
            >
              Pulse
            </Link>
            <Link 
              href="/dashboard" 
              className={`${textColorClass} ${hoverColorClass} transition-colors ${pathname === '/dashboard' ? 'font-semibold' : ''}`}
            >
              Dashboard
            </Link>
            <UserNav />
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className={`md:hidden ${textColorClass}`} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className={`md:hidden ${isLandingPage ? 'bg-gray-900' : 'bg-white dark:bg-gray-900'} py-4 border-t`}>
          <div className="container px-4 mx-auto flex flex-col space-y-4">
            {isLandingPage && (
              <>
                <Link
                  href="#how-it-works"
                  className={`${textColorClass} ${hoverColorClass} transition-colors py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  href="#features"
                  className={`${textColorClass} ${hoverColorClass} transition-colors py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#testimonials"
                  className={`${textColorClass} ${hoverColorClass} transition-colors py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Testimonials
                </Link>
              </>
            )}
            <Link
              href="/crew"
              className={`${textColorClass} ${hoverColorClass} transition-colors py-2 ${pathname === '/crew' ? 'font-semibold' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Crew
            </Link>
            <Link
              href="/flights"
              className={`${textColorClass} ${hoverColorClass} transition-colors py-2 ${pathname === '/flights' ? 'font-semibold' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Flights
            </Link>
            <Link
              href="/jetshare"
              className={`${textColorClass} ${hoverColorClass} transition-colors py-2 ${pathname.startsWith('/jetshare') ? 'font-semibold' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              JetShare
            </Link>
            <Link
              href="/pulse"
              className={`${textColorClass} ${hoverColorClass} transition-colors py-2 ${pathname === '/pulse' ? 'font-semibold' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pulse
            </Link>
            <Link
              href="/dashboard"
              className={`${textColorClass} ${hoverColorClass} transition-colors py-2 ${pathname === '/dashboard' ? 'font-semibold' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <div className="py-2">
              <UserNav />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}


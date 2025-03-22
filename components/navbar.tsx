"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { UserNav } from "@/components/user-nav"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-gray-900/95 backdrop-blur-sm py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-2xl">
            JetStream
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#how-it-works" className="text-white hover:text-amber-400 transition-colors">
              How It Works
            </Link>
            <Link href="/flights" className="text-white hover:text-amber-400 transition-colors">
              Flights
            </Link>
            <Link href="#features" className="text-white hover:text-amber-400 transition-colors">
              Features
            </Link>
            <Link href="#testimonials" className="text-white hover:text-amber-400 transition-colors">
              Testimonials
            </Link>
            <UserNav />
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 py-4">
          <div className="container px-4 mx-auto flex flex-col space-y-4">
            <Link
              href="#how-it-works"
              className="text-white hover:text-amber-400 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/flights"
              className="text-white hover:text-amber-400 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Flights
            </Link>
            <Link
              href="#features"
              className="text-white hover:text-amber-400 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-white hover:text-amber-400 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Testimonials
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


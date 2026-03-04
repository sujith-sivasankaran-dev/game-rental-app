'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gamepad2, LogOut, User, Shield, Menu, X, Home, ShoppingBag, Settings } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import Image from 'next/image';

// SS Gaming Logo URL
const SS_GAMING_LOGO = "https://customer-assets.emergentagent.com/job_game-rent-platform/artifacts/l76gl32d_images.png";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Health check on app load
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          setBackendStatus(data.status);
          console.log('✅ Backend connected:', data);
        } else {
          setBackendStatus('error');
          console.error('❌ Backend health check failed');
        }
      } catch (error) {
        setBackendStatus('error');
        console.error('❌ Backend unreachable:', error);
      }
    };

    checkBackendHealth();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const isActive = (path) => pathname === path;

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <div className="min-h-screen bg-black flex flex-col">
          {/* Header */}
          <header 
            className={`sticky top-0 z-50 transition-all duration-300 ${
              scrolled 
                ? 'bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/50' 
                : 'bg-transparent border-b border-white/5'
            }`}
          >
            <div className="container-custom">
              <div className="flex h-14 sm:h-16 lg:h-18 items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
                  <div className="relative">
                    <Gamepad2 className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 text-neon transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 blur-xl bg-cyan-500/30 group-hover:bg-cyan-500/50 transition-all" />
                  </div>
                  <div className="hidden xs:block">
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gradient leading-tight">
                      SS GAMING
                    </span>
                    <div className="text-[10px] sm:text-xs text-gray-500 tracking-widest uppercase">Rentals</div>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
                  {user ? (
                    <>
                      {user.role !== 'admin' && (
                        <>
                          <Link href="/">
                            <Button 
                              variant="ghost" 
                              className={`text-sm lg:text-base ${isActive('/') ? 'text-neon bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                            >
                              <Home className="mr-2 h-4 w-4" />
                              Products
                            </Button>
                          </Link>
                          <Link href="/account">
                            <Button 
                              variant="ghost" 
                              className={`text-sm lg:text-base ${isActive('/account') ? 'text-neon bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                            >
                              <User className="mr-2 h-4 w-4" />
                              Account
                            </Button>
                          </Link>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <Link href="/admin">
                          <Button 
                            variant="ghost" 
                            className={`text-sm lg:text-base ${pathname.startsWith('/admin') ? 'text-neon bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Dashboard
                          </Button>
                        </Link>
                      )}
                      <div className="w-px h-6 bg-white/10 mx-2" />
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="ml-2 hidden lg:inline">Logout</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button className="btn-gaming text-sm">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-white p-2 -mr-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation - Full Screen Overlay */}
            {mobileMenuOpen && (
              <div className="md:hidden fixed inset-0 top-14 sm:top-16 bg-black/98 backdrop-blur-xl z-40 mobile-menu-enter">
                <div className="container-custom py-6 space-y-2">
                  {user ? (
                    <>
                      {user.role !== 'admin' && (
                        <>
                          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                            <div className={`flex items-center space-x-3 p-4 rounded-xl transition-colors ${
                              isActive('/') ? 'bg-cyan-500/10 text-neon' : 'text-white hover:bg-white/5'
                            }`}>
                              <Home className="h-5 w-5" />
                              <span className="text-lg font-medium">Products</span>
                            </div>
                          </Link>
                          <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                            <div className={`flex items-center space-x-3 p-4 rounded-xl transition-colors ${
                              isActive('/account') ? 'bg-cyan-500/10 text-neon' : 'text-white hover:bg-white/5'
                            }`}>
                              <User className="h-5 w-5" />
                              <span className="text-lg font-medium">My Account</span>
                            </div>
                          </Link>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <div className={`flex items-center space-x-3 p-4 rounded-xl transition-colors ${
                            pathname.startsWith('/admin') ? 'bg-cyan-500/10 text-neon' : 'text-white hover:bg-white/5'
                          }`}>
                            <Shield className="h-5 w-5" />
                            <span className="text-lg font-medium">Admin Dashboard</span>
                          </div>
                        </Link>
                      )}
                      
                      <div className="h-px bg-white/10 my-4" />
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 p-4 rounded-xl text-red-400 hover:bg-red-500/10 w-full transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="text-lg font-medium">Logout</span>
                      </button>
                      
                      {/* User Info */}
                      <div className="mt-6 p-4 glass-card rounded-xl">
                        <p className="text-gray-400 text-sm">Logged in as</p>
                        <p className="text-white font-medium truncate">{user.email}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <div className="flex items-center space-x-3 p-4 rounded-xl text-white hover:bg-white/5 transition-colors">
                          <User className="h-5 w-5" />
                          <span className="text-lg font-medium">Login</span>
                        </div>
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full btn-gaming h-14 text-lg mt-4">
                          Create Account
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Toaster for notifications */}
          <Toaster 
            position="top-center" 
            richColors 
            theme="dark" 
            toastOptions={{
              className: 'text-sm',
              duration: 4000,
            }}
          />

          {/* Footer */}
          <footer className="border-t border-white/5 py-6 sm:py-8 mt-auto bg-gradient-to-t from-gray-900/50 to-transparent">
            <div className="container-custom">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Gamepad2 className="h-5 w-5 text-neon" />
                  <span className="text-white font-semibold text-sm sm:text-base">SS Gaming Rentals</span>
                </div>
                <div className="text-gray-500 text-xs sm:text-sm text-center order-last sm:order-none">
                  © 2025 SS Gaming Rentals. All rights reserved.
                </div>
                <div className="flex justify-center space-x-6 text-xs sm:text-sm text-gray-400">
                  <a href="#" className="hover:text-neon transition-colors">Terms</a>
                  <a href="#" className="hover:text-neon transition-colors">Privacy</a>
                  <a href="#" className="hover:text-neon transition-colors">Support</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

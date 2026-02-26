'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gamepad2, LogOut, User, Shield, Menu, X } from 'lucide-react';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-black">
          {/* Header */}
          <header className="sticky top-0 z-50 glass-card border-b border-white/5">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex h-16 lg:h-20 items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="relative">
                    <Gamepad2 className="h-8 w-8 lg:h-10 lg:w-10 text-neon transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 blur-xl bg-cyan-500/30 group-hover:bg-cyan-500/50 transition-all" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xl lg:text-2xl font-bold text-gradient">
                      SS GAMING
                    </span>
                    <div className="text-xs text-gray-400 tracking-wider">RENTALS</div>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
                  {user ? (
                    <>
                      <Link href="/">
                        <Button variant="ghost" className="text-white hover:text-neon hover:bg-white/5">
                          Products
                        </Button>
                      </Link>
                      <Link href="/account">
                        <Button variant="ghost" className="text-white hover:text-neon hover:bg-white/5">
                          <User className="mr-2 h-4 w-4" />
                          Account
                        </Button>
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin">
                          <Button variant="ghost" className="text-white hover:text-neon hover:bg-white/5">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin
                          </Button>
                        </Link>
                      )}
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="border-white/10 text-white hover:border-neon hover:text-neon hover:bg-white/5"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="ghost" className="text-white hover:text-neon hover:bg-white/5">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button className="btn-gaming">
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-white hover:text-neon p-2"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>

              {/* Mobile Navigation */}
              {mobileMenuOpen && (
                <div className="md:hidden py-4 space-y-2 border-t border-white/5">
                  {user ? (
                    <>
                      <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-white hover:text-neon hover:bg-white/5">
                          Products
                        </Button>
                      </Link>
                      <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-white hover:text-neon hover:bg-white/5">
                          <User className="mr-2 h-4 w-4" />
                          Account
                        </Button>
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-white hover:text-neon hover:bg-white/5">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin
                          </Button>
                        </Link>
                      )}
                      <Button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start border-white/10 text-white hover:border-neon hover:text-neon"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-white hover:text-neon hover:bg-white/5">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full btn-gaming">
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>

          {/* Toaster for notifications */}
          <Toaster position="top-right" richColors theme="dark" />

          {/* Footer */}
          <footer className="glass-card border-t border-white/5 py-8 mt-20">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-2">
                  <Gamepad2 className="h-5 w-5 text-neon" />
                  <span className="text-white font-semibold">SS Gaming Rentals</span>
                </div>
                <div className="text-gray-400 text-sm text-center md:text-left">
                  © 2025 SS Gaming Rentals. All rights reserved.
                </div>
                <div className="flex space-x-4 text-sm text-gray-400">
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
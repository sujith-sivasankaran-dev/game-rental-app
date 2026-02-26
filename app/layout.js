'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gamepad2, LogOut, User, Shield } from 'lucide-react';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

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
          <header className="sticky top-0 z-50 border-b border-purple-500/20 bg-black/80 backdrop-blur-lg">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <Link href="/" className="flex items-center space-x-2">
                <Gamepad2 className="h-8 w-8 text-purple-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                  SS Gaming Rentals
                </span>
              </Link>

              <nav className="flex items-center space-x-4">
                {user ? (
                  <>
                    <Link href="/">
                      <Button variant="ghost" className="text-gray-300 hover:text-purple-400">
                        Products
                      </Button>
                    </Link>
                    <Link href="/account">
                      <Button variant="ghost" className="text-gray-300 hover:text-purple-400">
                        <User className="mr-2 h-4 w-4" />
                        My Account
                      </Button>
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin">
                        <Button variant="ghost" className="text-gray-300 hover:text-purple-400">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="text-gray-300 hover:text-purple-400">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="bg-purple-600 hover:bg-purple-700 glow-purple">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>

          {/* Footer */}
          <footer className="border-t border-purple-500/20 bg-black/50 py-8">
            <div className="container mx-auto px-4 text-center text-gray-400">
              <p>© 2025 SS Gaming Rentals. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
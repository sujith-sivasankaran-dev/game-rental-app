'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Gamepad2, LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// SS Gaming Logo URL
const SS_GAMING_LOGO = "https://customer-assets.emergentagent.com/job_game-rent-platform/artifacts/l76gl32d_images.png";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Welcome back!');
        
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        toast.error(data.detail || 'Login failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-black to-black" />
      
      {/* Animated Circles - Hidden on small screens for performance */}
      <div className="hidden sm:block absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="hidden sm:block absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md relative z-10">
        <Card className="gaming-card border-white/10">
          <CardHeader className="text-center space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-4 sm:px-6">
            <div className="flex justify-center">
              <div className="relative">
                <Gamepad2 className="h-12 w-12 sm:h-16 sm:w-16 text-neon" />
                <div className="absolute inset-0 blur-2xl bg-cyan-500/50" />
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gradient">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm sm:text-base">
                Login to access your gaming rentals
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-white flex items-center text-sm sm:text-base">
                    <Mail className="h-4 w-4 mr-2 text-cyan-400" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500 h-11 sm:h-12 text-base"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="password" className="text-white flex items-center text-sm sm:text-base">
                    <Lock className="h-4 w-4 mr-2 text-cyan-400" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500 h-11 sm:h-12 text-base"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-12 btn-gaming text-base sm:text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Login
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="bg-[#0d0d0d] px-3 sm:px-4 text-gray-500">New to SS Gaming?</span>
                </div>
              </div>

              <Link href="/register" className="block">
                <Button 
                  variant="outline" 
                  className="w-full h-11 sm:h-12 border-white/10 text-white hover:border-cyan-500 hover:text-cyan-400 hover:bg-white/5 group"
                >
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Back to Home Link */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

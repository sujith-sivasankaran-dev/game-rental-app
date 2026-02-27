'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Package, Users, AlertTriangle, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(parsedUser);
    fetchDashboardMetrics(token);
  }, []);

  const fetchDashboardMetrics = async (token) => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        toast.error('Failed to load dashboard');
      }
    } catch (error) {
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Monitor your rental business performance</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="gaming-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ₹{metrics?.total_revenue?.toFixed(2) || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="gaming-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Rentals</CardTitle>
              <Activity className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {metrics?.active_rentals || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently rented</p>
            </CardContent>
          </Card>

          <Card className="gaming-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Products</CardTitle>
              <Package className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {metrics?.total_products || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">In catalog</p>
            </CardContent>
          </Card>

          <Card className="gaming-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Customers</CardTitle>
              <Users className="h-5 w-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {metrics?.total_customers || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Registered users</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Links */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Link href="/admin/products">
            <Card className="gaming-card cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-white group-hover:text-neon transition-colors">
                      Product Management
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Add, edit, and manage your inventory
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-6 w-6 text-cyan-400 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Package className="h-4 w-4" />
                  <span>{metrics?.total_products || 0} products in catalog</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/coupons">
            <Card className="gaming-card cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-white group-hover:text-neon transition-colors">
                      Coupon Management
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Create and manage discount coupons
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-6 w-6 text-cyan-400 group-hover:translate-x-2 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>Boost sales with discounts</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Alerts Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Low Stock Alerts */}
          <Link href="/admin/low-stock">
            <Card className="gaming-card cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <CardTitle className="text-white group-hover:text-neon transition-colors">Low Stock Alerts</CardTitle>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                    {metrics?.low_stock_alerts?.length || 0}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  Products with less than 2 items in stock
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics?.low_stock_alerts?.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.low_stock_alerts.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">{product.name}</span>
                        <span className="text-yellow-400 font-bold">{product.available_stock}</span>
                      </div>
                    ))}
                    {metrics.low_stock_alerts.length > 3 && (
                      <p className="text-cyan-400 text-sm">+{metrics.low_stock_alerts.length - 3} more...</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">All products have sufficient stock</p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Upcoming Returns */}
          <Link href="/admin/upcoming-returns">
            <Card className="gaming-card cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white group-hover:text-neon transition-colors">Upcoming Returns</CardTitle>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                    {metrics?.upcoming_returns?.length || 0}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  Rentals ending in the next 3 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics?.upcoming_returns?.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.upcoming_returns.slice(0, 3).map((rental) => (
                      <div key={rental.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">#{rental.id.slice(0, 8)}</span>
                        <span className="text-cyan-400">{new Date(rental.extended_end_date || rental.end_date).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {metrics.upcoming_returns.length > 3 && (
                      <p className="text-cyan-400 text-sm">+{metrics.upcoming_returns.length - 3} more...</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming returns</p>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Most Rented Product */}
        {metrics?.most_rented_product && (
          <Card className="gaming-card">
            <CardHeader>
              <CardTitle className="text-white">Top Performer</CardTitle>
              <CardDescription className="text-gray-400">
                Most rented product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-xl text-white font-semibold block">
                      {metrics.most_rented_product.name}
                    </span>
                    <span className="text-gray-400 text-sm">Most popular item</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-neon block">
                    {metrics.most_rented_product.rental_count}
                  </span>
                  <span className="text-gray-500 text-sm">rentals</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

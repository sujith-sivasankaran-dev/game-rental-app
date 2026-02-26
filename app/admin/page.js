'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Package, Users, AlertTriangle, TrendingUp } from 'lucide-react';
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
      const response = await fetch('http://localhost:8000/api/admin/dashboard', {
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10 p-8">
      <div className="container mx-auto">
        <h1 className="mb-8 text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>

        {/* Metrics Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-gaming">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                ${metrics?.total_revenue || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="card-gaming">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Rentals</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {metrics?.active_rentals || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="card-gaming">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Products</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {metrics?.total_products || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="card-gaming">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-400">
                {metrics?.total_customers || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Links */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Link href="/admin/products">
            <Card className="card-gaming cursor-pointer hover:scale-105 transition-transform">
              <CardHeader>
                <CardTitle className="text-purple-400">Product Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Add, edit, and manage products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 glow-purple">
                  Manage Products
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/coupons">
            <Card className="card-gaming cursor-pointer hover:scale-105 transition-transform">
              <CardHeader>
                <CardTitle className="text-blue-400">Coupon Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Create and manage discount coupons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 glow-blue">
                  Manage Coupons
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Alerts */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Low Stock Alerts */}
          <Card className="card-gaming">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-yellow-400">Low Stock Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {metrics?.low_stock_alerts?.length > 0 ? (
                <div className="space-y-2">
                  {metrics.low_stock_alerts.map((product) => (
                    <div key={product.id} className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-300">{product.name}</span>
                      <span className="text-yellow-400">Stock: {product.available_stock}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No low stock alerts</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Returns */}
          <Card className="card-gaming">
            <CardHeader>
              <CardTitle className="text-blue-400">Upcoming Returns (3 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.upcoming_returns?.length > 0 ? (
                <div className="space-y-2">
                  {metrics.upcoming_returns.slice(0, 5).map((rental) => (
                    <div key={rental.id} className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-300 text-sm">
                        {new Date(rental.extended_end_date || rental.end_date).toLocaleDateString()}
                      </span>
                      <span className="text-blue-400 text-sm">Rental ID: {rental.id.slice(0, 8)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No upcoming returns</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Most Rented Product */}
        {metrics?.most_rented_product && (
          <Card className="card-gaming">
            <CardHeader>
              <CardTitle className="text-purple-400">Most Rented Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xl text-gray-300">{metrics.most_rented_product.name}</span>
                <span className="text-2xl font-bold text-purple-400">
                  {metrics.most_rented_product.rental_count} rentals
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

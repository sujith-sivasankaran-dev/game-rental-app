'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, DollarSign, Package, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [rentals, setRentals] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchRentals(token);
  }, []);

  const fetchRentals = async (token) => {
    try {
      const response = await fetch('/api/rentals', {
        headers: {
          'Authorization': `Bearer ₹{token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRentals(data);
      }
    } catch (error) {
      toast.error('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400 border-green-500/50',
      extended: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return colors[status] || colors.active;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
          <p className="text-gray-400">Loading account...</p>
        </div>
      </div>
    );
  }

  const activeRentals = rentals.filter(r => r.status === 'active' || r.status === 'extended');
  const pastRentals = rentals.filter(r => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient">
            My Account
          </h1>
          <p className="text-gray-400">Manage your profile and rentals</p>
        </div>

        {/* Profile Card */}
        <Card className="gaming-card mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="h-5 w-5 mr-2 text-cyan-400" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center space-x-3 p-3 glass-card rounded-lg">
                <User className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-white font-medium">{user?.full_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 glass-card rounded-lg">
                <Mail className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 glass-card rounded-lg">
                <Phone className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-white font-medium">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rentals Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="glass-card border-white/10 mb-6">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Active Rentals ({activeRentals.length})
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Rental History ({pastRentals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeRentals.length === 0 ? (
              <Card className="gaming-card">
                <CardContent className="pt-12 pb-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-400 text-lg">No active rentals</p>
                  <p className="text-gray-600 text-sm mt-2">Browse products to start renting</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {activeRentals.map((rental) => (
                  <Card key={rental.id} className="gaming-card">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-white text-lg">
                            {rental.product_name}
                          </CardTitle>
                          <CardDescription className="text-gray-400 text-xs mt-1">
                            ID: {rental.id.slice(0, 8)}...
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(rental.status)}>
                          {rental.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <Calendar className="mr-2 h-4 w-4 text-cyan-400" />
                            Start Date
                          </div>
                          <span className="text-white font-medium">
                            {new Date(rental.start_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <Clock className="mr-2 h-4 w-4 text-cyan-400" />
                            Return Date
                          </div>
                          <span className="text-white font-medium">
                            {new Date(rental.extended_end_date || rental.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <DollarSign className="mr-2 h-4 w-4 text-green-400" />
                            Total Price
                          </div>
                          <span className="text-white font-bold text-lg">
                            ₹{rental.total_price}
                          </span>
                        </div>
                      </div>

                      {rental.coupon_code && (
                        <div className="p-3 glass-card rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Coupon Applied</span>
                            <div className="text-right">
                              <span className="text-cyan-400 font-mono font-bold block">{rental.coupon_code}</span>
                              <span className="text-green-400 text-xs">-₹{rental.discount_amount}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full btn-gaming"
                        onClick={() => toast.info('Extension feature coming soon!')}
                      >
                        Extend Rental
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {pastRentals.length === 0 ? (
              <Card className="gaming-card">
                <CardContent className="pt-12 pb-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-400 text-lg">No rental history</p>
                  <p className="text-gray-600 text-sm mt-2">Your completed rentals will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastRentals.map((rental) => (
                  <Card key={rental.id} className="gaming-card">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg">{rental.product_name}</h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(rental.status)}>
                            {rental.status}
                          </Badge>
                          <div className="text-right">
                            <p className="text-white font-bold text-xl">₹{rental.total_price}</p>
                            {rental.coupon_code && (
                              <p className="text-green-400 text-xs">Saved ₹{rental.discount_amount}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

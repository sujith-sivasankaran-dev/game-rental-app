'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, DollarSign, Package } from 'lucide-react';
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
          'Authorization': `Bearer ${token}`,
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
      extended: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return colors[status] || colors.active;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400">Loading account...</div>
      </div>
    );
  }

  const activeRentals = rentals.filter(r => r.status === 'active' || r.status === 'extended');
  const pastRentals = rentals.filter(r => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10 p-8">
      <div className="container mx-auto">
        <h1 className="mb-8 text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          My Account
        </h1>

        {/* User Info */}
        <Card className="mb-8 card-gaming">
          <CardHeader>
            <CardTitle className="text-purple-400">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white">{user?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone:</span>
              <span className="text-white">{user?.phone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Account Type:</span>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                {user?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rentals */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-gray-900 border-purple-500/30">
            <TabsTrigger value="active" className="data-[state=active]:bg-purple-600">
              Active Rentals ({activeRentals.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
              Rental History ({pastRentals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeRentals.length === 0 ? (
              <Card className="card-gaming">
                <CardContent className="pt-6 text-center text-gray-400">
                  <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No active rentals</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {activeRentals.map((rental) => (
                  <Card key={rental.id} className="card-gaming">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-purple-400">{rental.product_name}</CardTitle>
                          <CardDescription className="text-gray-400">
                            Rental ID: {rental.id.slice(0, 8)}...
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(rental.status)}>
                          {rental.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-blue-400" />
                        <span className="text-gray-400">Start:</span>
                        <span className="ml-2 text-white">
                          {new Date(rental.start_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-purple-400" />
                        <span className="text-gray-400">Return:</span>
                        <span className="ml-2 text-white">
                          {new Date(rental.extended_end_date || rental.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="mr-2 h-4 w-4 text-green-400" />
                        <span className="text-gray-400">Total:</span>
                        <span className="ml-2 text-white font-bold">
                          ${rental.total_price}
                        </span>
                      </div>
                      {rental.coupon_code && (
                        <div className="text-sm">
                          <span className="text-gray-400">Coupon:</span>
                          <span className="ml-2 text-green-400">{rental.coupon_code}</span>
                          <span className="ml-2 text-gray-400">(-${rental.discount_amount})</span>
                        </div>
                      )}
                      <Button
                        className="w-full mt-4 bg-purple-600 hover:bg-purple-700 glow-purple"
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

          <TabsContent value="history" className="mt-6">
            {pastRentals.length === 0 ? (
              <Card className="card-gaming">
                <CardContent className="pt-6 text-center text-gray-400">
                  <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No rental history</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastRentals.map((rental) => (
                  <Card key={rental.id} className="card-gaming">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-gray-300">{rental.product_name}</CardTitle>
                          <CardDescription className="text-gray-500">
                            {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(rental.status)}>
                            {rental.status}
                          </Badge>
                          <div className="mt-2 text-lg font-bold text-gray-300">
                            ${rental.total_price}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
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

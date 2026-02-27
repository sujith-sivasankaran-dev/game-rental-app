'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Phone, MapPin, Package, User } from 'lucide-react';
import { toast } from 'sonner';

export default function UpcomingReturnsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [filter, setFilter] = useState('3days');
  const [customDate, setCustomDate] = useState('');

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

    fetchRentals(token);
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, customDate, rentals]);

  const fetchRentals = async (token) => {
    try {
      const response = await fetch('/api/admin/rentals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only active rentals
        const activeRentals = data.filter(r => r.status === 'active' || r.status === 'extended');
        setRentals(activeRentals);
      }
    } catch (error) {
      toast.error('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filtered = rentals.filter(rental => {
      const returnDate = new Date(rental.extended_end_date || rental.end_date);
      const daysUntilReturn = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
      
      switch(filter) {
        case 'today':
          return daysUntilReturn === 0;
        case 'tomorrow':
          return daysUntilReturn === 1;
        case '3days':
          return daysUntilReturn >= 0 && daysUntilReturn <= 3;
        case 'custom':
          if (!customDate) return true;
          const selectedDate = new Date(customDate);
          return returnDate.toDateString() === selectedDate.toDateString();
        default:
          return true;
      }
    });

    // Sort by return date
    filtered.sort((a, b) => {
      const dateA = new Date(a.extended_end_date || a.end_date);
      const dateB = new Date(b.extended_end_date || b.end_date);
      return dateA - dateB;
    });

    setFilteredRentals(filtered);
  };

  const exportToCSV = async () => {
    const token = localStorage.getItem('token');
    
    // Fetch user details for each rental
    const csvData = await Promise.all(filteredRentals.map(async (rental) => {
      try {
        const userResponse = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const users = await userResponse.json();
        const user = users.find(u => u.id === rental.user_id) || {};
        
        return {
          'Rental ID': rental.id,
          'Product Name': rental.product_name,
          'Customer Name': user.full_name || 'N/A',
          'Phone Number': user.phone || 'N/A',
          'Email': user.email || 'N/A',
          'Start Date': new Date(rental.start_date).toLocaleDateString(),
          'Return Date': new Date(rental.extended_end_date || rental.end_date).toLocaleDateString(),
          'Status': rental.status,
          'Total Amount': `₹${rental.total_price}`,
        };
      } catch (error) {
        return {
          'Rental ID': rental.id,
          'Product Name': rental.product_name,
          'Customer Name': 'Error',
          'Phone Number': 'Error',
          'Email': 'Error',
          'Start Date': new Date(rental.start_date).toLocaleDateString(),
          'Return Date': new Date(rental.extended_end_date || rental.end_date).toLocaleDateString(),
          'Status': rental.status,
          'Total Amount': `₹${rental.total_price}`,
        };
      }
    }));

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `upcoming_returns_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exported successfully!');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
          <p className="text-gray-400">Loading rentals...</p>
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
            Upcoming Returns
          </h1>
          <p className="text-gray-400">Manage and export rental return schedules</p>
        </div>

        {/* Filters & Export */}
        <Card className="gaming-card mb-8">
          <CardHeader>
            <CardTitle className="text-white">Filter & Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-12 items-end">
              <div className="md:col-span-4 space-y-2">
                <label className="text-sm text-gray-400">Filter by Date</label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="bg-black/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="3days">Next 3 Days</SelectItem>
                    <SelectItem value="custom">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filter === 'custom' && (
                <div className="md:col-span-4 space-y-2">
                  <label className="text-sm text-gray-400">Select Date</label>
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                  />
                </div>
              )}

              <div className={filter === 'custom' ? 'md:col-span-4' : 'md:col-span-8'}>
                <Button
                  onClick={exportToCSV}
                  disabled={filteredRentals.length === 0}
                  className="w-full btn-gaming"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Export {filteredRentals.length} Rentals to CSV
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 glass-card rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Showing:</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                  {filteredRentals.length} rentals
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rentals List */}
        {filteredRentals.length === 0 ? (
          <Card className="gaming-card">
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-700" />
              <p className="text-gray-400 text-lg">No rentals found for selected filter</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRentals.map((rental, index) => (
              <Card key={rental.id} className="gaming-card">
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-12">
                    <div className="md:col-span-1 flex items-center">
                      <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <span className="text-cyan-400 font-bold">{index + 1}</span>
                      </div>
                    </div>

                    <div className="md:col-span-8 space-y-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{rental.product_name}</h3>
                        <p className="text-gray-400 text-sm">Rental ID: #{rental.id.slice(0, 8)}...</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-cyan-400" />
                          <span className="text-gray-400">User ID: {rental.user_id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-cyan-400" />
                          <span className="text-gray-400">Start: {new Date(rental.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-400 font-medium">
                            Return: {new Date(rental.extended_end_date || rental.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-white font-bold">
                          ₹{rental.total_price}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col justify-center space-y-2">
                      <Badge className={
                        rental.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/50'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                      }>
                        {rental.status}
                      </Badge>
                      {rental.coupon_code && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                          Coupon: {rental.coupon_code}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

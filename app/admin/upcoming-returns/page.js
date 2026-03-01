'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Phone, MapPin, Package, User, Navigation, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function UpcomingReturnsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState([]);
  const [users, setUsers] = useState({});
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

    fetchData(token);
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, customDate, rentals]);

  const fetchData = async (token) => {
    try {
      // Fetch rentals
      const rentalsResponse = await fetch('/api/admin/rentals/filtered', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (rentalsResponse.ok) {
        const rentalsData = await rentalsResponse.json();
        // Filter only active rentals
        const activeRentals = (rentalsData.rentals || []).filter(r => r.status === 'active' || r.status === 'extended');
        setRentals(activeRentals);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const usersMap = {};
        usersData.forEach(u => { usersMap[u.id] = u; });
        setUsers(usersMap);
      }
    } catch (error) {
      toast.error('Failed to load data');
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
        case '7days':
          return daysUntilReturn >= 0 && daysUntilReturn <= 7;
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

  const openGoogleMapsDirections = (address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`;
    window.open(url, '_blank');
  };

  const exportToCSV = () => {
    if (filteredRentals.length === 0) {
      toast.error('No rentals to export');
      return;
    }

    const csvData = filteredRentals.map(rental => {
      const user = users[rental.user_id] || {};
      const address = rental.delivery_address || {};
      
      return {
        'Rental ID': rental.id,
        'Product Name': rental.product_name,
        'Product Type': rental.product_type,
        'Customer Name': rental.customer_name || user.full_name || 'N/A',
        'Customer Email': rental.customer_email || user.email || 'N/A',
        'Customer Phone': address.phone || user.phone || 'N/A',
        'Start Date': new Date(rental.start_date).toLocaleDateString(),
        'Return Date': new Date(rental.extended_end_date || rental.end_date).toLocaleDateString(),
        'Status': rental.status,
        'Total Amount': `₹${rental.total_price}`,
        'Delivery Address': address.full_address || 'N/A',
        'Landmark': address.landmark || 'N/A',
        'Google Maps Link': address.latitude ? `https://www.google.com/maps?q=${address.latitude},${address.longitude}` : 'N/A',
      };
    });

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
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

  const getDaysUntilReturn = (rental) => {
    const returnDate = new Date(rental.extended_end_date || rental.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getUrgencyColor = (days) => {
    if (days <= 0) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (days === 1) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    return 'bg-green-500/20 text-green-400 border-green-500/50';
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
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient">
              Upcoming Returns
            </h1>
            <p className="text-gray-400">Manage and track rental return schedules</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Filters & Export */}
        <Card className="gaming-card mb-8">
          <CardHeader>
            <CardTitle className="text-white">Filter & Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-12 items-end">
              <div className="md:col-span-3 space-y-2">
                <label className="text-sm text-gray-400">Filter by Return Date</label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="bg-black/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="3days">Next 3 Days</SelectItem>
                    <SelectItem value="7days">Next 7 Days</SelectItem>
                    <SelectItem value="custom">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filter === 'custom' && (
                <div className="md:col-span-3 space-y-2">
                  <label className="text-sm text-gray-400">Select Date</label>
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                  />
                </div>
              )}

              <div className={filter === 'custom' ? 'md:col-span-6' : 'md:col-span-9'}>
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
                  {filteredRentals.length} upcoming returns
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
              <p className="text-gray-400 text-lg">No upcoming returns found</p>
              <p className="text-gray-600 text-sm mt-2">Try adjusting your filter</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRentals.map((rental, index) => {
              const daysUntil = getDaysUntilReturn(rental);
              const address = rental.delivery_address;
              
              return (
                <Card key={rental.id} className="gaming-card overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header Row */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-cyan-400 font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">{rental.product_name}</h3>
                            <p className="text-gray-500 text-sm">ID: #{rental.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getUrgencyColor(daysUntil)}>
                            {daysUntil <= 0 ? 'Due Today' : daysUntil === 1 ? 'Due Tomorrow' : `${daysUntil} Days Left`}
                          </Badge>
                          <Badge className={
                            rental.status === 'active' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/50'
                              : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                          }>
                            {rental.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Customer Info */}
                        <div className="p-3 glass-card rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-cyan-400" />
                            <span className="text-gray-400 text-sm">Customer</span>
                          </div>
                          <p className="text-white font-medium">{rental.customer_name}</p>
                          <p className="text-gray-500 text-xs">{rental.customer_email}</p>
                          {address?.phone && (
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-400 text-xs">{address.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Dates */}
                        <div className="p-3 glass-card rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-cyan-400" />
                            <span className="text-gray-400 text-sm">Rental Period</span>
                          </div>
                          <p className="text-gray-400 text-sm">
                            Start: <span className="text-white">{new Date(rental.start_date).toLocaleDateString()}</span>
                          </p>
                          <p className="text-yellow-400 text-sm font-medium">
                            Return: {new Date(rental.extended_end_date || rental.end_date).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="p-3 glass-card rounded-lg">
                          <div className="text-gray-400 text-sm mb-2">Total Amount</div>
                          <p className="text-2xl font-bold text-neon">₹{rental.total_price?.toFixed(2)}</p>
                          {rental.coupon_code && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 mt-1 text-xs">
                              {rental.coupon_code}
                            </Badge>
                          )}
                        </div>

                        {/* Delivery Address */}
                        <div className="p-3 glass-card rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-cyan-400" />
                            <span className="text-gray-400 text-sm">Delivery Address</span>
                          </div>
                          {address ? (
                            <div className="space-y-2">
                              <p className="text-white text-sm line-clamp-2">{address.full_address}</p>
                              {address.landmark && (
                                <p className="text-gray-500 text-xs">Near: {address.landmark}</p>
                              )}
                              <Button
                                size="sm"
                                onClick={() => openGoogleMapsDirections(address)}
                                className="w-full btn-gaming text-xs py-1"
                              >
                                <Navigation className="h-3 w-3 mr-1" />
                                Get Directions
                              </Button>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No address provided</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

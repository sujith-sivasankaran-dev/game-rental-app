'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Package, Users, AlertTriangle, TrendingUp, Activity, ArrowRight, Calendar, Filter, Download, Search, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [user, setUser] = useState(null);
  
  // Rental orders state
  const [rentals, setRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

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
    fetchRentals(token);
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

  const fetchRentals = async (token, filters = {}) => {
    setRentalsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.productId && filters.productId !== 'all') params.append('product_id', filters.productId);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      
      const queryString = params.toString();
      const url = `/api/admin/rentals/filtered${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRentals(data.rentals || []);
        setCategories(data.categories || []);
        setProducts(data.products || []);
      } else {
        toast.error('Failed to load rentals');
      }
    } catch (error) {
      console.error('Error fetching rentals:', error);
      toast.error('Error loading rentals');
    } finally {
      setRentalsLoading(false);
    }
  };

  const applyFilters = () => {
    const token = localStorage.getItem('token');
    fetchRentals(token, {
      dateFrom,
      dateTo,
      productId: selectedProduct,
      category: selectedCategory,
      status: selectedStatus
    });
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedProduct('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    const token = localStorage.getItem('token');
    fetchRentals(token);
  };

  const exportToCSV = () => {
    if (rentals.length === 0) {
      toast.error('No rentals to export');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Product Name', 'Category', 'Start Date', 'End Date', 'Status', 'Total Price (₹)'];
    const csvData = rentals.map(rental => [
      rental.id,
      rental.customer_name,
      rental.customer_email,
      rental.product_name,
      rental.product_type,
      new Date(rental.start_date).toLocaleDateString(),
      new Date(rental.extended_end_date || rental.end_date).toLocaleDateString(),
      rental.status,
      rental.total_price?.toFixed(2)
    ]);

    const csvContent = [headers, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rental_orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV exported successfully!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'extended': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
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

        {/* Rental Orders Section */}
        <Card className="gaming-card mt-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-cyan-400" />
                  Rental Orders
                </CardTitle>
                <CardDescription className="text-gray-400">
                  View and filter all rental orders
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                  {rentals.length} orders
                </Badge>
                <Button 
                  onClick={exportToCSV}
                  className="btn-gaming"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="glass-card p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-cyan-400" />
                <span className="text-white font-semibold">Filters</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                {/* Date From */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">From Date</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>
                
                {/* Date To */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">To Date</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>
                
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-black/50 border-white/10 text-white">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Product Filter */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Product</label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="bg-black/50 border-white/10 text-white">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="all">All Products</SelectItem>
                      {products.map((prod) => (
                        <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-black/50 border-white/10 text-white">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="extended">Extended</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filter Actions */}
                <div className="space-y-2 flex flex-col justify-end">
                  <label className="text-sm text-gray-400 invisible">Actions</label>
                  <div className="flex gap-2">
                    <Button onClick={applyFilters} className="btn-gaming flex-1">
                      <Search className="h-4 w-4 mr-1" />
                      Apply
                    </Button>
                    <Button onClick={clearFilters} variant="outline" className="border-white/10 text-gray-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            {rentalsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
                  <p className="text-gray-400">Loading orders...</p>
                </div>
              </div>
            ) : rentals.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-gray-400">Order ID</TableHead>
                      <TableHead className="text-gray-400">Customer</TableHead>
                      <TableHead className="text-gray-400">Product</TableHead>
                      <TableHead className="text-gray-400">Category</TableHead>
                      <TableHead className="text-gray-400">Period</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentals.map((rental) => (
                      <TableRow key={rental.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-cyan-400 font-mono text-sm">
                          #{rental.id?.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="text-white">{rental.customer_name}</div>
                          <div className="text-gray-500 text-xs">{rental.customer_email}</div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {rental.product_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-white/20 text-gray-400">
                            {rental.product_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          <div>{new Date(rental.start_date).toLocaleDateString()}</div>
                          <div className="text-gray-500">to {new Date(rental.extended_end_date || rental.end_date).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(rental.status)}>
                            {rental.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-white font-semibold">
                          ₹{rental.total_price?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">No rental orders found</p>
                <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

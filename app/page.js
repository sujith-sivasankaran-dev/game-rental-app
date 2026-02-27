'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Package, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    product_type: 'all',
    compatibility: 'all',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.product_type && filters.product_type !== 'all') queryParams.append('product_type', filters.product_type);
      if (filters.compatibility && filters.compatibility !== 'all') queryParams.append('compatibility', filters.compatibility);
      queryParams.append('is_active', 'true');

      const response = await fetch(`/api/products?${queryParams}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-black to-black" />
        <div className="absolute inset-0 scan-lines opacity-20" />
        
        <div className="container relative mx-auto px-4 py-12 md:py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-block">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 px-4 py-1 text-sm">
                <Zap className="inline h-4 w-4 mr-2" />
                Premium Gaming Equipment
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold">
              <span className="text-gradient block">Rent Gaming</span>
              <span className="text-white">Consoles & Accessories</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
              Experience the latest gaming technology without breaking the bank. Flexible rentals, competitive prices.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        {/* Search & Filters */}
        <div className="glass-card p-4 md:p-6 mb-12 -mt-8 md:-mt-12 relative z-10">
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-5 flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-3">
              <Select
                value={filters.product_type}
                onValueChange={(value) => setFilters({ ...filters, product_type: value })}
              >
                <SelectTrigger className="bg-black/50 border-white/10 text-white">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Console">Console</SelectItem>
                  <SelectItem value="Accessory">Accessory</SelectItem>
                  <SelectItem value="Game">Game</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select
                value={filters.compatibility}
                onValueChange={(value) => setFilters({ ...filters, compatibility: value })}
              >
                <SelectTrigger className="bg-black/50 border-white/10 text-white">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="PS5">PS5</SelectItem>
                  <SelectItem value="PS4">PS4</SelectItem>
                  <SelectItem value="PS4 & PS5">PS4 & PS5</SelectItem>
                  <SelectItem value="Xbox One">Xbox One</SelectItem>
                  <SelectItem value="Xbox Series X/S">Xbox Series X/S</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Button
                onClick={handleSearch}
                className="w-full btn-gaming h-10"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
              <p className="text-gray-400">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">No products found</p>
            <Button onClick={() => setFilters({ search: '', product_type: 'all', compatibility: 'all' })} className="mt-4 btn-gaming">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="responsive-grid">
            {products.map((product) => (
              <Card key={product.id} className="gaming-card overflow-hidden group">
                {/* Image */}
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-900 to-black relative">
                  {product.photo_url ? (
                    <img
                      src={product.photo_url}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-20 w-20 text-gray-700" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg text-white group-hover:text-neon transition-colors">
                      {product.name}
                    </CardTitle>
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-xs whitespace-nowrap">
                      {product.product_type}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-400 text-sm">
                    {product.compatibility}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{product.description}</p>
                  
                  <div className="space-y-3">
                    {/* Price */}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-bold text-neon">₹{product.rental_price}</span>
                        <span className="text-gray-500 text-sm ml-2">/day</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Min Period</div>
                        <div className="text-sm text-white">{product.min_rental_period} {product.min_rental_unit}</div>
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Availability</span>
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ₹{product.available_stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-white font-medium">{product.available_stock} in stock</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Link href={`/book/₹{product.id}`} className="w-full">
                    <Button className="w-full btn-gaming group-hover:glow-cyan transition-all">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Rent Now
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

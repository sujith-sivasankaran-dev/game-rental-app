'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Package, TrendingUp, Zap, Sparkles, Clock, Star } from 'lucide-react';
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
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-black/50 to-black" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="container-custom relative py-12 sm:py-16 md:py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
            <div className="inline-block fade-in">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 px-3 sm:px-4 py-1.5 text-xs sm:text-sm">
                <Zap className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Premium Gaming Equipment
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              <span className="text-gradient block">Rent Gaming</span>
              <span className="text-white">Consoles & Accessories</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto px-4">
              Experience the latest gaming technology without breaking the bank. Flexible rentals, competitive prices.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-6">
              <div className="flex items-center space-x-2 text-gray-400">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span className="text-xs sm:text-sm">Premium Quality</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                <span className="text-xs sm:text-sm">Flexible Duration</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                <span className="text-xs sm:text-sm">Latest Consoles</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom pb-12 sm:pb-16 lg:pb-20">
        {/* Search & Filters */}
        <div className="glass-card p-3 sm:p-4 md:p-6 mb-8 sm:mb-10 lg:mb-12 -mt-4 sm:-mt-6 md:-mt-8 lg:-mt-12 relative z-10">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-12">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 sm:pl-10 h-10 sm:h-11 bg-black/50 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 text-sm sm:text-base"
              />
            </div>
            
            {/* Product Type */}
            <div className="lg:col-span-3">
              <Select
                value={filters.product_type}
                onValueChange={(value) => setFilters({ ...filters, product_type: value })}
              >
                <SelectTrigger className="h-10 sm:h-11 bg-black/50 border-white/10 text-white text-sm sm:text-base">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Console">Console</SelectItem>
                  <SelectItem value="Accessory">Accessory</SelectItem>
                  <SelectItem value="Game">Game</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Platform */}
            <div className="lg:col-span-3">
              <Select
                value={filters.compatibility}
                onValueChange={(value) => setFilters({ ...filters, compatibility: value })}
              >
                <SelectTrigger className="h-10 sm:h-11 bg-black/50 border-white/10 text-white text-sm sm:text-base">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="PS5">PS5</SelectItem>
                  <SelectItem value="PS4">PS4</SelectItem>
                  <SelectItem value="PS4 & PS5">PS4 & PS5</SelectItem>
                  <SelectItem value="Xbox One">Xbox One</SelectItem>
                  <SelectItem value="Xbox Series X/S">Xbox Series X/S</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Search Button */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Button
                onClick={handleSearch}
                className="w-full h-10 sm:h-11 btn-gaming"
              >
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="sm:hidden lg:hidden xl:inline ml-2 sm:ml-0">Search</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="text-center space-y-4">
              <div className="inline-block h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
              <p className="text-gray-400 text-sm sm:text-base">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-700" />
            <p className="text-gray-400 text-base sm:text-lg">No products found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
            <Button 
              onClick={() => setFilters({ search: '', product_type: 'all', compatibility: 'all' })} 
              className="mt-4 btn-gaming"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <p className="text-gray-400 text-sm">
                Showing <span className="text-white font-medium">{products.length}</span> products
              </p>
            </div>

            {/* Grid */}
            <div className="responsive-grid">
              {products.map((product, index) => (
                <Card 
                  key={product.id} 
                  className="product-card fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image */}
                  <div className="product-image">
                    {product.photo_url ? (
                      <img
                        src={product.photo_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-700" />
                      </div>
                    )}
                    {/* Type Badge on Image */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <Badge className="bg-black/70 backdrop-blur-sm text-cyan-400 border-cyan-500/30 text-[10px] sm:text-xs px-2 py-0.5">
                        {product.product_type}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 space-y-1">
                    <CardTitle className="text-base sm:text-lg text-white line-clamp-1">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="text-gray-500 text-xs sm:text-sm">
                      {product.compatibility}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4 pt-0">
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-3 sm:mb-4 min-h-[2.5rem] sm:min-h-[2.75rem]">
                      {product.description}
                    </p>
                    
                    <div className="space-y-2 sm:space-y-3">
                      {/* Price */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-neon">₹{product.rental_price}</span>
                          <span className="text-gray-500 text-xs sm:text-sm ml-1">/day</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] sm:text-xs text-gray-500">Min Period</div>
                          <div className="text-xs sm:text-sm text-white">{product.min_rental_period} {product.min_rental_unit}</div>
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400 text-xs sm:text-sm">Units</span>
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-cyan-500 animate-pulse" />
                          <span className="text-white font-medium text-xs sm:text-sm">{product.total_stock} available</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-3 sm:p-4 pt-0">
                    <Link href={`/book/${product.id}`} className="w-full">
                      <Button className="w-full h-10 sm:h-11 btn-gaming text-sm sm:text-base">
                        <TrendingUp className="mr-1.5 sm:mr-2 h-4 w-4" />
                        Rent Now
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
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

      const response = await fetch(`http://localhost:8000/api/products?${queryParams}`);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            Rent Gaming Consoles & Accessories
          </h1>
          <p className="text-xl text-gray-400">
            Premium gaming gear at your fingertips
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 card-gaming">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center space-x-2 md:col-span-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-gray-900 border-purple-500/30 text-white"
                />
              </div>
              <Select
                value={filters.product_type || "all"}
                onValueChange={(value) => setFilters({ ...filters, product_type: value === "all" ? "" : value })}
              >
                <SelectTrigger className="bg-gray-900 border-purple-500/30 text-white">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Console">Console</SelectItem>
                  <SelectItem value="Accessory">Accessory</SelectItem>
                  <SelectItem value="Game">Game</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.compatibility || "all"}
                onValueChange={(value) => setFilters({ ...filters, compatibility: value === "all" ? "" : value })}
              >
                <SelectTrigger className="bg-gray-900 border-purple-500/30 text-white">
                  <SelectValue placeholder="Compatibility" />
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
            <Button
              onClick={handleSearch}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 glow-purple"
            >
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center text-gray-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-400">No products found</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} className="card-gaming overflow-hidden group hover:scale-105 transition-transform">
                <div className="aspect-square overflow-hidden bg-gray-900">
                  {product.photo_url ? (
                    <img
                      src={product.photo_url}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-600">
                      No Image
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-purple-400">{product.name}</CardTitle>
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                      {product.product_type}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-400">
                    {product.compatibility}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-400">${product.rental_price}</p>
                      <p className="text-xs text-gray-500">per day</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Stock: {product.available_stock}</p>
                      <p className="text-xs text-gray-500">
                        Min: {product.min_rental_period} {product.min_rental_unit}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/book/${product.id}`} className="w-full">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 glow-purple">
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

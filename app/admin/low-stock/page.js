'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, TrendingDown, Edit } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LowStockPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

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

    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        // Filter products with low stock (< 2)
        const lowStock = data.filter(p => p.available_stock < 2 && p.is_active);
        // Sort by stock level (lowest first)
        lowStock.sort((a, b) => a.available_stock - b.available_stock);
        setProducts(lowStock);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
          <p className="text-gray-400">Loading products...</p>
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
            Low Stock Alerts
          </h1>
          <p className="text-gray-400">Products that need restocking</p>
        </div>

        {/* Summary Card */}
        <Card className="gaming-card mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-yellow-400" />
                Stock Status Overview
              </CardTitle>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-lg px-4 py-2">
                {products.length} Items
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 glass-card rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Out of Stock</div>
                <div className="text-3xl font-bold text-red-400">
                  {products.filter(p => p.available_stock === 0).length}
                </div>
              </div>
              <div className="p-4 glass-card rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Only 1 Left</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {products.filter(p => p.available_stock === 1).length}
                </div>
              </div>
              <div className="p-4 glass-card rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Total Low Stock</div>
                <div className="text-3xl font-bold text-cyan-400">
                  {products.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {products.length === 0 ? (
          <Card className="gaming-card">
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-700" />
              <p className="text-gray-400 text-lg mb-2">All products have sufficient stock!</p>
              <p className="text-gray-600 text-sm">No low stock alerts at the moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="gaming-card">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{product.name}</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">
                        {product.product_type} • {product.compatibility}
                      </p>
                    </div>
                    <Badge className={
                      product.available_stock === 0
                        ? 'bg-red-500/20 text-red-400 border-red-500/50'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                    }>
                      {product.available_stock === 0 ? 'OUT' : 'LOW'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stock Indicator */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current Stock</span>
                      <span className={`font-bold ${
                        product.available_stock === 0 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {product.available_stock} / {product.total_stock}
                      </span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          product.available_stock === 0
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${(product.available_stock / product.total_stock) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rental Price</span>
                      <span className="text-neon font-bold">₹{product.rental_price}/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Stock</span>
                      <span className="text-white">{product.total_stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Currently Rented</span>
                      <span className="text-cyan-400">{product.total_stock - product.available_stock}</span>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="p-3 glass-card rounded-lg">
                    <div className="flex items-start space-x-2">
                      {product.available_stock === 0 ? (
                        <>
                          <TrendingDown className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-400 font-semibold text-sm">Out of Stock</p>
                            <p className="text-gray-500 text-xs mt-1">All units are currently rented</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-yellow-400 font-semibold text-sm">Low Stock Warning</p>
                            <p className="text-gray-500 text-xs mt-1">Only {product.available_stock} unit{product.available_stock !== 1 ? 's' : ''} left</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href="/admin/products">
                    <Button
                      variant="outline"
                      className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Update Stock
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

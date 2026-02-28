'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, DollarSign, Box, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductManagementPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product_type: 'Console',
    compatibility: 'PS5',
    rental_price: '',
    min_rental_period: '1',
    min_rental_unit: 'Day',
    extension_rule: 'Full Day Only',
    extension_multiplier: '1.0',
    total_stock: '',
    is_active: true,
    photo_url: '',
  });

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

    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch all products (both active and inactive)
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      const url = editingProduct 
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success(editingProduct ? 'Product updated!' : 'Product created!');
        setIsDialogOpen(false);
        resetForm();
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save product');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      product_type: product.product_type,
      compatibility: product.compatibility,
      rental_price: product.rental_price.toString(),
      min_rental_period: product.min_rental_period.toString(),
      min_rental_unit: product.min_rental_unit,
      extension_rule: product.extension_rule,
      extension_multiplier: product.extension_multiplier.toString(),
      total_stock: product.total_stock.toString(),
      is_active: product.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Product deleted!');
        fetchProducts();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      product_type: 'Console',
      compatibility: 'PS5',
      rental_price: '',
      min_rental_period: '1',
      min_rental_unit: 'Day',
      extension_rule: 'Full Day Only',
      extension_multiplier: '1.0',
      total_stock: '',
      is_active: true,
    });
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
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient">
              Product Management
            </h1>
            <p className="text-gray-400">Manage your gaming inventory</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-gaming h-12 px-6">
                <Plus className="mr-2 h-5 w-5" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-white/10">
              <DialogHeader>
                <DialogTitle className="text-2xl text-gradient">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fill in the product details below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Product Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Product Type *</Label>
                    <Select
                      value={formData.product_type}
                      onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                    >
                      <SelectTrigger className="bg-black/50 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Console">Console</SelectItem>
                        <SelectItem value="Accessory">Accessory</SelectItem>
                        <SelectItem value="Game">Game</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Compatibility *</Label>
                    <Select
                      value={formData.compatibility}
                      onValueChange={(value) => setFormData({ ...formData, compatibility: value })}
                    >
                      <SelectTrigger className="bg-black/50 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PS5">PS5</SelectItem>
                        <SelectItem value="PS4">PS4</SelectItem>
                        <SelectItem value="PS4 & PS5">PS4 & PS5</SelectItem>
                        <SelectItem value="Xbox One">Xbox One</SelectItem>
                        <SelectItem value="Xbox Series X/S">Xbox Series X/S</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Rental Price (₹/day) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.rental_price}
                      onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-white">Min Rental Period *</Label>
                    <Input
                      type="number"
                      value={formData.min_rental_period}
                      onChange={(e) => setFormData({ ...formData, min_rental_period: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Unit</Label>
                    <Select
                      value={formData.min_rental_unit}
                      onValueChange={(value) => setFormData({ ...formData, min_rental_unit: value })}
                    >
                      <SelectTrigger className="bg-black/50 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hour">Hour</SelectItem>
                        <SelectItem value="Day">Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Total Stock *</Label>
                    <Input
                      type="number"
                      value={formData.total_stock}
                      onChange={(e) => setFormData({ ...formData, total_stock: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Extension Rule</Label>
                    <Select
                      value={formData.extension_rule}
                      onValueChange={(value) => setFormData({ ...formData, extension_rule: value })}
                    >
                      <SelectTrigger className="bg-black/50 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hourly">Hourly</SelectItem>
                        <SelectItem value="Half Day">Half Day</SelectItem>
                        <SelectItem value="Full Day Only">Full Day Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Extension Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.extension_multiplier}
                      onChange={(e) => setFormData({ ...formData, extension_multiplier: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 glass-card rounded-lg">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-black/50"
                  />
                  <Label htmlFor="is_active" className="text-white cursor-pointer">Product is Active</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-gaming">
                    {editingProduct ? 'Update' : 'Create'} Product
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="gaming-card">
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-700" />
              <p className="text-gray-400 text-lg mb-2">No products found</p>
              <p className="text-gray-600 text-sm">Add your first product to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="responsive-grid">
            {products.map((product) => (
              <Card key={product.id} className="gaming-card">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{product.name}</CardTitle>
                      <CardDescription className="text-gray-400 text-sm mt-1">
                        {product.product_type} • {product.compatibility}
                      </CardDescription>
                    </div>
                    <Badge className={product.is_active ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-gray-500/20 text-gray-400 border-gray-500/50'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-400">
                        <DollarSign className="mr-2 h-4 w-4 text-cyan-400" />
                        Price
                      </div>
                      <span className="text-neon font-bold text-lg">₹{product.rental_price}/day</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-400">
                        <Box className="mr-2 h-4 w-4 text-cyan-400" />
                        Stock
                      </div>
                      <span className="text-white font-medium">
                        {product.available_stock}/{product.total_stock}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Min Period</span>
                      <span className="text-white">
                        {product.min_rental_period} {product.min_rental_unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => handleEdit(product)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(product.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

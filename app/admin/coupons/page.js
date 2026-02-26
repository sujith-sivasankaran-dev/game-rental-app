'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Ticket } from 'lucide-react';
import { toast } from 'sonner';

export default function CouponManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'Percentage',
    discount_value: '',
    applicable_to: 'All',
    applicable_product_type: '',
    usage_limit: '100',
    per_user_limit: '1',
    expiry_date: '',
    min_order_value: '0',
    is_active: true,
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

    fetchCoupons(token);
  }, []);

  const fetchCoupons = async (token) => {
    try {
      const response = await fetch('/api/coupons', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (error) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const dataToSend = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        usage_limit: parseInt(formData.usage_limit),
        per_user_limit: parseInt(formData.per_user_limit),
        min_order_value: parseFloat(formData.min_order_value),
        expiry_date: new Date(formData.expiry_date).toISOString(),
      };

      const url = editingCoupon 
        ? `/api/coupons/${editingCoupon.id}`
        : '/api/coupons';
      
      const method = editingCoupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        toast.success(editingCoupon ? 'Coupon updated!' : 'Coupon created!');
        setIsDialogOpen(false);
        resetForm();
        fetchCoupons(token);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save coupon');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      applicable_to: coupon.applicable_to,
      applicable_product_type: coupon.applicable_product_type || '',
      usage_limit: coupon.usage_limit.toString(),
      per_user_limit: coupon.per_user_limit.toString(),
      expiry_date: coupon.expiry_date.split('T')[0],
      min_order_value: (coupon.min_order_value || 0).toString(),
      is_active: coupon.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Coupon deleted!');
        fetchCoupons(token);
      } else {
        toast.error('Failed to delete coupon');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discount_type: 'Percentage',
      discount_value: '',
      applicable_to: 'All',
      applicable_product_type: '',
      usage_limit: '100',
      per_user_limit: '1',
      expiry_date: '',
      min_order_value: '0',
      is_active: true,
    });
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400">Loading coupons...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10 p-8">
      <div className="container mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Coupon Management
          </h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 glow-purple">
                <Plus className="mr-2 h-4 w-4" />
                Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-purple-500/30">
              <DialogHeader>
                <DialogTitle className="text-purple-400">
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configure coupon settings
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Coupon Code *</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="bg-gray-800 border-purple-500/30 text-white"
                      required
                    />
                    <Button
                      type="button"
                      onClick={generateCode}
                      variant="outline"
                      className="border-purple-500/50 text-purple-400"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Discount Type *</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-purple-500/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Percentage">Percentage (%)</SelectItem>
                        <SelectItem value="Flat">Flat Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Discount Value *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="bg-gray-800 border-purple-500/30 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Applicable To *</Label>
                  <Select
                    value={formData.applicable_to}
                    onValueChange={(value) => setFormData({ ...formData, applicable_to: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Products</SelectItem>
                      <SelectItem value="Product Type">Specific Product Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.applicable_to === 'Product Type' && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Product Type</Label>
                    <Select
                      value={formData.applicable_product_type}
                      onValueChange={(value) => setFormData({ ...formData, applicable_product_type: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-purple-500/30 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Console">Console</SelectItem>
                        <SelectItem value="Accessory">Accessory</SelectItem>
                        <SelectItem value="Game">Game</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Total Usage Limit *</Label>
                    <Input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      className="bg-gray-800 border-purple-500/30 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Per User Limit *</Label>
                    <Input
                      type="number"
                      value={formData.per_user_limit}
                      onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                      className="bg-gray-800 border-purple-500/30 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Min Order Value ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                      className="bg-gray-800 border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Expiry Date *</Label>
                    <Input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="bg-gray-800 border-purple-500/30 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_active" className="text-gray-300">Coupon is Active</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 glow-purple">
                    {editingCoupon ? 'Update' : 'Create'} Coupon
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Coupons List */}
        {coupons.length === 0 ? (
          <Card className="card-gaming">
            <CardContent className="pt-6 text-center text-gray-400">
              <Ticket className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No coupons found. Create your first coupon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="card-gaming">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl text-purple-400 font-mono">
                        {coupon.code}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {coupon.discount_value}{coupon.discount_type === 'Percentage' ? '%' : '$'} off
                      </CardDescription>
                    </div>
                    <Badge className={coupon.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Applicable:</span>
                      <span className="text-white">{coupon.applicable_to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Usage:</span>
                      <span className="text-white">
                        {coupon.times_used}/{coupon.usage_limit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Per User:</span>
                      <span className="text-white">{coupon.per_user_limit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Order:</span>
                      <span className="text-white">${coupon.min_order_value || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expires:</span>
                      <span className="text-white">
                        {new Date(coupon.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button
                      onClick={() => handleEdit(coupon)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(coupon.id)}
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

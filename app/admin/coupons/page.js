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
import { Plus, Edit, Trash2, Ticket, Zap, Percent, DollarSign, Calendar, Users } from 'lucide-react';
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
          'Authorization': `Bearer ₹{token}`,
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
        ? `/api/coupons/₹{editingCoupon.id}`
        : '/api/coupons';
      
      const method = editingCoupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ₹{token}`,
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
      const response = await fetch(`/api/coupons/₹{couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ₹{token}`,
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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
          <p className="text-gray-400">Loading coupons...</p>
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
              Coupon Management
            </h1>
            <p className="text-gray-400">Create and manage discount codes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-gaming h-12 px-6">
                <Plus className="mr-2 h-5 w-5" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-white/10">
              <DialogHeader>
                <DialogTitle className="text-2xl text-gradient">
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configure discount code settings
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-white">Coupon Code *</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500 font-mono"
                      placeholder="SUMMER2025"
                      required
                    />
                    <Button
                      type="button"
                      onClick={generateCode}
                      className="border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Discount Type *</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                    >
                      <SelectTrigger className="bg-black/50 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Percentage">Percentage (%)</SelectItem>
                        <SelectItem value="Flat">Flat Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Discount Value *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      placeholder={formData.discount_type === 'Percentage' ? '10' : '20'}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Applicable To *</Label>
                  <Select
                    value={formData.applicable_to}
                    onValueChange={(value) => setFormData({ ...formData, applicable_to: value })}
                  >
                    <SelectTrigger className="bg-black/50 border-white/10 text-white">
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
                    <Label className="text-white">Product Type</Label>
                    <Select
                      value={formData.applicable_product_type}
                      onValueChange={(value) => setFormData({ ...formData, applicable_product_type: value })}
                    >
                      <SelectTrigger className="bg-black/50 border-white/10 text-white">
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
                    <Label className="text-white">Total Usage Limit *</Label>
                    <Input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Per User Limit *</Label>
                    <Input
                      type="number"
                      value={formData.per_user_limit}
                      onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Min Order Value (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Expiry Date *</Label>
                    <Input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      required
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
                  <Label htmlFor="is_active" className="text-white cursor-pointer">Coupon is Active</Label>
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
                    {editingCoupon ? 'Update' : 'Create'} Coupon
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Coupons Grid */}
        {coupons.length === 0 ? (
          <Card className="gaming-card">
            <CardContent className="pt-12 pb-12 text-center">
              <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-700" />
              <p className="text-gray-400 text-lg mb-2">No coupons found</p>
              <p className="text-gray-600 text-sm">Create your first discount code</p>
            </CardContent>
          </Card>
        ) : (
          <div className="responsive-grid">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="gaming-card">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-mono text-neon">
                        {coupon.code}
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-sm mt-2">
                        {coupon.discount_value}{coupon.discount_type === 'Percentage' ? '%' : '₹'} off • {coupon.applicable_to}
                      </CardDescription>
                    </div>
                    <Badge className={coupon.is_active ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-gray-500/20 text-gray-400 border-gray-500/50'}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-400">
                        {coupon.discount_type === 'Percentage' ? (
                          <Percent className="mr-2 h-4 w-4 text-cyan-400" />
                        ) : (
                          <DollarSign className="mr-2 h-4 w-4 text-cyan-400" />
                        )}
                        Discount
                      </div>
                      <span className="text-white font-bold">
                        {coupon.discount_value}{coupon.discount_type === 'Percentage' ? '%' : '₹'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-400">
                        <Users className="mr-2 h-4 w-4 text-cyan-400" />
                        Usage
                      </div>
                      <span className="text-white">
                        {coupon.times_used}/{coupon.usage_limit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Per User</span>
                      <span className="text-white">{coupon.per_user_limit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-400">
                        <DollarSign className="mr-2 h-4 w-4 text-cyan-400" />
                        Min Order
                      </div>
                      <span className="text-white">₹{coupon.min_order_value || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-400">
                        <Calendar className="mr-2 h-4 w-4 text-cyan-400" />
                        Expires
                      </div>
                      <span className="text-white">
                        {new Date(coupon.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => handleEdit(coupon)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Package, Tag, ArrowLeft, ShoppingCart, CheckCircle, MapPin, Plus, Navigation, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import LocationPicker from '@/components/LocationPicker';

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isNewAddressDialogOpen, setIsNewAddressDialogOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [availability, setAvailability] = useState(null);
  
  const [formData, setFormData] = useState({
    start_date: '',
    rental_duration: 1,
    coupon_code: '',
  });

  const [newAddressData, setNewAddressData] = useState({
    label: '',
    full_address: '',
    latitude: 0,
    longitude: 0,
    landmark: '',
    phone: '',
  });
  
  const [priceBreakdown, setPriceBreakdown] = useState({
    base_price: 0,
    discount: 0,
    total: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      toast.error('Please login to book a rental');
      router.push('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
    fetchProduct();
    fetchAddresses(token);
  }, [productId]);

  useEffect(() => {
    if (product && formData.rental_duration) {
      calculatePrice();
    }
  }, [product, formData.rental_duration]);

  // Check availability when dates change
  useEffect(() => {
    if (product && formData.start_date && formData.rental_duration) {
      checkAvailability();
    }
  }, [formData.start_date, formData.rental_duration, product]);

  const checkAvailability = async () => {
    if (!formData.start_date || !product) return;
    
    setCheckingAvailability(true);
    try {
      const startDate = new Date(formData.start_date);
      const durationHours = product.min_rental_unit === 'Hour' 
        ? formData.rental_duration 
        : formData.rental_duration * 24;
      const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
      
      const response = await fetch(
        `/api/products/${productId}/availability?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        
        // Set default start date to today
        const today = new Date();
        today.setHours(today.getHours() + 1);
        const formattedDate = today.toISOString().slice(0, 16);
        setFormData(prev => ({ ...prev, start_date: formattedDate }));
      } else {
        toast.error('Product not found');
        router.push('/');
      }
    } catch (error) {
      toast.error('Failed to load product');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async (token) => {
    try {
      const response = await fetch('/api/addresses', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        // Auto-select default address
        const defaultAddress = data.find(a => a.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      }
    } catch (error) {
      console.error('Failed to load addresses');
    }
  };

  const calculatePrice = () => {
    if (!product) return;
    
    const days = formData.rental_duration;
    const basePrice = product.rental_price * days;
    
    setPriceBreakdown({
      base_price: basePrice,
      discount: 0,
      total: basePrice,
    });
  };

  const applyCoupon = async () => {
    if (!formData.coupon_code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/coupons/validate?code=${formData.coupon_code}&product_id=${productId}&amount=${priceBreakdown.base_price}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPriceBreakdown({
          base_price: priceBreakdown.base_price,
          discount: data.discount_amount,
          total: priceBreakdown.base_price - data.discount_amount,
        });
        toast.success('Coupon applied successfully!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Invalid coupon code');
      }
    } catch (error) {
      toast.error('Failed to validate coupon');
    }
  };

  const handleNewAddressLocationSelect = (location) => {
    setNewAddressData(prev => ({
      ...prev,
      full_address: location.full_address,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  const handleSaveNewAddress = async () => {
    if (!newAddressData.label || !newAddressData.full_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    const token = localStorage.getItem('token');
    
    // If no map location selected, set default coordinates (0, 0) to indicate manual entry
    const dataToSend = {
      ...newAddressData,
      latitude: newAddressData.latitude || 0,
      longitude: newAddressData.longitude || 0,
    };
    
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const newAddress = await response.json();
        setAddresses([...addresses, newAddress]);
        setSelectedAddressId(newAddress.id);
        setIsNewAddressDialogOpen(false);
        setNewAddressData({
          label: '',
          full_address: '',
          latitude: 0,
          longitude: 0,
          landmark: '',
          phone: '',
        });
        toast.success('Address saved!');
      } else {
        toast.error('Failed to save address');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.start_date) {
      toast.error('Please select a start date');
      return;
    }

    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    if (product.available_stock < 1) {
      toast.error('This product is currently out of stock');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    // Get selected address details
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

    try {
      // Convert duration to hours based on product's min_rental_unit
      const durationInHours = product.min_rental_unit === 'Hour' 
        ? formData.rental_duration 
        : formData.rental_duration * 24;

      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          start_date: new Date(formData.start_date).toISOString(),
          rental_duration: durationInHours,
          coupon_code: formData.coupon_code || null,
          delivery_address: selectedAddress ? {
            address_id: selectedAddress.id,
            full_address: selectedAddress.full_address,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude,
            landmark: selectedAddress.landmark || null,
            phone: selectedAddress.phone || null,
          } : null,
        }),
      });

      if (response.ok) {
        toast.success('Rental booked successfully!');
        router.push('/account');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to book rental');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
          <p className="text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-cyan-400 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Details */}
          <div className="space-y-6">
            <Card className="gaming-card overflow-hidden">
              {product.photo_url && (
                <div className="h-64 bg-gradient-to-br from-gray-800 to-gray-900">
                  <img 
                    src={product.photo_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-white">{product.name}</CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      {product.product_type} • {product.compatibility}
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                    {product.total_stock} Total Units
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400">{product.description}</p>
                
                {/* Date-based Availability Display */}
                {availability && (
                  <div className={`p-4 rounded-lg border ${availability.available 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {availability.available ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )}
                      <span className={`font-semibold ${availability.available ? 'text-green-400' : 'text-red-400'}`}>
                        {availability.message}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {availability.quantity} of {availability.total_stock} units available for selected dates
                    </p>
                    {availability.booked_units > 0 && (
                      <p className="text-gray-500 text-xs mt-1">
                        ({availability.booked_units} already booked during this period)
                      </p>
                    )}
                  </div>
                )}
                
                {checkingAvailability && (
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                      <span className="text-gray-400 text-sm">Checking availability...</span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-sm">Rental Price</p>
                    <p className="text-2xl font-bold text-neon">₹{product.rental_price}<span className="text-sm text-gray-400">/{product.min_rental_unit}</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-sm">Min Rental Period</p>
                    <p className="text-lg text-white">{product.min_rental_period} {product.min_rental_unit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="space-y-6">
            <Card className="gaming-card">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5 text-cyan-400" />
                  Book Rental
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Fill in the details to complete your booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-cyan-400" />
                      Start Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      min={new Date().toISOString().slice(0, 16)}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* Rental Duration */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-cyan-400" />
                      Rental Duration ({product.min_rental_unit}s)
                    </Label>
                    <Input
                      type="number"
                      min={product.min_rental_period}
                      value={formData.rental_duration}
                      onChange={(e) => setFormData({ ...formData, rental_duration: parseInt(e.target.value) || 1 })}
                      className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      required
                    />
                    <p className="text-xs text-gray-500">Minimum: {product.min_rental_period} {product.min_rental_unit}(s)</p>
                  </div>

                  {/* Delivery Address Selection */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-cyan-400" />
                      Delivery Address *
                    </Label>
                    <div className="flex gap-2">
                      <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                        <SelectTrigger className="bg-black/50 border-white/10 text-white flex-1">
                          <SelectValue placeholder="Select an address" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          {addresses.map((addr) => (
                            <SelectItem key={addr.id} value={addr.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{addr.label}</span>
                                {addr.is_default && (
                                  <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Default</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setIsNewAddressDialogOpen(true)}
                        className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Show selected address details */}
                    {selectedAddress && (
                      <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30 mt-2">
                        <p className="text-white text-sm">{selectedAddress.full_address}</p>
                        {selectedAddress.landmark && (
                          <p className="text-gray-400 text-xs mt-1">Landmark: {selectedAddress.landmark}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center">
                      <Tag className="mr-2 h-4 w-4 text-cyan-400" />
                      Coupon Code (Optional)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={formData.coupon_code}
                        onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                        placeholder="Enter coupon code"
                        className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                      />
                      <Button 
                        type="button" 
                        onClick={applyCoupon}
                        variant="outline" 
                        className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 p-4 glass-card rounded-lg">
                    <h4 className="text-white font-semibold">Price Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Base Price ({formData.rental_duration} {product.min_rental_unit}s × ₹{product.rental_price})</span>
                        <span className="text-white">₹{priceBreakdown.base_price.toFixed(2)}</span>
                      </div>
                      {priceBreakdown.discount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Discount</span>
                          <span>-₹{priceBreakdown.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-white/10">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-2xl font-bold text-neon">₹{priceBreakdown.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full btn-gaming h-12 text-lg"
                    disabled={submitting || product.available_stock < 1 || !selectedAddressId}
                  >
                    {submitting ? (
                      <>
                        <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* New Address Dialog */}
      <Dialog open={isNewAddressDialogOpen} onOpenChange={setIsNewAddressDialogOpen}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Address</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a location on the map and fill in the details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Map Picker */}
            <LocationPicker 
              onLocationSelect={handleNewAddressLocationSelect}
              height="250px"
            />

            {/* Manual Address Input */}
            <div className="space-y-2">
              <Label className="text-white">Full Address *</Label>
              <textarea
                value={newAddressData.full_address}
                onChange={(e) => setNewAddressData({ ...newAddressData, full_address: e.target.value })}
                placeholder="Enter your complete address (e.g., 123, 4th Floor, ABC Apartments, MG Road, Bangalore - 560001)"
                className="w-full min-h-[80px] px-3 py-2 bg-black/50 border border-white/10 rounded-md text-white placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
              <p className="text-xs text-gray-500">You can type your address manually or select from the map above</p>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white">Label *</Label>
                <Input
                  value={newAddressData.label}
                  onChange={(e) => setNewAddressData({ ...newAddressData, label: e.target.value })}
                  placeholder="Home, Office, etc."
                  className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Contact Phone</Label>
                <Input
                  value={newAddressData.phone}
                  onChange={(e) => setNewAddressData({ ...newAddressData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Landmark (Optional)</Label>
              <Input
                value={newAddressData.landmark}
                onChange={(e) => setNewAddressData({ ...newAddressData, landmark: e.target.value })}
                placeholder="Near school, opposite mall, etc."
                className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewAddressDialogOpen(false)}
                className="border-white/10 text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveNewAddress} className="btn-gaming">
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

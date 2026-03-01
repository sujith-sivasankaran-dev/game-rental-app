'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, DollarSign, Package, User, Mail, Phone, MapPin, Plus, Edit, Trash2, Star, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '@/components/LocationPicker';

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    label: '',
    full_address: '',
    latitude: 0,
    longitude: 0,
    landmark: '',
    phone: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchRentals(token);
    fetchAddresses(token);
  }, []);

  const fetchRentals = async (token) => {
    try {
      const response = await fetch('/api/rentals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRentals(data);
      }
    } catch (error) {
      toast.error('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async (token) => {
    try {
      const response = await fetch('/api/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Failed to load addresses');
    }
  };

  const handleLocationSelect = (location) => {
    setAddressFormData(prev => ({
      ...prev,
      full_address: location.full_address,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!addressFormData.full_address || !addressFormData.latitude) {
      toast.error('Please select a location on the map');
      return;
    }

    if (!addressFormData.label) {
      toast.error('Please enter a label for this address');
      return;
    }

    try {
      const url = editingAddress 
        ? `/api/addresses/${editingAddress.id}`
        : '/api/addresses';
      
      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressFormData),
      });

      if (response.ok) {
        toast.success(editingAddress ? 'Address updated!' : 'Address added!');
        setIsAddressDialogOpen(false);
        resetAddressForm();
        fetchAddresses(token);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save address');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressFormData({
      label: address.label,
      full_address: address.full_address,
      latitude: address.latitude,
      longitude: address.longitude,
      landmark: address.landmark || '',
      phone: address.phone || '',
    });
    setIsAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Address deleted');
        fetchAddresses(token);
      } else {
        toast.error('Failed to delete address');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleSetDefault = async (addressId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/addresses/${addressId}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Default address updated');
        fetchAddresses(token);
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const resetAddressForm = () => {
    setEditingAddress(null);
    setAddressFormData({
      label: '',
      full_address: '',
      latitude: 0,
      longitude: 0,
      landmark: '',
      phone: '',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400 border-green-500/50',
      extended: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      completed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return colors[status] || colors.active;
  };

  const openGoogleMapsDirections = (address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
          <p className="text-gray-400">Loading account...</p>
        </div>
      </div>
    );
  }

  const activeRentals = rentals.filter(r => r.status === 'active' || r.status === 'extended');
  const pastRentals = rentals.filter(r => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient">
            My Account
          </h1>
          <p className="text-gray-400">Manage your profile, addresses, and rentals</p>
        </div>

        {/* Profile Card */}
        <Card className="gaming-card mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="h-5 w-5 mr-2 text-cyan-400" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center space-x-3 p-3 glass-card rounded-lg">
                <User className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-white font-medium">{user?.full_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 glass-card rounded-lg">
                <Mail className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 glass-card rounded-lg">
                <Phone className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-white font-medium">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Addresses Section */}
        <Card className="gaming-card mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-cyan-400" />
                  Saved Addresses
                </CardTitle>
                <CardDescription className="text-gray-400 mt-1">
                  Manage your delivery addresses
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  resetAddressForm();
                  setIsAddressDialogOpen(true);
                }}
                className="btn-gaming"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-700" />
                <p className="text-gray-400">No saved addresses</p>
                <p className="text-gray-600 text-sm mt-1">Add an address for faster booking</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <div 
                    key={address.id} 
                    className={`p-4 glass-card rounded-lg border ${address.is_default ? 'border-cyan-500/50' : 'border-white/10'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-semibold">{address.label}</span>
                          {address.is_default && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2">{address.full_address}</p>
                        {address.landmark && (
                          <p className="text-gray-500 text-xs mt-1">Landmark: {address.landmark}</p>
                        )}
                        {address.phone && (
                          <p className="text-gray-500 text-xs mt-1">Phone: {address.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openGoogleMapsDirections(address)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Directions
                      </Button>
                      {!address.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <div className="flex-1"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAddress(address)}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Dialog */}
        <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
          <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Select a location on the map and fill in the details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddressSubmit} className="space-y-6 mt-4">
              {/* Map Picker */}
              <LocationPicker 
                initialLocation={editingAddress ? {
                  latitude: editingAddress.latitude,
                  longitude: editingAddress.longitude,
                  full_address: editingAddress.full_address,
                } : null}
                onLocationSelect={handleLocationSelect}
                height="250px"
              />

              {/* Manual Address Input */}
              <div className="space-y-2">
                <Label className="text-white">Full Address *</Label>
                <textarea
                  value={addressFormData.full_address}
                  onChange={(e) => setAddressFormData({ ...addressFormData, full_address: e.target.value })}
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
                    value={addressFormData.label}
                    onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                    placeholder="Home, Office, etc."
                    className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Contact Phone</Label>
                  <Input
                    value={addressFormData.phone}
                    onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                    placeholder="Phone number for this address"
                    className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Landmark (Optional)</Label>
                <Input
                  value={addressFormData.landmark}
                  onChange={(e) => setAddressFormData({ ...addressFormData, landmark: e.target.value })}
                  placeholder="Near school, opposite mall, etc."
                  className="bg-black/50 border-white/10 text-white focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddressDialogOpen(false);
                    resetAddressForm();
                  }}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-gaming">
                  {editingAddress ? 'Update' : 'Save'} Address
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Rentals Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="glass-card border-white/10 mb-6">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Active Rentals ({activeRentals.length})
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Rental History ({pastRentals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeRentals.length === 0 ? (
              <Card className="gaming-card">
                <CardContent className="pt-12 pb-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-400 text-lg">No active rentals</p>
                  <p className="text-gray-600 text-sm mt-2">Browse products to start renting</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {activeRentals.map((rental) => (
                  <Card key={rental.id} className="gaming-card">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-white text-lg">
                            {rental.product_name}
                          </CardTitle>
                          <CardDescription className="text-gray-400 text-xs mt-1">
                            ID: {rental.id.slice(0, 8)}...
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(rental.status)}>
                          {rental.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <Calendar className="mr-2 h-4 w-4 text-cyan-400" />
                            Start Date
                          </div>
                          <span className="text-white font-medium">
                            {new Date(rental.start_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <Clock className="mr-2 h-4 w-4 text-cyan-400" />
                            Return Date
                          </div>
                          <span className="text-white font-medium">
                            {new Date(rental.extended_end_date || rental.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <DollarSign className="mr-2 h-4 w-4 text-green-400" />
                            Total Price
                          </div>
                          <span className="text-white font-bold text-lg">
                            ₹{rental.total_price}
                          </span>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {rental.delivery_address && (
                        <div className="p-3 glass-card rounded-lg">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Delivery Address</p>
                              <p className="text-white text-sm line-clamp-2">{rental.delivery_address.full_address}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openGoogleMapsDirections(rental.delivery_address)}
                              className="text-cyan-400 hover:bg-cyan-500/10"
                            >
                              <Navigation className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {rental.coupon_code && (
                        <div className="p-3 glass-card rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Coupon Applied</span>
                            <div className="text-right">
                              <span className="text-cyan-400 font-mono font-bold block">{rental.coupon_code}</span>
                              <span className="text-green-400 text-xs">-₹{rental.discount_amount}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full btn-gaming"
                        onClick={() => toast.info('Extension feature coming soon!')}
                      >
                        Extend Rental
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {pastRentals.length === 0 ? (
              <Card className="gaming-card">
                <CardContent className="pt-12 pb-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-400 text-lg">No rental history</p>
                  <p className="text-gray-600 text-sm mt-2">Your completed rentals will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastRentals.map((rental) => (
                  <Card key={rental.id} className="gaming-card">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg">{rental.product_name}</h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(rental.status)}>
                            {rental.status}
                          </Badge>
                          <div className="text-right">
                            <p className="text-white font-bold text-xl">₹{rental.total_price}</p>
                            {rental.coupon_code && (
                              <p className="text-green-400 text-xs">Saved ₹{rental.discount_amount}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

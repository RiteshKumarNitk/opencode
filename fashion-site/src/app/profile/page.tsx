'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesApi, authApi, profileApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores';
import Link from 'next/link';
import AddressForm from '@/components/AddressForm';

export default function ProfilePage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });

  const { data: userRaw } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
  });

  const user = userRaw as { firstName?: string; lastName?: string; phone?: string; email?: string; role?: string } | undefined;

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list(),
    enabled: isAuthenticated,
  });

  const addressList: any[] = (addresses as any[]) || [];

  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; phone?: string }) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditingProfile(false);
    },
  });

  const startEditProfile = () => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    });
    setEditingProfile(true);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">👤</div>
        <p className="text-gray-500 text-lg mb-4">Please login to view your profile</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  const editingAddress = editingId ? addressList.find((a: any) => a.id === editingId) : null;

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            {!editingProfile && (
              <button onClick={startEditProfile} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit profile">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>

          {editingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" required value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" required value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="Enter phone number" />
              </div>
              {updateProfileMutation.isError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">Failed to update profile</div>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={updateProfileMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg transition disabled:opacity-50">
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span className="text-sm text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm text-gray-600">{user?.phone || 'No phone added'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm text-gray-600 capitalize">{user?.role?.toLowerCase()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Saved Addresses</h2>
            <span className="text-sm text-gray-400">{addressList.length} saved</span>
          </div>

          {addressList.length === 0 && !showForm ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-400 text-sm mb-3">No addresses saved yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-indigo-600 font-medium text-sm hover:underline"
              >
                + Add Address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addressList.map((addr: any) => (
                <div key={addr.id} className="p-4 border border-gray-100 rounded-xl">
                  {editingId === addr.id ? (
                    <AddressForm
                      initialData={addr}
                      onSuccess={handleFormSuccess}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{addr.label || 'Home'}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-600 text-[10px] font-semibold">Default</span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-gray-900">{addr.fullName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {addr.line1}{addr.line2 && `, ${addr.line2}`}, {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{addr.phone}</p>
                      </div>
                      <button
                        onClick={() => setEditingId(addr.id)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit address"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new address form or button */}
              {showForm ? (
                <div className="p-4 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Add New Address</p>
                  <AddressForm
                    onSuccess={handleFormSuccess}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition"
                >
                  + Add New Address
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { href: '/orders', icon: '📦', label: 'My Orders', desc: 'Track & manage' },
          { href: '/wishlist', icon: '❤️', label: 'Wishlist', desc: 'Saved items' },
          { href: '/cart', icon: '🛒', label: 'Cart', desc: 'View items' },
          { href: '/products', icon: '🛍️', label: 'Shop', desc: 'Browse products' },
          { href: '/', icon: '🏠', label: 'Home', desc: 'Back to home' },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="bg-white border border-gray-100 rounded-2xl p-5 text-center card-hover">
            <span className="text-3xl">{link.icon}</span>
            <p className="font-semibold text-gray-900 mt-2 text-sm">{link.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

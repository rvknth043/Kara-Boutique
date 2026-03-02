'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiUser, FiMapPin, FiShoppingBag, FiHeart, FiSettings, FiLogOut } from 'react-icons/fi';

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }

    fetchUserStats();
  }, [isAuthenticated, user]);

  const fetchUserStats = async () => {
    try {
      const [ordersRes, wishlistRes, addressesRes] = await Promise.all([
        api.get('/orders'),
        api.get('/wishlist'),
        api.get('/users/addresses'),
      ]);

      const ordersData = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : (Array.isArray(ordersRes.data?.data?.orders) ? ordersRes.data.data.orders : []);
      const wishlistData = Array.isArray(wishlistRes.data?.data) ? wishlistRes.data.data : [];
      const addressesData = Array.isArray(addressesRes.data?.data) ? addressesRes.data.data : [];

      setStats({
        totalOrders: ordersData.length,
        wishlistItems: wishlistData.length,
        savedAddresses: addressesData.length,
      });
    } catch (error) {
      console.error('Failed to fetch user stats');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, string> = {};
    const nextFullName = formData.full_name.trim();
    const nextPhone = formData.phone.trim();

    if (nextFullName && nextFullName !== (user?.full_name || '')) payload.full_name = nextFullName;
    if (nextPhone !== (user?.phone || '')) payload.phone = nextPhone;

    if (!Object.keys(payload).length) {
      toast('No profile changes to save');
      setEditing(false);
      return;
    }

    try {
      await api.put('/users/profile', payload);
      toast.success('Profile updated successfully');
      setEditing(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Header />
      
      <main className="py-5">
        <div className="container">
          <h2 className="mb-4">My Account</h2>

          <div className="row">
            {/* Sidebar */}
            <div className="col-md-3 mb-4">
              <div className="list-group">
                <Link
                  href="/account"
                  className="list-group-item list-group-item-action active"
                >
                  <FiUser className="me-2" />
                  Profile
                </Link>
                <Link
                  href="/orders"
                  className="list-group-item list-group-item-action"
                >
                  <FiShoppingBag className="me-2" />
                  My Orders
                </Link>
                <Link
                  href="/account/addresses"
                  className="list-group-item list-group-item-action"
                >
                  <FiMapPin className="me-2" />
                  Addresses
                </Link>
                <Link
                  href="/wishlist"
                  className="list-group-item list-group-item-action"
                >
                  <FiHeart className="me-2" />
                  Wishlist
                </Link>
                <button
                  onClick={handleLogout}
                  className="list-group-item list-group-item-action text-danger"
                >
                  <FiLogOut className="me-2" />
                  Logout
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-md-9">
              {/* Stats Cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="card text-center">
                    <div className="card-body">
                      <FiShoppingBag size={32} color="#D4A373" className="mb-2" />
                      <h3 className="mb-0">{stats?.totalOrders || 0}</h3>
                      <p className="text-muted small mb-0">Total Orders</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-center">
                    <div className="card-body">
                      <FiHeart size={32} color="#D4A373" className="mb-2" />
                      <h3 className="mb-0">{stats?.wishlistItems || 0}</h3>
                      <p className="text-muted small mb-0">Wishlist Items</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-center">
                    <div className="card-body">
                      <FiMapPin size={32} color="#D4A373" className="mb-2" />
                      <h3 className="mb-0">{stats?.savedAddresses || 0}</h3>
                      <p className="text-muted small mb-0">Saved Addresses</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              <div className="card">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Profile Information</h5>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
                <div className="card-body">
                  {editing ? (
                    <form onSubmit={handleUpdate}>
                      <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled
                        />
                        <small className="text-muted">Email cannot be changed</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter 10-digit phone number"
                        />
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary">
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="btn btn-outline-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="mb-3">
                        <label className="text-muted small">Full Name</label>
                        <p className="mb-0 fw-medium">{user?.full_name || 'Not provided'}</p>
                      </div>

                      <div className="mb-3">
                        <label className="text-muted small">Email</label>
                        <p className="mb-0">{user?.email}</p>
                      </div>

                      <div className="mb-3">
                        <label className="text-muted small">Phone Number</label>
                        <p className="mb-0">{user?.phone || 'Not provided'}</p>
                      </div>

                      <div className="mb-3">
                        <label className="text-muted small">Account Created</label>
                        <p className="mb-0">
                          {user?.created_at 
                            ? new Date(user.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>

                      {user?.is_verified && (
                        <div className="alert alert-success">
                          <strong>✓ Verified Account</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card mt-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <Link href="/orders" className="btn btn-outline-primary w-100">
                        <FiShoppingBag className="me-2" />
                        View My Orders
                      </Link>
                    </div>
                    <div className="col-md-6">
                      <Link href="/account/addresses" className="btn btn-outline-primary w-100">
                        <FiMapPin className="me-2" />
                        Manage Addresses
                      </Link>
                    </div>
                    <div className="col-md-6">
                      <Link href="/wishlist" className="btn btn-outline-primary w-100">
                        <FiHeart className="me-2" />
                        View Wishlist
                      </Link>
                    </div>
                    <div className="col-md-6">
                      <Link href="/products" className="btn btn-outline-primary w-100">
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

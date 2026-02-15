'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Loading from '@/components/common/Loading';

export default function AddressesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/users/addresses');
      setAddresses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address deleted');
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/users/addresses/${id}/default`);
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to set default');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <div className="row">
            {/* Sidebar */}
            <div className="col-md-3 mb-4">
              <div className="list-group">
                <Link href="/account" className="list-group-item list-group-item-action">
                  Profile
                </Link>
                <Link href="/orders" className="list-group-item list-group-item-action">
                  My Orders
                </Link>
                <Link href="/account/addresses" className="list-group-item list-group-item-action active">
                  Addresses
                </Link>
                <Link href="/wishlist" className="list-group-item list-group-item-action">
                  Wishlist
                </Link>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-md-9">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Delivery Addresses</h2>
                <Link href="/account/addresses/new" className="btn btn-primary">
                  + Add New Address
                </Link>
              </div>

              {loading ? (
                <Loading />
              ) : addresses.length === 0 ? (
                <div className="card">
                  <div className="card-body text-center py-5">
                    <h4 className="text-muted mb-3">No addresses saved yet</h4>
                    <p className="text-muted mb-4">Add your first delivery address to make checkout faster</p>
                    <Link href="/account/addresses/new" className="btn btn-primary">
                      Add Your First Address
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  {addresses.map((address) => (
                    <div key={address.id} className="col-md-6">
                      <div className={`card h-100 ${address.is_default ? 'border-primary' : ''}`}>
                        <div className="card-body">
                          {address.is_default && (
                            <span className="badge bg-primary mb-2">Default Address</span>
                          )}
                          
                          <p className="mb-1 fw-medium">{address.address_line1}</p>
                          {address.address_line2 && (
                            <p className="mb-1 text-muted small">{address.address_line2}</p>
                          )}
                          <p className="mb-1">
                            {address.city}, {address.state}
                          </p>
                          <p className="mb-1">{address.pincode}</p>
                          {address.country && (
                            <p className="mb-3 text-muted">{address.country}</p>
                          )}
                          
                          <div className="d-flex gap-2 flex-wrap">
                            {!address.is_default && (
                              <button
                                onClick={() => handleSetDefault(address.id)}
                                className="btn btn-sm btn-outline-primary"
                              >
                                Set as Default
                              </button>
                            )}
                            <Link
                              href={`/account/addresses/${address.id}/edit`}
                              className="btn btn-sm btn-outline-secondary"
                            >
                              Edit
                            </Link>
                            {!address.is_default && (
                              <button
                                onClick={() => handleDelete(address.id)}
                                className="btn btn-sm btn-outline-danger"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

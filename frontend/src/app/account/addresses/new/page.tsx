'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import toast from 'react-hot-toast';

export default function AddressFormPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const addressId = params?.id as string;
  const isEdit = !!addressId;

  const [formData, setFormData] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    is_default: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (isEdit) {
      fetchAddress();
    }
  }, [isAuthenticated, addressId]);

  const fetchAddress = async () => {
    try {
      const response = await api.get(`/users/addresses/${addressId}`);
      setFormData(response.data.data);
    } catch (error) {
      toast.error('Failed to load address');
      router.push('/account/addresses');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/users/addresses/${addressId}`, formData);
        toast.success('Address updated successfully');
      } else {
        await api.post('/users/addresses', formData);
        toast.success('Address added successfully');
      }
      router.push('/account/addresses');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || fetchLoading) return null;

  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="card">
                <div className="card-body p-4">
                  <h3 className="mb-4">{isEdit ? 'Edit Address' : 'Add New Address'}</h3>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Address Line 1 *</label>
                      <input
                        type="text"
                        name="address_line1"
                        className="form-control"
                        value={formData.address_line1}
                        onChange={handleChange}
                        placeholder="House No, Building Name"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Address Line 2</label>
                      <input
                        type="text"
                        name="address_line2"
                        className="form-control"
                        value={formData.address_line2}
                        onChange={handleChange}
                        placeholder="Road name, Area, Colony"
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          name="city"
                          className="form-control"
                          value={formData.city}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">State *</label>
                        <input
                          type="text"
                          name="state"
                          className="form-control"
                          value={formData.state}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Pincode *</label>
                        <input
                          type="text"
                          name="pincode"
                          className="form-control"
                          value={formData.pincode}
                          onChange={handleChange}
                          placeholder="6-digit pincode"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Country</label>
                        <input
                          type="text"
                          name="country"
                          className="form-control"
                          value={formData.country}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          name="is_default"
                          className="form-check-input"
                          id="is_default"
                          checked={formData.is_default}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="is_default">
                          Set as default address
                        </label>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary flex-grow-1"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : (isEdit ? 'Update Address' : 'Add Address')}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push('/account/addresses')}
                        className="btn btn-outline-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
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

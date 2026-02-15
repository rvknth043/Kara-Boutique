'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const { isAdmin } = useAuth();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    min_order_value: '',
    max_discount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchCoupons();
    }
  }, [isAdmin]);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/coupons');
      setCoupons(response.data.data.coupons || []);
    } catch (error) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        ...formData,
        value: parseFloat(formData.value),
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : undefined,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : undefined,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : undefined,
      });
      toast.success('Coupon created successfully');
      setShowForm(false);
      fetchCoupons();
      setFormData({
        code: '',
        type: 'percentage',
        value: '',
        min_order_value: '',
        max_discount: '',
        usage_limit: '',
        valid_from: '',
        valid_until: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create coupon');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.put(`/coupons/${id}/toggle`);
      toast.success('Coupon status updated');
      fetchCoupons();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Coupon Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Create Coupon'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="mb-3">Create New Coupon</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Coupon Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Type *</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Value *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Min Order Value</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Max Discount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Usage Limit</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Valid From *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Valid Until *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary">Create Coupon</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons List */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No coupons created yet</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min Order</th>
                    <th>Usage</th>
                    <th>Valid Period</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="fw-bold">{coupon.code}</td>
                      <td className="text-capitalize">{coupon.type.replace(/_/g, ' ')}</td>
                      <td>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : 
                         coupon.type === 'fixed' ? `₹${coupon.value}` : '-'}
                      </td>
                      <td>{coupon.min_order_value ? `₹${coupon.min_order_value}` : '-'}</td>
                      <td>
                        {coupon.used_count}/{coupon.usage_limit || '∞'}
                      </td>
                      <td>
                        <small>
                          {new Date(coupon.valid_from).toLocaleDateString('en-IN')} -<br />
                          {new Date(coupon.valid_until).toLocaleDateString('en-IN')}
                        </small>
                      </td>
                      <td>
                        <span className={`badge ${coupon.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggle(coupon.id)}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Toggle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

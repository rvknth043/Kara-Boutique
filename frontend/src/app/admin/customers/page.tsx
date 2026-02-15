'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCustomersPage() {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchCustomers();
      fetchStats();
    }
  }, [isAdmin]);

  const fetchCustomers = async () => {
    try {
      // This would be a new endpoint: GET /api/v1/admin/customers
      const response = await api.get('/analytics/customers');
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Customer Management</h2>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Customers</h6>
              <h3 className="mb-0">{stats?.customers?.total || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">New This Month</h6>
              <h3 className="mb-0 text-success">{stats?.customers?.new_last_30_days || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Active Customers</h6>
              <h3 className="mb-0 text-primary">{stats?.customers?.active || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Avg Orders/Customer</h6>
              <h3 className="mb-0">{stats?.customers?.avg_orders_per_customer?.toFixed(1) || '0.0'}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No customers yet</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                    <th>Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="fw-medium">{customer.full_name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || '-'}</td>
                      <td>{customer.total_orders || 0}</td>
                      <td className="fw-medium">₹{(customer.total_spent || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <small>{new Date(customer.created_at).toLocaleDateString('en-IN')}</small>
                      </td>
                      <td>
                        <span className={`badge ${customer.is_verified ? 'bg-success' : 'bg-warning'}`}>
                          {customer.is_verified ? 'Verified' : 'Pending'}
                        </span>
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

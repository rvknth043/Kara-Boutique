'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FiShoppingBag, 
  FiDollarSign, 
  FiUsers, 
  FiPackage,
  FiTrendingUp,
  FiAlertCircle 
} from 'react-icons/fi';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, ordersRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/orders/admin/all?page=1&limit=10'),
      ]);

      setStats(dashboardRes.data.data);
      setRecentOrders(ordersRes.data.data.orders);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAdmin) return null;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <span className="text-muted">Welcome back, {user?.full_name}!</span>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {/* Total Orders */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted small mb-1">Total Orders</p>
                  <h3 className="mb-0">{stats?.orders?.total || 0}</h3>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: '#e3f2fd' }}>
                  <FiShoppingBag size={24} color="#1976d2" />
                </div>
              </div>
              <div className="d-flex align-items-center">
                <FiTrendingUp size={16} color="#4caf50" className="me-1" />
                <small className="text-success">+12% from last month</small>
              </div>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted small mb-1">Total Revenue</p>
                  <h3 className="mb-0">₹{stats?.orders?.revenue?.toLocaleString('en-IN') || 0}</h3>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: '#e8f5e9' }}>
                  <FiDollarSign size={24} color="#4caf50" />
                </div>
              </div>
              <div className="d-flex align-items-center">
                <small className="text-muted">Avg: ₹{stats?.orders?.average_value?.toFixed(0) || 0}</small>
              </div>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted small mb-1">Total Customers</p>
                  <h3 className="mb-0">{stats?.customers?.total || 0}</h3>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: '#fff3e0' }}>
                  <FiUsers size={24} color="#ff9800" />
                </div>
              </div>
              <div className="d-flex align-items-center">
                <small className="text-muted">New: {stats?.customers?.new_last_30_days || 0}</small>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted small mb-1">Low Stock Items</p>
                  <h3 className="mb-0">{stats?.products?.low_stock || 0}</h3>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: '#ffebee' }}>
                  <FiAlertCircle size={24} color="#f44336" />
                </div>
              </div>
              <div className="d-flex align-items-center">
                <Link href="/admin/inventory" className="small text-decoration-none">
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Orders</h5>
          <Link href="/admin/orders" className="btn btn-sm btn-outline-primary">
            View All
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order: any) => (
                    <tr key={order.id}>
                      <td className="fw-medium">{order.order_number}</td>
                      <td>{order.user_name}</td>
                      <td>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="fw-medium">₹{order.final_amount.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${
                          order.payment_status === 'paid' ? 'bg-success' : 
                          order.payment_status === 'pending' ? 'bg-warning' : 
                          'bg-danger'
                        }`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          order.order_status === 'delivered' ? 'bg-success' : 
                          order.order_status === 'shipped' ? 'bg-info' : 
                          order.order_status === 'cancelled' ? 'bg-danger' :
                          'bg-primary'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td>
                        <Link 
                          href={`/admin/orders/${order.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-3">
        <div className="col-md-4">
          <Link href="/admin/products/new" className="text-decoration-none">
            <div className="card border-0 shadow-sm hover-lift h-100">
              <div className="card-body text-center py-4">
                <FiPackage size={32} color="#D4A373" className="mb-2" />
                <h6 className="mb-0">Add New Product</h6>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="col-md-4">
          <Link href="/admin/orders" className="text-decoration-none">
            <div className="card border-0 shadow-sm hover-lift h-100">
              <div className="card-body text-center py-4">
                <FiShoppingBag size={32} color="#D4A373" className="mb-2" />
                <h6 className="mb-0">Manage Orders</h6>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="col-md-4">
          <Link href="/admin/analytics" className="text-decoration-none">
            <div className="card border-0 shadow-sm hover-lift h-100">
              <div className="card-body text-center py-4">
                <FiTrendingUp size={32} color="#D4A373" className="mb-2" />
                <h6 className="mb-0">View Analytics</h6>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

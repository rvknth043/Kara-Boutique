'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiUsers } from 'react-icons/fi';

export default function AdminAnalyticsPage() {
  const { isAdmin } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  const fetchAnalytics = async () => {
    try {
      const [dashboardRes, chartRes, productsRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/sales-chart?days=30'),
        api.get('/analytics/top-products?limit=10'),
      ]);

      setDashboard(dashboardRes.data.data);
      setSalesChart(chartRes.data.data || []);
      setTopProducts(productsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Analytics & Reports</h2>

      {/* Key Metrics */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted small mb-1">Total Revenue</p>
                  <h3 className="mb-0">₹{(dashboard?.orders?.revenue || 0).toLocaleString('en-IN')}</h3>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: '#e8f5e9' }}>
                  <FiDollarSign size={24} color="#4caf50" />
                </div>
              </div>
              <small className="text-success">
                <FiTrendingUp size={14} /> +12% from last month
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted small mb-1">Total Orders</p>
                  <h3 className="mb-0">{dashboard?.orders?.total || 0}</h3>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: '#e3f2fd' }}>
                  <FiShoppingBag size={24} color="#1976d2" />
                </div>
              </div>
              <small className="text-muted">
                Avg: ₹{(dashboard?.orders?.average_value || 0).toFixed(0)}
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted small mb-1">Customers</p>
                  <h3 className="mb-0">{dashboard?.customers?.total || 0}</h3>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: '#fff3e0' }}>
                  <FiUsers size={24} color="#ff9800" />
                </div>
              </div>
              <small className="text-success">
                +{dashboard?.customers?.new_last_30_days || 0} this month
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted small mb-1">Conversion Rate</p>
                  <h3 className="mb-0">{((dashboard?.orders?.total || 0) / (dashboard?.customers?.total || 1) * 100).toFixed(1)}%</h3>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: '#f3e5f5' }}>
                  <FiTrendingUp size={24} color="#9c27b0" />
                </div>
              </div>
              <small className="text-muted">Orders / Customers</small>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="card mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Sales Trend (Last 30 Days)</h5>
        </div>
        <div className="card-body">
          {salesChart.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesChart.slice(0, 10).map((day: any, index) => (
                    <tr key={index}>
                      <td>{new Date(day.date).toLocaleDateString('en-IN')}</td>
                      <td>{day.orders}</td>
                      <td>₹{day.revenue.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-4">No sales data available</p>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="card-header bg-white">
          <h5 className="mb-0">Top Selling Products</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={product.product_id}>
                    <td>
                      <span className="badge bg-primary">#{index + 1}</span>
                    </td>
                    <td className="fw-medium">{product.product_name}</td>
                    <td>{product.total_quantity}</td>
                    <td className="fw-medium">₹{product.total_revenue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

const asArray = (payload: any) => (Array.isArray(payload) ? payload : Array.isArray(payload?.orders) ? payload.orders : []);

const asNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function AdminOrdersPage() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
  const [filter, setFilter] = useState({
    status: '',
    payment_status: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('order_status', filter.status);
      if (filter.payment_status) params.append('payment_status', filter.payment_status);
      params.append('page', String(filter.page));
      params.append('limit', String(filter.limit));

      const response = await api.get(`/orders/admin/all?${params.toString()}`);
      const payload = response.data?.data;
      setOrders(asArray(payload?.orders || payload));
      setPagination({
        page: Number(payload?.pagination?.page || filter.page),
        limit: Number(payload?.pagination?.limit || filter.limit),
        totalPages: Number(payload?.pagination?.totalPages || 1),
        total: Number(payload?.pagination?.total || 0),
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
      toast.error('Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!confirm(`Update order status to "${newStatus}"?`)) return;

    try {
      await api.put(`/orders/admin/${orderId}/status`, { order_status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update status');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Order Management</h2>
        <small className="text-muted">Total: {pagination.total}</small>
      </div>

      <div className="d-flex gap-2 mb-4">
        <select className="form-select" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value, page: 1 })}>
          <option value="">All Status</option>
          <option value="placed">Placed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="returned">Returned</option>
        </select>

        <select className="form-select" value={filter.payment_status} onChange={(e) => setFilter({ ...filter, payment_status: e.target.value, page: 1 })}>
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5"><p className="text-muted">No orders found</p></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="fw-medium"><Link href={`/admin/orders/${order.id}`}>{order.order_number}</Link></td>
                      <td>
                        <div>{order.user_name || 'N/A'}</div>
                        <small className="text-muted">{order.user_email || '-'}</small>
                      </td>
                      <td><small>{new Date(order.created_at).toLocaleDateString('en-IN')}</small></td>
                      <td>{order.item_count || 0}</td>
                      <td className="fw-medium">₹{asNumber(order.final_amount).toLocaleString('en-IN')}</td>
                      <td><span className="badge bg-secondary">{order.payment_status}</span></td>
                      <td>
                        <select className="form-select form-select-sm" value={order.order_status} onChange={(e) => handleStatusUpdate(order.id, e.target.value)}>
                          <option value="placed">Placed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="returned">Returned</option>
                        </select>
                      </td>
                      <td><Link href={`/admin/orders/${order.id}`} className="btn btn-sm btn-outline-primary">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <button className="btn btn-outline-secondary btn-sm" disabled={filter.page <= 1} onClick={() => setFilter((prev) => ({ ...prev, page: prev.page - 1 }))}>
          Previous
        </button>
        <span className="small text-muted">Page {pagination.page} of {pagination.totalPages}</span>
        <button className="btn btn-outline-secondary btn-sm" disabled={filter.page >= pagination.totalPages} onClick={() => setFilter((prev) => ({ ...prev, page: prev.page + 1 }))}>
          Next
        </button>
      </div>
    </div>
  );
}

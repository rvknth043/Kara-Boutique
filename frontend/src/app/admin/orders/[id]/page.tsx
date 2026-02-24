'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/image';

export default function AdminOrderDetailsPage() {
  const { isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchOrder();
  }, [isAdmin, orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.data);
      setTrackingNumber(response.data.data.tracking_number || '');
    } catch (error) {
      toast.error('Failed to load order');
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!confirm(`Update order status to "${newStatus}"?`)) return;

    setUpdating(true);
    try {
      await api.put(`/orders/admin/${orderId}/status`, {
        order_status: newStatus,
        tracking_number: trackingNumber || undefined,
      });
      toast.success('Order status updated');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${orderId}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.order_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  if (!isAdmin || loading) return null;
  if (!order) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Order #{order.order_number}</h2>
          <p className="text-muted mb-0">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN')}
          </p>
        </div>
        <button onClick={() => router.push('/admin/orders')} className="btn btn-outline-secondary">
          ← Back to Orders
        </button>
      </div>

      <div className="row">
        {/* Main Content */}
        <div className="col-lg-8">
          {/* Customer Info */}
          <div className="card mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">Customer Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p className="mb-1"><strong>Name:</strong> {order.user_name}</p>
                  <p className="mb-1"><strong>Email:</strong> {order.user_email}</p>
                  <p className="mb-0"><strong>Phone:</strong> {order.user_phone || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <p className="mb-1"><strong>Payment Method:</strong> {order.payment_method}</p>
                  <p className="mb-1">
                    <strong>Payment Status:</strong>{' '}
                    <span className={`badge ${
                      order.payment_status === 'paid' ? 'bg-success' : 
                      order.payment_status === 'pending' ? 'bg-warning' : 
                      'bg-danger'
                    }`}>
                      {order.payment_status}
                    </span>
                  </p>
                  {order.transaction_id && (
                    <p className="mb-0"><strong>Transaction ID:</strong> {order.transaction_id}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">Order Items</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Variant</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(order.items) ? order.items : []).map((item: any) => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Image
                              src={resolveImageUrl(item.product_image)}
                              alt={item.product_name}
                              width={50}
                              height={60}
                              style={{ objectFit: 'cover' }}
                            />
                            <span>{item.product_name}</span>
                          </div>
                        </td>
                        <td>
                          {item.variant_size} / {item.variant_color}
                        </td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price.toLocaleString('en-IN')}</td>
                        <td className="fw-medium">₹{item.subtotal.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Shipping Address</h5>
            </div>
            <div className="card-body">
              {order.shipping_address && (
                <>
                  <p className="mb-1">{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p className="mb-1">{order.shipping_address.address_line2}</p>
                  )}
                  <p className="mb-1">
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
                  </p>
                  {order.shipping_address.country && (
                    <p className="mb-0">{order.shipping_address.country}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Order Status */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="mb-3">Order Status</h5>
              
              <div className="mb-3">
                <label className="form-label">Update Status</label>
                <select
                  className="form-select"
                  value={order.order_status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={updating}
                >
                  <option value="placed">Placed</option>
                                    <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Tracking Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>

              <button
                onClick={() => handleStatusUpdate(order.order_status)}
                className="btn btn-primary w-100"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="mb-3">Order Summary</h5>
              
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Shipping</span>
                <span>{order.shipping_charge > 0 ? `₹${order.shipping_charge}` : 'FREE'}</span>
              </div>

              {order.discount_amount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Discount</span>
                  <span>-₹{order.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <hr />

              <div className="d-flex justify-content-between mb-3">
                <strong>Total</strong>
                <strong style={{ color: '#D4A373' }}>
                  ₹{order.final_amount.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-body">
              <h5 className="mb-3">Actions</h5>
              
              <div className="d-grid gap-2">
                <button onClick={handleGenerateInvoice} className="btn btn-outline-primary">
                  Download Invoice
                </button>
                <button className="btn btn-outline-secondary">
                  Email Customer
                </button>
                <button className="btn btn-outline-info">
                  Print Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

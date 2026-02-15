'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Loading from '@/components/common/Loading';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchOrder();
  }, [isAuthenticated, orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.data);
    } catch (error) {
      toast.error('Failed to load order');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (!isAuthenticated || loading) return <><Header /><Loading /><Footer /></>;
  if (!order) return null;

  const canCancel = order.order_status === 'placed';
  const canReturn = order.order_status === 'delivered';
  const canExchange = order.order_status === 'delivered';
  
  const deliveredDate = order.delivered_at ? new Date(order.delivered_at) : null;
  const daysSinceDelivery = deliveredDate 
    ? (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    : null;

  const returnEligible = canReturn && daysSinceDelivery && daysSinceDelivery <= 7;
  const exchangeEligible = canExchange && daysSinceDelivery && daysSinceDelivery <= 7;

  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>Order Details</h2>
              <p className="text-muted mb-0">Order #{order.order_number}</p>
            </div>
            <Link href="/orders" className="btn btn-outline-secondary">
              ← Back to Orders
            </Link>
          </div>

          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8">
              {/* Order Status Timeline */}
              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="mb-4">Order Status</h5>
                  
                  <div className="position-relative">
                    {/* Timeline */}
                    <div className="d-flex justify-content-between mb-2">
                      {['placed', 'processing', 'shipped', 'delivered'].map((status, index) => (
                        <div key={status} className="text-center" style={{ flex: 1 }}>
                          <div 
                            className={`rounded-circle mx-auto mb-2 ${
                              ['placed', 'processing', 'shipped', 'delivered'].indexOf(order.order_status) >= index
                                ? 'bg-primary'
                                : 'bg-secondary'
                            }`}
                            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <span className="text-white">✓</span>
                          </div>
                          <small className="text-capitalize">{status}</small>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.order_status === 'cancelled' && (
                    <div className="alert alert-danger mt-3">
                      <strong>Order Cancelled</strong>
                      {order.cancelled_at && (
                        <p className="mb-0 small">Cancelled on {new Date(order.cancelled_at).toLocaleDateString('en-IN')}</p>
                      )}
                    </div>
                  )}

                  {order.tracking_number && (
                    <div className="alert alert-info mt-3">
                      <strong>Tracking Number:</strong> {order.tracking_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="card mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Items ({order.items?.length || 0})</h5>
                </div>
                <div className="card-body p-0">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="p-3 border-bottom">
                      <div className="row align-items-center">
                        <div className="col-md-2">
                          <Image
                            src={item.product_image || '/placeholder.jpg'}
                            alt={item.product_name}
                            width={80}
                            height={100}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div className="col-md-5">
                          <h6 className="mb-1">{item.product_name}</h6>
                          <small className="text-muted">
                            Size: {item.variant_size} | Color: {item.variant_color}
                          </small>
                        </div>
                        <div className="col-md-2 text-center">
                          <span className="badge bg-secondary">Qty: {item.quantity}</span>
                        </div>
                        <div className="col-md-3 text-end">
                          <p className="mb-0 fw-medium">₹{item.subtotal.toLocaleString('en-IN')}</p>
                          <small className="text-muted">₹{item.price} each</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card">
                <div className="card-body">
                  <h5 className="mb-3">Shipping Address</h5>
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
                    <strong style={{ color: '#D4A373' }}>₹{order.final_amount.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="mb-2">
                    <small className="text-muted d-block">Payment Method</small>
                    <span className="badge bg-secondary">{order.payment_method}</span>
                  </div>

                  <div>
                    <small className="text-muted d-block">Payment Status</small>
                    <span className={`badge ${
                      order.payment_status === 'paid' ? 'bg-success' : 
                      order.payment_status === 'pending' ? 'bg-warning' : 
                      'bg-danger'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Actions</h6>
                  
                  <div className="d-grid gap-2">
                    {canCancel && (
                      <button
                        onClick={handleCancelOrder}
                        className="btn btn-outline-danger"
                        disabled={cancelling}
                      >
                        {cancelling ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}

                    {returnEligible && (
                      <Link href={`/orders/${orderId}/return`} className="btn btn-outline-warning">
                        Request Return
                      </Link>
                    )}

                    {exchangeEligible && (
                      <Link href={`/orders/${orderId}/exchange`} className="btn btn-outline-primary">
                        Request Exchange
                      </Link>
                    )}

                    <button className="btn btn-outline-secondary">
                      Download Invoice
                    </button>

                    <Link href="/contact" className="btn btn-outline-secondary">
                      Contact Support
                    </Link>
                  </div>

                  {daysSinceDelivery !== null && daysSinceDelivery > 7 && (
                    <div className="alert alert-warning mt-3 small mb-0">
                      Return/Exchange window expired (7 days)
                    </div>
                  )}
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

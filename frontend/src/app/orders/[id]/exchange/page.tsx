'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import toast from 'react-hot-toast';
import Loading from '@/components/common/Loading';

export default function ExchangeRequestPage() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reason: 'size_issue',
    reason_details: '',
    exchange_variant_id: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason_details.trim() || formData.reason_details.length < 10) {
      toast.error('Please provide detailed reason (minimum 10 characters)');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/exchanges', {
        order_id: orderId,
        ...formData,
      });
      
      toast.success('Exchange request submitted successfully');
      router.push(`/orders/${orderId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to submit exchange request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || loading) return <><Header /><Loading /><Footer /></>;
  if (!order) return null;

  // Check if eligible for exchange
  const deliveredDate = order.delivered_at ? new Date(order.delivered_at) : null;
  const daysSinceDelivery = deliveredDate 
    ? (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    : null;
  const isEligible = order.order_status === 'delivered' && daysSinceDelivery && daysSinceDelivery <= 7;

  if (!isEligible) {
    return (
      <>
        <Header />
        <main className="py-5">
          <div className="container">
            <div className="card">
              <div className="card-body text-center py-5">
                <h3 className="text-danger mb-3">Exchange Not Available</h3>
                <p className="text-muted mb-4">
                  {order.order_status !== 'delivered' 
                    ? 'Order must be delivered to request an exchange.'
                    : 'Exchange window has expired. Exchanges are available for 7 days after delivery.'}
                </p>
                <button onClick={() => router.push(`/orders/${orderId}`)} className="btn btn-primary">
                  Back to Order Details
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card">
                <div className="card-body p-4">
                  <h3 className="mb-4">Request Exchange</h3>
                  <p className="text-muted mb-4">Order #{order.order_number}</p>

                  <form onSubmit={handleSubmit}>
                    {/* Order Items */}
                    <div className="mb-4">
                      <h6 className="mb-3">Order Items</h6>
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="d-flex align-items-center p-3 border rounded mb-2">
                          <div className="flex-grow-1">
                            <p className="mb-1 fw-medium">{item.product_name}</p>
                            <small className="text-muted">
                              Size: {item.variant_size} | Color: {item.variant_color}
                            </small>
                          </div>
                          <span className="badge bg-secondary">Qty: {item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Reason */}
                    <div className="mb-3">
                      <label className="form-label">Reason for Exchange *</label>
                      <select
                        className="form-select"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        required
                      >
                        <option value="size_issue">Size Issue (Too Small/Large)</option>
                        <option value="color_difference">Color Looks Different</option>
                        <option value="defective">Defective Product</option>
                        <option value="wrong_item">Wrong Item Received</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Details */}
                    <div className="mb-4">
                      <label className="form-label">Detailed Explanation *</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={formData.reason_details}
                        onChange={(e) => setFormData({ ...formData, reason_details: e.target.value })}
                        placeholder="Please provide detailed information about why you want to exchange this product (minimum 10 characters)"
                        required
                        minLength={10}
                      />
                      <small className="text-muted">
                        {formData.reason_details.length} characters (minimum 10 required)
                      </small>
                    </div>

                    {/* Exchange Policy */}
                    <div className="alert alert-info">
                      <strong>Exchange Policy:</strong>
                      <ul className="mb-0 mt-2">
                        <li>Product must be unused with original tags</li>
                        <li>Original packaging required</li>
                        <li>Exchange subject to availability</li>
                        <li>Our team will review and approve within 24 hours</li>
                        <li>Pickup will be scheduled after approval</li>
                      </ul>
                    </div>

                    {/* Submit */}
                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary flex-grow-1"
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Exchange Request'}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/orders/${orderId}`)}
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

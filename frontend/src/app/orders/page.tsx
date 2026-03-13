'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Loading from '@/components/common/Loading';
import { resolveImageUrl } from '@/lib/image';

const normalizeOrdersPayload = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const asNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, filter]);

  const fetchOrders = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/orders${params}`);
      setOrders(normalizeOrdersPayload(response.data?.data));
    } catch (error) {
      console.error('Failed to fetch orders', error);
      setOrders([]);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-success';
      case 'shipped':
        return 'bg-info';
      case 'processing':
        return 'bg-primary';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const getPaymentBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success';
      case 'pending':
        return 'bg-warning';
      case 'failed':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Header />

      <main className="py-5">
        <div className="container">
          <h2 className="mb-4">My Orders</h2>

          <div className="mb-4">
            <ul className="nav nav-pills">
              {['all', 'placed', 'processing', 'shipped', 'delivered'].map((status) => (
                <li className="nav-item" key={status}>
                  <button className={`nav-link ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)}>
                    {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {loading ? (
            <Loading />
          ) : orders.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <h4 className="text-muted mb-3">No orders found</h4>
                <p className="text-muted mb-4">
                  {filter !== 'all' ? `You don't have any ${filter} orders.` : "You haven't placed any orders yet."}
                </p>
                <Link href="/products" className="btn btn-primary">
                  Start Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {orders.map((order) => (
                <div key={order.id} className="col-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-3">
                          <small className="text-muted">Order Number</small>
                          <p className="mb-0 fw-medium">{order.order_number}</p>
                        </div>
                        <div className="col-md-3">
                          <small className="text-muted">Order Date</small>
                          <p className="mb-0">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="col-md-2">
                          <small className="text-muted">Total Amount</small>
                          <p className="mb-0 fw-bold" style={{ color: '#D4A373' }}>
                            ₹{asNumber(order.final_amount).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="col-md-2">
                          <small className="text-muted">Status</small>
                          <p className="mb-0">
                            <span className={`badge ${getStatusBadgeClass(order.order_status)}`}>{order.order_status}</span>
                          </p>
                        </div>
                        <div className="col-md-2 text-end">
                          <Link href={`/orders/${order.id}`} className="btn btn-sm btn-outline-primary">
                            View Details
                          </Link>
                        </div>
                      </div>

                      <div className="border-top pt-3">
                        <div className="d-flex gap-3 flex-wrap">
                          {(Array.isArray(order.items) ? order.items : []).slice(0, 4).map((item: any, index: number) => (
                            <div key={index} className="d-flex align-items-center gap-2">
                              <Image src={resolveImageUrl(item.product_image)} alt={item.product_name || 'Product'} width={50} height={60} style={{ objectFit: 'cover' }} />
                              <div>
                                <p className="mb-0 small fw-medium">{item.product_name}</p>
                                <p className="mb-0 small text-muted">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-top mt-3 pt-3 d-flex gap-2 flex-wrap">
                        {order.tracking_number && <span className="badge bg-info">Tracking: {order.tracking_number}</span>}
                        <span className={`badge ${getPaymentBadgeClass(order.payment_status)}`}>Payment: {order.payment_status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

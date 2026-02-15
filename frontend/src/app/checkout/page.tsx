'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StockTimer from '@/components/checkout/StockTimer';
import CouponInput from '@/components/cart/CouponInput';
import toast from 'react-hot-toast';
import Script from 'next/script';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [reservedAt, setReservedAt] = useState<Date | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);

  const actualShippingCharge = (subtotal >= 1499 || freeShipping) ? 0 : 49;
  const finalTotal = subtotal - discount + actualShippingCharge;

  const handleCouponApplied = (discountAmount: number, code: string) => {
    setDiscount(discountAmount);
    setCouponCode(code);
    setFreeShipping(discountAmount === 0 && code !== '');
  };

  const handleCouponRemoved = () => {
    setDiscount(0);
    setCouponCode('');
    setFreeShipping(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    fetchAddresses();
    setReservedAt(new Date());
  }, [isAuthenticated, items]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/users/addresses');
      const addressList = response.data.data;
      setAddresses(addressList);
      
      // Auto-select default address
      const defaultAddr = addressList.find((a: any) => a.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      } else if (addressList.length > 0) {
        setSelectedAddress(addressList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch addresses');
    }
  };

  const handleReservationExpired = () => {
    toast.error('Stock reservation expired. Please add items to cart again.');
    router.push('/cart');
  };

  const initiateRazorpayPayment = async (orderId: string, amount: number) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: 'Kara Boutique',
      description: 'Order Payment',
      order_id: orderId,
      handler: async (response: any) => {
        try {
          // Verify payment
          await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          toast.success('Payment successful!');
          clearCart();
          router.push(`/orders/${response.razorpay_order_id}`);
        } catch (error) {
          toast.error('Payment verification failed');
        }
      },
      prefill: {
        name: user?.full_name,
        email: user?.email,
      },
      theme: {
        color: '#D4A373',
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderData = {
        shipping_address_id: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: couponCode || undefined,
      };

      const response = await api.post('/checkout/complete', orderData);
      const { order, razorpay_order } = response.data.data;

      if (paymentMethod === 'razorpay' || paymentMethod === 'card' || paymentMethod === 'upi') {
        // Initiate Razorpay payment
        initiateRazorpayPayment(razorpay_order.id, order.final_amount);
      } else if (paymentMethod === 'cod') {
        // COD order created
        toast.success('Order placed successfully!');
        clearCart();
        router.push(`/orders/${order.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Header />
      
      <main className="py-5">
        <div className="container">
          <h2 className="mb-4">Checkout</h2>

          {reservedAt && (
            <StockTimer reservedAt={reservedAt} onExpire={handleReservationExpired} />
          )}

          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8">
              {/* Delivery Address */}
              <div className="card mb-4">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">1. Delivery Address</h5>
                  <button
                    onClick={() => router.push('/account/addresses/new')}
                    className="btn btn-sm btn-outline-primary"
                  >
                    + Add New Address
                  </button>
                </div>
                <div className="card-body">
                  {addresses.length === 0 ? (
                    <div className="text-center py-3">
                      <p className="text-muted mb-3">No saved addresses</p>
                      <button
                        onClick={() => router.push('/account/addresses/new')}
                        className="btn btn-primary"
                      >
                        Add Delivery Address
                      </button>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {addresses.map((address) => (
                        <div key={address.id} className="col-md-6">
                          <div
                            className={`card cursor-pointer ${
                              selectedAddress === address.id ? 'border-primary' : ''
                            }`}
                            onClick={() => setSelectedAddress(address.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body">
                              <div className="form-check">
                                <input
                                  type="radio"
                                  className="form-check-input"
                                  name="address"
                                  checked={selectedAddress === address.id}
                                  onChange={() => setSelectedAddress(address.id)}
                                />
                                <label className="form-check-label">
                                  {address.is_default && (
                                    <span className="badge bg-primary me-2">Default</span>
                                  )}
                                  <p className="mb-1">{address.address_line1}</p>
                                  {address.address_line2 && (
                                    <p className="mb-1 small">{address.address_line2}</p>
                                  )}
                                  <p className="mb-0 small text-muted">
                                    {address.city}, {address.state} {address.pincode}
                                  </p>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="card mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">2. Payment Method</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-2">
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        name="payment"
                        id="razorpay"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="razorpay">
                        <strong>UPI / Cards / Netbanking / Wallets</strong>
                        <small className="d-block text-muted">Pay securely via Razorpay</small>
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        name="payment"
                        id="cod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="cod">
                        <strong>Cash on Delivery (COD)</strong>
                        <small className="d-block text-muted">Pay when you receive the order</small>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="card">
                <div className="card-header bg-white">
                  <h5 className="mb-0">3. Review Items ({items.length})</h5>
                </div>
                <div className="card-body">
                  {items.map((item: any) => (
                    <div key={item.id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                      <img
                        src={item.product_image || '/placeholder.jpg'}
                        alt={item.product_name}
                        width={60}
                        height={80}
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="ms-3 flex-grow-1">
                        <h6 className="mb-1">{item.product_name}</h6>
                        <small className="text-muted">
                          Size: {item.variant_size} | Color: {item.variant_color}
                        </small>
                        <p className="mb-0 small">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-end">
                        <p className="mb-0 fw-medium">₹{item.subtotal.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="col-lg-4">
              {/* Coupon Input */}
              <CouponInput
                orderValue={subtotal}
                onCouponApplied={handleCouponApplied}
                onCouponRemoved={handleCouponRemoved}
              />

              <div className="card sticky-top" style={{ top: '20px' }}>
                <div className="card-body">
                  <h5 className="mb-4">Order Summary</h5>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Subtotal ({items.length} items)</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Shipping</span>
                    <span className={actualShippingCharge === 0 ? 'text-success' : ''}>
                      {actualShippingCharge === 0 ? 'FREE' : `₹${actualShippingCharge}`}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Discount</span>
                      <span>-₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <hr />

                  <div className="d-flex justify-content-between mb-4">
                    <strong>Total Amount</strong>
                    <strong style={{ color: '#D4A373', fontSize: '1.5rem' }}>
                      ₹{finalTotal.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    className="btn btn-primary w-100 btn-lg"
                    disabled={loading || !selectedAddress}
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>

                  <div className="text-center mt-3">
                    <small className="text-muted">
                      🔒 Safe and Secure Payments
                    </small>
                  </div>
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

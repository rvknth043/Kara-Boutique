'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CouponInput from '@/components/cart/CouponInput';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Loading from '@/components/common/Loading';

export default function CartPage() {
  const { items, subtotal, total, updateQuantity, removeItem, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [freeShipping, setFreeShipping] = useState(false);

  const shippingCharge = (subtotal >= 1499 || freeShipping) ? 0 : 49;
  const finalTotal = subtotal - discount + shippingCharge;

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
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <>
      <Header />
      
      <main className="py-5">
        <div className="container">
          <h2 className="mb-4">Shopping Cart</h2>

          {loading ? (
            <Loading />
          ) : items.length === 0 ? (
            <div className="text-center py-5">
              <h3 className="text-muted mb-4">Your cart is empty</h3>
              <Link href="/products" className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="row">
              {/* Cart Items */}
              <div className="col-lg-8 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="card mb-3">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-md-2">
                          <Image
                            src={item.product_image || '/placeholder.jpg'}
                            alt={item.product_name}
                            width={100}
                            height={130}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div className="col-md-4">
                          <h6 className="mb-1">{item.product_name}</h6>
                          <small className="text-muted">
                            Size: {item.variant_size} | Color: {item.variant_color}
                          </small>
                        </div>
                        <div className="col-md-2">
                          <div className="d-flex align-items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="btn btn-sm btn-outline-secondary"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="px-2">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="btn btn-sm btn-outline-secondary"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="col-md-2">
                          <h6 className="mb-0" style={{ color: '#D4A373' }}>
                            ₹{item.subtotal.toLocaleString('en-IN')}
                          </h6>
                        </div>
                        <div className="col-md-2 text-end">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
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
                    
                    {discount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Discount ({couponCode})</span>
                        <span>-₹{discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Shipping</span>
                      <span className={shippingCharge === 0 ? 'text-success' : ''}>
                        {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                      </span>
                    </div>

                    <hr />

                    <div className="d-flex justify-content-between mb-4">
                      <strong>Total</strong>
                      <strong style={{ color: '#D4A373', fontSize: '1.5rem' }}>
                        ₹{finalTotal.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <Link href="/checkout" className="btn btn-primary w-100 mb-3">
                      Proceed to Checkout
                    </Link>

                    <Link href="/products" className="btn btn-outline-secondary w-100">
                      Continue Shopping
                    </Link>

                    {subtotal < 1499 && !freeShipping && (
                      <div className="alert alert-info mt-3 small">
                        Add ₹{(1499 - subtotal).toLocaleString('en-IN')} more for FREE shipping!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

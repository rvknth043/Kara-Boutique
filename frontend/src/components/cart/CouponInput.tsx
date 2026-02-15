'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CouponInputProps {
  orderValue: number;
  onCouponApplied: (discount: number, couponCode: string) => void;
  onCouponRemoved: () => void;
}

export default function CouponInput({ orderValue, onCouponApplied, onCouponRemoved }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/coupons/validate', {
        code: couponCode.toUpperCase(),
        order_value: orderValue,
      });

      const { discount, coupon, freeShipping } = response.data.data;
      
      setAppliedCoupon({
        code: coupon.code,
        discount,
        freeShipping,
      });

      onCouponApplied(discount, coupon.code);
      
      toast.success(
        freeShipping 
          ? 'Free shipping applied!'
          : `Coupon applied! ₹${discount.toFixed(0)} discount`
      );
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Invalid coupon code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    onCouponRemoved();
    toast.success('Coupon removed');
  };

  return (
    <div className="border rounded p-3 mb-3">
      <h6 className="mb-3">Apply Coupon Code</h6>
      
      {!appliedCoupon ? (
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={loading}
          />
          <button
            onClick={handleApplyCoupon}
            className="btn btn-outline-primary"
            disabled={loading || !couponCode.trim()}
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      ) : (
        <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded">
          <div>
            <span className="badge bg-success me-2">{appliedCoupon.code}</span>
            <span className="text-success">
              {appliedCoupon.freeShipping 
                ? 'Free shipping applied!'
                : `₹${appliedCoupon.discount.toFixed(0)} discount applied`}
            </span>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="btn btn-sm btn-outline-danger"
          >
            Remove
          </button>
        </div>
      )}

      <small className="text-muted d-block mt-2">
        Enter a valid coupon code to get discounts or free shipping
      </small>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { endpoints } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OTPLoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const requestOTP = async () => {
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      await api.post(endpoints.auth.otpRequest, { phone });
      setOtpSent(true);
      toast.success('OTP sent to your phone!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(endpoints.auth.otpVerify, { phone, otp });
      const { user, token } = response.data.data;
      
      // Save to cookies and context
      document.cookie = `token=${token}; path=/; max-age=604800`; // 7 days
      document.cookie = `user=${JSON.stringify(user)}; path=/; max-age=604800`;
      
      toast.success('Login successful!');
      router.push('/');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="fw-bold" style={{ color: '#D4A373' }}>
                    Kara Boutique
                  </h2>
                  <p className="text-muted">Login with OTP</p>
                </div>

                {!otpSent ? (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control form-control-lg"
                        placeholder="Enter 10-digit phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                      />
                    </div>
                    <button
                      onClick={requestOTP}
                      className="btn btn-primary btn-lg w-100 mb-3"
                      disabled={loading || phone.length !== 10}
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="alert alert-info small">
                      OTP sent to +91 {phone}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Enter OTP</label>
                      <input
                        type="text"
                        className="form-control form-control-lg text-center"
                        placeholder="6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                    </div>
                    <button
                      onClick={verifyOTP}
                      className="btn btn-primary btn-lg w-100 mb-2"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                      }}
                      className="btn btn-outline-secondary w-100"
                    >
                      Change Number
                    </button>
                  </>
                )}

                <div className="text-center mt-4">
                  <Link href="/login" className="text-decoration-none small">
                    Login with Email/Password
                  </Link>
                </div>

                <div className="text-center mt-2">
                  <Link href="/" className="text-muted small text-decoration-none">
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

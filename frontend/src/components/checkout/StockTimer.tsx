'use client';

import { useState, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';

interface StockTimerProps {
  reservedAt: Date;
  onExpire: () => void;
}

export default function StockTimer({ reservedAt, onExpire }: StockTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const reserved = new Date(reservedAt).getTime();
      const elapsed = Math.floor((now - reserved) / 1000);
      const remaining = Math.max(600 - elapsed, 0);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        onExpire();
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [reservedAt, onExpire]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const getProgressColor = () => {
    if (timeRemaining > 300) return 'success';
    if (timeRemaining > 120) return 'warning';
    return 'danger';
  };

  const progressPercentage = (timeRemaining / 600) * 100;

  return (
    <div className="card border-warning mb-4">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <FiClock size={20} className="text-warning" />
          <h6 className="mb-0">Stock Reserved</h6>
        </div>
        
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="small text-muted">Time remaining to complete purchase</span>
            <span className={`fw-bold text-${getProgressColor()}`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="progress" style={{ height: '8px' }}>
            <div
              className={`progress-bar bg-${getProgressColor()}`}
              role="progressbar"
              style={{ width: `${progressPercentage}%` }}
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
        
        <p className="small text-muted mb-0">
          {timeRemaining > 300 
            ? 'Your items are reserved. Complete checkout to confirm your order.'
            : timeRemaining > 120
            ? '⚠️ Hurry! Stock will be released soon.'
            : '🚨 Almost out of time! Complete your purchase now.'}
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiStar } from 'react-icons/fi';

interface ReviewFormProps {
  productId: string;
  orderId?: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ productId, orderId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewText.trim() || reviewText.length < 10) {
      toast.error('Review must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews', {
        product_id: productId,
        order_id: orderId,
        rating,
        review_text: reviewText,
      });

      toast.success('Review submitted successfully!');
      setReviewText('');
      setRating(5);
      onReviewSubmitted();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="mb-3">Write a Review</h5>
        
        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-3">
            <label className="form-label">Rating *</label>
            <div className="d-flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="btn btn-link p-0"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  style={{ fontSize: '2rem' }}
                >
                  <FiStar
                    fill={(hoveredRating || rating) >= star ? '#FFD700' : 'none'}
                    color={(hoveredRating || rating) >= star ? '#FFD700' : '#ccc'}
                  />
                </button>
              ))}
              <span className="ms-2 align-self-center">
                {rating} {rating === 1 ? 'star' : 'stars'}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div className="mb-3">
            <label className="form-label">Your Review *</label>
            <textarea
              className="form-control"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this product (minimum 10 characters)"
              required
              minLength={10}
            />
            <small className="text-muted">
              {reviewText.length} characters (minimum 10 required)
            </small>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || reviewText.length < 10}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

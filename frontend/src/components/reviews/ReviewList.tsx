'use client';

import { FiStar } from 'react-icons/fi';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  is_verified_purchase: boolean;
}

interface ReviewListProps {
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
}

export default function ReviewList({ reviews, averageRating, totalReviews }: ReviewListProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            size={16}
            fill={star <= rating ? '#FFD700' : 'none'}
            color={star <= rating ? '#FFD700' : '#ccc'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">Customer Reviews</h5>
          {averageRating !== undefined && totalReviews !== undefined && (
            <div className="text-end">
              <div className="d-flex align-items-center gap-2">
                {renderStars(Math.round(averageRating))}
                <span className="fw-bold">{averageRating.toFixed(1)}</span>
              </div>
              <small className="text-muted">{totalReviews} reviews</small>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-medium">{review.user_name}</span>
                      {review.is_verified_purchase && (
                        <span className="badge bg-success small">Verified Purchase</span>
                      )}
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <small className="text-muted">
                    {new Date(review.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </small>
                </div>
                <p className="mb-0">{review.review_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

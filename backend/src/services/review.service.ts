import ReviewModel, { CreateReviewData } from '../models/Review.model';
import { AppError } from '../middleware/errorHandler';

export class ReviewService {
  /**
   * Create review
   */
  static async createReview(data: CreateReviewData) {
    // Check if user can review (has purchased and received)
    const canReview = await ReviewModel.canUserReview(data.user_id, data.product_id);
    
    if (!canReview) {
      throw new AppError(
        'You can only review products you have purchased and received',
        403,
        'CANNOT_REVIEW'
      );
    }
    
    // Check if already reviewed
    const hasReviewed = await ReviewModel.hasUserReviewed(data.user_id, data.product_id);
    
    if (hasReviewed) {
      throw new AppError(
        'You have already reviewed this product',
        400,
        'ALREADY_REVIEWED'
      );
    }
    
    // Create review
    const review = await ReviewModel.create(data);
    
    return review;
  }
  
  /**
   * Get product reviews
   */
  static async getProductReviews(productId: string, page: number = 1, limit: number = 20) {
    const result = await ReviewModel.getProductReviews(productId, page, limit);
    
    return {
      reviews: result.reviews,
      total: result.total,
      average_rating: result.average_rating,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
  
  /**
   * Get user's reviews
   */
  static async getUserReviews(userId: string) {
    return await ReviewModel.getUserReviews(userId);
  }
  
  /**
   * Flag review
   */
  static async flagReview(reviewId: string, userId: string) {
    const review = await ReviewModel.flagReview(reviewId);
    
    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }
    
    return review;
  }
  
  /**
   * Delete review
   */
  static async deleteReview(reviewId: string, userId: string) {
    const deleted = await ReviewModel.delete(reviewId, userId);
    
    if (!deleted) {
      throw new AppError('Review not found or unauthorized', 404, 'REVIEW_NOT_FOUND');
    }
    
    return { success: true };
  }
  
  /**
   * Get flagged reviews (admin)
   */
  static async getFlaggedReviews() {
    return await ReviewModel.getFlaggedReviews();
  }
}

export default ReviewService;

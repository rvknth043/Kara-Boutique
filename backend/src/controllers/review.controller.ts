import { Request, Response } from 'express';
import ReviewService from '../services/review.service';
import { asyncHandler } from '../middleware/errorHandler';
import { sanitizePaginationParams, getPaginationMeta } from '../utils/pagination';

export class ReviewController {
  /**
   * Create review
   * POST /api/v1/reviews
   */
  static createReview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { product_id, order_id, rating, review_text } = req.body;
    
    const review = await ReviewService.createReview({
      user_id: userId,
      product_id,
      order_id,
      rating,
      review_text,
    });
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  });
  
  /**
   * Get product reviews
   * GET /api/v1/reviews/product/:productId
   */
  static getProductReviews = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { page, limit } = sanitizePaginationParams(req.query.page, req.query.limit);
    
    const result = await ReviewService.getProductReviews(productId, page, limit);
    
    res.status(200).json({
      success: true,
      data: {
        reviews: result.reviews,
        average_rating: result.average_rating,
        pagination: getPaginationMeta(page, limit, result.total),
      },
    });
  });
  
  /**
   * Get user's reviews
   * GET /api/v1/reviews/my-reviews
   */
  static getUserReviews = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const reviews = await ReviewService.getUserReviews(userId);
    
    res.status(200).json({
      success: true,
      data: reviews,
    });
  });
  
  /**
   * Flag review
   * POST /api/v1/reviews/:reviewId/flag
   */
  static flagReview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { reviewId } = req.params;
    
    await ReviewService.flagReview(reviewId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Review flagged successfully',
    });
  });
  
  /**
   * Delete review
   * DELETE /api/v1/reviews/:reviewId
   */
  static deleteReview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { reviewId } = req.params;
    
    await ReviewService.deleteReview(reviewId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  });
  
  /**
   * Get flagged reviews (admin)
   * GET /api/v1/reviews/flagged
   */
  static getFlaggedReviews = asyncHandler(async (req: Request, res: Response) => {
    const reviews = await ReviewService.getFlaggedReviews();
    
    res.status(200).json({
      success: true,
      data: reviews,
    });
  });
}

export default ReviewController;

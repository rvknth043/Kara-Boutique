import { Router } from 'express';
import ReviewController from '../controllers/review.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createReviewValidator,
  productIdValidator,
  reviewIdValidator,
} from '../validators/review.validator';

const router = Router();

/**
 * @route   GET /api/v1/reviews/product/:productId
 * @desc    Get product reviews
 * @access  Public
 */
router.get(
  '/product/:productId',
  validate(productIdValidator),
  ReviewController.getProductReviews
);

/**
 * @route   GET /api/v1/reviews/flagged
 * @desc    Get flagged reviews (admin)
 * @access  Admin
 */
router.get(
  '/flagged',
  authenticate,
  isAdmin,
  ReviewController.getFlaggedReviews
);

/**
 * @route   GET /api/v1/reviews/my-reviews
 * @desc    Get user's reviews
 * @access  Private
 */
router.get(
  '/my-reviews',
  authenticate,
  ReviewController.getUserReviews
);

/**
 * @route   POST /api/v1/reviews
 * @desc    Create review
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(createReviewValidator),
  ReviewController.createReview
);

/**
 * @route   POST /api/v1/reviews/:reviewId/flag
 * @desc    Flag review
 * @access  Private
 */
router.post(
  '/:reviewId/flag',
  authenticate,
  validate(reviewIdValidator),
  ReviewController.flagReview
);

/**
 * @route   DELETE /api/v1/reviews/:reviewId
 * @desc    Delete review
 * @access  Private
 */
router.delete(
  '/:reviewId',
  authenticate,
  validate(reviewIdValidator),
  ReviewController.deleteReview
);

export default router;

import { body, param } from 'express-validator';

export const createReviewValidator = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Invalid product ID'),
  
  body('order_id')
    .notEmpty()
    .withMessage('Order ID is required')
    .isUUID()
    .withMessage('Invalid order ID'),
  
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('review_text')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review text must be between 10 and 1000 characters'),
];

export const productIdValidator = [
  param('productId')
    .isUUID()
    .withMessage('Invalid product ID'),
];

export const reviewIdValidator = [
  param('reviewId')
    .isUUID()
    .withMessage('Invalid review ID'),
];

export default {
  createReviewValidator,
  productIdValidator,
  reviewIdValidator,
};

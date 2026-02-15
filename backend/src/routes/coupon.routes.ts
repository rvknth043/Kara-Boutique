import { Router } from 'express';
import CouponController from '../controllers/coupon.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { body, param } from 'express-validator';

const router = Router();

// Validators
const validateCouponValidator = [
  body('code')
    .notEmpty()
    .withMessage('Coupon code is required')
    .trim()
    .toUpperCase(),
  
  body('order_value')
    .notEmpty()
    .withMessage('Order value is required')
    .isFloat({ min: 0 })
    .withMessage('Order value must be a positive number'),
];

const createCouponValidator = [
  body('code')
    .notEmpty()
    .withMessage('Coupon code is required')
    .trim()
    .toUpperCase()
    .isLength({ min: 4, max: 20 })
    .withMessage('Code must be between 4 and 20 characters'),
  
  body('type')
    .notEmpty()
    .withMessage('Coupon type is required')
    .isIn(['percentage', 'fixed', 'free_shipping'])
    .withMessage('Invalid coupon type'),
  
  body('value')
    .notEmpty()
    .withMessage('Value is required')
    .isFloat({ min: 0 })
    .withMessage('Value must be positive'),
  
  body('min_order_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min order value must be positive'),
  
  body('max_discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max discount must be positive'),
  
  body('usage_limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be at least 1'),
  
  body('valid_from')
    .notEmpty()
    .withMessage('Valid from date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('valid_until')
    .notEmpty()
    .withMessage('Valid until date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
];

const couponIdValidator = [
  param('id').isUUID().withMessage('Invalid coupon ID'),
];

/**
 * @route   POST /api/v1/coupons/validate
 * @desc    Validate coupon code
 * @access  Private
 */
router.post(
  '/validate',
  authenticate,
  validate(validateCouponValidator),
  CouponController.validateCoupon
);

/**
 * @route   GET /api/v1/coupons
 * @desc    Get all coupons (admin)
 * @access  Admin
 */
router.get(
  '/',
  authenticate,
  isAdmin,
  CouponController.getAllCoupons
);

/**
 * @route   POST /api/v1/coupons
 * @desc    Create coupon (admin)
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  validate(createCouponValidator),
  CouponController.createCoupon
);

/**
 * @route   PUT /api/v1/coupons/:id
 * @desc    Update coupon (admin)
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  validate([...couponIdValidator, ...createCouponValidator]),
  CouponController.updateCoupon
);

/**
 * @route   PUT /api/v1/coupons/:id/toggle
 * @desc    Toggle coupon status (admin)
 * @access  Admin
 */
router.put(
  '/:id/toggle',
  authenticate,
  isAdmin,
  validate(couponIdValidator),
  CouponController.toggleCouponStatus
);

/**
 * @route   DELETE /api/v1/coupons/:id
 * @desc    Delete coupon (admin)
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validate(couponIdValidator),
  CouponController.deleteCoupon
);

export default router;

import { Router } from 'express';
import CartController from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addToCartValidator,
  updateCartValidator,
  cartItemIdValidator,
  mergeCartValidator,
} from '../validators/cart.validator';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get(
  '/',
  CartController.getCart
);

/**
 * @route   GET /api/v1/cart/count
 * @desc    Get cart item count
 * @access  Private
 */
router.get(
  '/count',
  CartController.getCartCount
);

/**
 * @route   GET /api/v1/cart/validate
 * @desc    Validate cart items
 * @access  Private
 */
router.get(
  '/validate',
  CartController.validateCart
);

/**
 * @route   POST /api/v1/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
  '/add',
  validate(addToCartValidator),
  CartController.addToCart
);

/**
 * @route   POST /api/v1/cart/merge
 * @desc    Merge guest cart to user cart
 * @access  Private
 */
router.post(
  '/merge',
  validate(mergeCartValidator),
  CartController.mergeGuestCart
);

/**
 * @route   PUT /api/v1/cart/update/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put(
  '/update/:itemId',
  validate(updateCartValidator),
  CartController.updateQuantity
);

/**
 * @route   DELETE /api/v1/cart/remove/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete(
  '/remove/:itemId',
  validate(cartItemIdValidator),
  CartController.removeItem
);

/**
 * @route   DELETE /api/v1/cart/clear
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete(
  '/clear',
  CartController.clearCart
);

export default router;

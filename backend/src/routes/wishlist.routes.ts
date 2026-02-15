import { Router } from 'express';
import WishlistController from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addToWishlistValidator,
  productIdParamValidator,
  wishlistItemIdValidator,
  toggleWishlistValidator,
} from '../validators/cart.validator';

const router = Router();

// All wishlist routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/wishlist
 * @desc    Get user's wishlist
 * @access  Private
 */
router.get(
  '/',
  WishlistController.getWishlist
);

/**
 * @route   GET /api/v1/wishlist/count
 * @desc    Get wishlist item count
 * @access  Private
 */
router.get(
  '/count',
  WishlistController.getWishlistCount
);

/**
 * @route   GET /api/v1/wishlist/check/:productId
 * @desc    Check if product is in wishlist
 * @access  Private
 */
router.get(
  '/check/:productId',
  validate(productIdParamValidator),
  WishlistController.checkWishlist
);

/**
 * @route   POST /api/v1/wishlist/add
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post(
  '/add',
  validate(addToWishlistValidator),
  WishlistController.addToWishlist
);

/**
 * @route   POST /api/v1/wishlist/toggle
 * @desc    Toggle product in wishlist
 * @access  Private
 */
router.post(
  '/toggle',
  validate(toggleWishlistValidator),
  WishlistController.toggleWishlist
);

/**
 * @route   DELETE /api/v1/wishlist/remove/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete(
  '/remove/:productId',
  validate(productIdParamValidator),
  WishlistController.removeFromWishlist
);

/**
 * @route   DELETE /api/v1/wishlist/item/:itemId
 * @desc    Remove item by wishlist ID
 * @access  Private
 */
router.delete(
  '/item/:itemId',
  validate(wishlistItemIdValidator),
  WishlistController.removeById
);

/**
 * @route   DELETE /api/v1/wishlist/clear
 * @desc    Clear entire wishlist
 * @access  Private
 */
router.delete(
  '/clear',
  WishlistController.clearWishlist
);

export default router;

import { body, param } from 'express-validator';

// Cart Validators
export const addToCartValidator = [
  body('product_variant_id')
    .notEmpty()
    .withMessage('Product variant ID is required')
    .isUUID()
    .withMessage('Invalid product variant ID'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),
];

export const updateCartValidator = [
  param('itemId')
    .isUUID()
    .withMessage('Invalid cart item ID'),
  
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),
];

export const cartItemIdValidator = [
  param('itemId')
    .isUUID()
    .withMessage('Invalid cart item ID'),
];

export const mergeCartValidator = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one item'),
  
  body('items.*.product_variant_id')
    .isUUID()
    .withMessage('Each item must have a valid product variant ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Each item quantity must be between 1 and 99'),
];

// Wishlist Validators
export const addToWishlistValidator = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Invalid product ID'),
];

export const productIdParamValidator = [
  param('productId')
    .isUUID()
    .withMessage('Invalid product ID'),
];

export const wishlistItemIdValidator = [
  param('itemId')
    .isUUID()
    .withMessage('Invalid wishlist item ID'),
];

export const toggleWishlistValidator = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Invalid product ID'),
];

export default {
  addToCartValidator,
  updateCartValidator,
  cartItemIdValidator,
  mergeCartValidator,
  addToWishlistValidator,
  productIdParamValidator,
  wishlistItemIdValidator,
  toggleWishlistValidator,
};

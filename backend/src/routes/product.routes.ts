import { Router } from 'express';
import ProductController from '../controllers/product.controller';
import { authenticate, isAdmin, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createProductValidator,
  updateProductValidator,
  addVariantValidator,
  updateStockValidator,
  getProductsValidator,
  searchProductsValidator,
  productIdValidator,
  productSlugValidator,
  categorySlugValidator,
} from '../validators/product.validator';

const router = Router();

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with filters
 * @access  Public
 */
router.get(
  '/',
  validate(getProductsValidator),
  ProductController.getAllProducts
);

/**
 * @route   GET /api/v1/products/search
 * @desc    Search products
 * @access  Public
 */
router.get(
  '/search',
  validate(searchProductsValidator),
  ProductController.searchProducts
);

/**
 * @route   GET /api/v1/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get(
  '/featured',
  ProductController.getFeaturedProducts
);

/**
 * @route   GET /api/v1/products/low-stock
 * @desc    Get low stock products
 * @access  Admin
 */
router.get(
  '/low-stock',
  authenticate,
  isAdmin,
  ProductController.getLowStockProducts
);

/**
 * @route   GET /api/v1/products/category/:slug
 * @desc    Get products by category
 * @access  Public
 */
router.get(
  '/category/:slug',
  validate(categorySlugValidator),
  ProductController.getProductsByCategory
);

/**
 * @route   GET /api/v1/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get(
  '/slug/:slug',
  validate(productSlugValidator),
  ProductController.getProductBySlug
);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get(
  '/:id',
  validate(productIdValidator),
  ProductController.getProductById
);

/**
 * @route   POST /api/v1/products
 * @desc    Create new product
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  validate(createProductValidator),
  ProductController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  validate(updateProductValidator),
  ProductController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validate(productIdValidator),
  ProductController.deleteProduct
);

/**
 * @route   POST /api/v1/products/:id/variants
 * @desc    Add variant to product
 * @access  Admin
 */
router.post(
  '/:id/variants',
  authenticate,
  isAdmin,
  validate(addVariantValidator),
  ProductController.addVariant
);

/**
 * @route   PUT /api/v1/products/variants/:variantId/stock
 * @desc    Update variant stock
 * @access  Admin
 */
router.put(
  '/variants/:variantId/stock',
  authenticate,
  isAdmin,
  validate(updateStockValidator),
  ProductController.updateVariantStock
);

export default router;

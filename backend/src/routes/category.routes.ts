import { Router } from 'express';
import CategoryController from '../controllers/category.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
  categorySlugValidator,
} from '../validators/category.validator';

const router = Router();

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get(
  '/',
  CategoryController.getAllCategories
);

/**
 * @route   GET /api/v1/categories/root
 * @desc    Get root categories (no parent)
 * @access  Public
 */
router.get(
  '/root',
  CategoryController.getRootCategories
);

/**
 * @route   GET /api/v1/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get(
  '/slug/:slug',
  validate(categorySlugValidator),
  CategoryController.getCategoryBySlug
);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get(
  '/:id',
  validate(categoryIdValidator),
  CategoryController.getCategoryById
);

/**
 * @route   GET /api/v1/categories/:id/subcategories
 * @desc    Get subcategories
 * @access  Public
 */
router.get(
  '/:id/subcategories',
  validate(categoryIdValidator),
  CategoryController.getSubcategories
);

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  validate(createCategoryValidator),
  CategoryController.createCategory
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  validate(updateCategoryValidator),
  CategoryController.updateCategory
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validate(categoryIdValidator),
  CategoryController.deleteCategory
);

export default router;

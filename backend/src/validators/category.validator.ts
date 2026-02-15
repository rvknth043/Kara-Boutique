import { body, param } from 'express-validator';

export const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Category name must be between 2 and 255 characters'),
  
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Invalid parent category ID'),
  
  body('meta_title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Meta title must not exceed 255 characters'),
  
  body('meta_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description must not exceed 500 characters'),
  
  body('display_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
];

export const updateCategoryValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Category name must be between 2 and 255 characters'),
  
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Invalid parent category ID'),
  
  body('meta_title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Meta title must not exceed 255 characters'),
  
  body('meta_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description must not exceed 500 characters'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  
  body('display_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
];

export const categoryIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID'),
];

export const categorySlugValidator = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Category slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid slug format'),
];

export default {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
  categorySlugValidator,
};

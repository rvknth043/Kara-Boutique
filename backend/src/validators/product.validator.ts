import { body, query, param } from 'express-validator';

export const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  
  body('category_id')
    .notEmpty()
    .withMessage('Category is required')
    .isUUID()
    .withMessage('Invalid category ID'),
  
  body('base_price')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  
  body('discount_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number')
    .custom((value, { req }) => {
      if (value && parseFloat(value) >= parseFloat(req.body.base_price)) {
        throw new Error('Discount price must be less than base price');
      }
      return true;
    }),
  
  body('hsn_code')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('HSN code must not exceed 20 characters'),
  
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('is_featured must be a boolean'),
  
  body('variants')
    .isArray({ min: 1 })
    .withMessage('At least one variant is required'),
  
  body('variants.*.size')
    .notEmpty()
    .withMessage('Size is required for each variant')
    .isIn(['S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Size must be S, M, L, XL, or XXL'),
  
  body('variants.*.color')
    .trim()
    .notEmpty()
    .withMessage('Color is required for each variant')
    .isLength({ min: 2, max: 50 })
    .withMessage('Color must be between 2 and 50 characters'),
  
  body('variants.*.stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*.image_url')
    .if(body('images').exists())
    .trim()
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Invalid image URL'),
  
  body('images.*.color_variant')
    .optional()
    .trim(),
  
  body('images.*.is_primary')
    .optional()
    .isBoolean()
    .withMessage('is_primary must be a boolean'),
  
  body('size_chart')
    .optional()
    .isArray()
    .withMessage('Size chart must be an array'),
  
  body('size_chart.*.size')
    .if(body('size_chart').exists())
    .isIn(['S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Size must be S, M, L, XL, or XXL'),
];

export const updateProductValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid product ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  
  body('category_id')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),
  
  body('base_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  
  body('discount_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number'),
  
  body('is_featured')
    .optional()
    .isBoolean()
    .withMessage('is_featured must be a boolean'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
];

export const addVariantValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid product ID'),
  
  body('size')
    .notEmpty()
    .withMessage('Size is required')
    .isIn(['S', 'M', 'L', 'XL', 'XXL'])
    .withMessage('Size must be S, M, L, XL, or XXL'),
  
  body('color')
    .trim()
    .notEmpty()
    .withMessage('Color is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Color must be between 2 and 50 characters'),
  
  body('stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
];

export const updateStockValidator = [
  param('variantId')
    .isUUID()
    .withMessage('Invalid variant ID'),
  
  body('quantity_change')
    .isInt()
    .withMessage('Quantity change must be an integer'),
];

export const getProductsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('category_id')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),
  
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a non-negative number'),
  
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a non-negative number'),
  
  query('is_featured')
    .optional()
    .isBoolean()
    .withMessage('is_featured must be a boolean'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  
  query('sort_by')
    .optional()
    .isIn(['created_at', 'base_price', 'name', 'view_count'])
    .withMessage('Invalid sort_by field'),
  
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
];

export const searchProductsValidator = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const productIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid product ID'),
];

export const productSlugValidator = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Product slug is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid slug format'),
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
  createProductValidator,
  updateProductValidator,
  addVariantValidator,
  updateStockValidator,
  getProductsValidator,
  searchProductsValidator,
  productIdValidator,
  productSlugValidator,
  categorySlugValidator,
};

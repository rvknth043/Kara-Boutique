import { body, param, query } from 'express-validator';

export const requestExchangeValidator = [
  body('order_id')
    .notEmpty()
    .withMessage('Order ID is required')
    .isUUID()
    .withMessage('Invalid order ID'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isIn(['size_issue', 'color_difference', 'defective', 'wrong_item', 'other'])
    .withMessage('Invalid reason'),
  
  body('reason_details')
    .notEmpty()
    .withMessage('Reason details are required')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason details must be between 10 and 1000 characters'),
  
  body('exchange_variant_id')
    .optional()
    .isUUID()
    .withMessage('Invalid exchange variant ID'),
];

export const exchangeIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid exchange ID'),
];

export const updateExchangeStatusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid exchange ID'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['requested', 'approved', 'rejected', 'picked_up', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('admin_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes must be less than 1000 characters'),
];

export const exchangeFiltersValidator = [
  query('status')
    .optional()
    .isIn(['requested', 'approved', 'rejected', 'picked_up', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export default {
  requestExchangeValidator,
  exchangeIdValidator,
  updateExchangeStatusValidator,
  exchangeFiltersValidator,
};

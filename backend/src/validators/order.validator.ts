import { body, param, query } from 'express-validator';

// Checkout Validators
export const completeCheckoutValidator = [
  body('shipping_address_id')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isUUID()
    .withMessage('Invalid shipping address ID'),
  
  body('payment_method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['UPI', 'CARD', 'NETBANKING', 'WALLET', 'COD'])
    .withMessage('Invalid payment method'),
  
  body('reservation_id')
    .optional()
    .isString()
    .withMessage('Invalid reservation ID'),
  
  body('coupon_code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Invalid coupon code'),
];

export const pincodeValidator = [
  param('pincode')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Invalid pincode format'),
];

export const reservationIdValidator = [
  param('reservationId')
    .notEmpty()
    .withMessage('Reservation ID is required'),
];

// Order Validators
export const orderIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid order ID'),
];

export const orderNumberValidator = [
  param('orderNumber')
    .matches(/^ORD-\d{8}-\d{4}$/)
    .withMessage('Invalid order number format'),
];

export const cancelReturnValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid order ID'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
];

export const updateOrderStatusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid order ID'),
  
  body('order_status')
    .notEmpty()
    .withMessage('Order status is required')
    .isIn(['placed', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status'),
  
  body('tracking_number')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Tracking number must be between 5 and 100 characters'),
];

export const orderFiltersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('payment_status')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),
  
  query('order_status')
    .optional()
    .isIn(['placed', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('Invalid order status'),
  
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for date_from'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for date_to'),
];

export default {
  completeCheckoutValidator,
  pincodeValidator,
  reservationIdValidator,
  orderIdValidator,
  orderNumberValidator,
  cancelReturnValidator,
  updateOrderStatusValidator,
  orderFiltersValidator,
};

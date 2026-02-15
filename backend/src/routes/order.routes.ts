import { Router } from 'express';
import OrderController from '../controllers/order.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  orderIdValidator,
  orderNumberValidator,
  cancelReturnValidator,
  updateOrderStatusValidator,
  orderFiltersValidator,
} from '../validators/order.validator';

const router = Router();

/**
 * @route   GET /api/v1/orders/admin/all
 * @desc    Get all orders (admin)
 * @access  Admin
 */
router.get(
  '/admin/all',
  authenticate,
  isAdmin,
  validate(orderFiltersValidator),
  OrderController.getAllOrders
);

/**
 * @route   GET /api/v1/orders/admin/statistics
 * @desc    Get order statistics (admin)
 * @access  Admin
 */
router.get(
  '/admin/statistics',
  authenticate,
  isAdmin,
  OrderController.getOrderStatistics
);

/**
 * @route   PUT /api/v1/orders/admin/:id/status
 * @desc    Update order status (admin)
 * @access  Admin
 */
router.put(
  '/admin/:id/status',
  authenticate,
  isAdmin,
  validate(updateOrderStatusValidator),
  OrderController.updateOrderStatus
);

/**
 * @route   GET /api/v1/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  OrderController.getUserOrders
);

/**
 * @route   GET /api/v1/orders/number/:orderNumber
 * @desc    Get order by order number
 * @access  Private
 */
router.get(
  '/number/:orderNumber',
  authenticate,
  validate(orderNumberValidator),
  OrderController.getOrderByNumber
);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validate(orderIdValidator),
  OrderController.getOrderById
);

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.post(
  '/:id/cancel',
  authenticate,
  validate(orderIdValidator),
  OrderController.cancelOrder
);

/**
 * @route   POST /api/v1/orders/:id/return
 * @desc    Request return
 * @access  Private
 */
router.post(
  '/:id/return',
  authenticate,
  validate(cancelReturnValidator),
  OrderController.requestReturn
);

export default router;

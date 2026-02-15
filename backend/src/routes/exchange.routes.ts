import { Router } from 'express';
import ExchangeController from '../controllers/exchange.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  requestExchangeValidator,
  exchangeIdValidator,
  updateExchangeStatusValidator,
  exchangeFiltersValidator,
} from '../validators/exchange.validator';

const router = Router();

/**
 * @route   GET /api/v1/exchanges/admin/all
 * @desc    Get all exchange requests (admin)
 * @access  Admin
 */
router.get(
  '/admin/all',
  authenticate,
  isAdmin,
  validate(exchangeFiltersValidator),
  ExchangeController.getAllExchanges
);

/**
 * @route   PUT /api/v1/exchanges/admin/:id/status
 * @desc    Update exchange status (admin)
 * @access  Admin
 */
router.put(
  '/admin/:id/status',
  authenticate,
  isAdmin,
  validate(updateExchangeStatusValidator),
  ExchangeController.updateExchangeStatus
);

/**
 * @route   GET /api/v1/exchanges/my-exchanges
 * @desc    Get user's exchange requests
 * @access  Private
 */
router.get(
  '/my-exchanges',
  authenticate,
  ExchangeController.getMyExchanges
);

/**
 * @route   POST /api/v1/exchanges
 * @desc    Request exchange
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(requestExchangeValidator),
  ExchangeController.requestExchange
);

/**
 * @route   GET /api/v1/exchanges/:id
 * @desc    Get exchange by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validate(exchangeIdValidator),
  ExchangeController.getExchangeById
);

/**
 * @route   POST /api/v1/exchanges/:id/cancel
 * @desc    Cancel exchange request
 * @access  Private
 */
router.post(
  '/:id/cancel',
  authenticate,
  validate(exchangeIdValidator),
  ExchangeController.cancelExchange
);

export default router;

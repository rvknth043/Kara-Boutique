import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  initiatePaymentValidator,
  verifyPaymentValidator,
  refundValidator,
  paymentStatsValidator,
} from '../validators/payment.validator';

const router = Router();

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Razorpay webhook
 * @access  Public (verified by signature)
 */
router.post(
  '/webhook',
  PaymentController.handleWebhook
);

/**
 * @route   GET /api/v1/payments/statistics
 * @desc    Get payment statistics (admin)
 * @access  Admin
 */
router.get(
  '/statistics',
  authenticate,
  isAdmin,
  validate(paymentStatsValidator),
  PaymentController.getStatistics
);

/**
 * @route   POST /api/v1/payments/initiate
 * @desc    Initiate payment (Create Razorpay order)
 * @access  Private
 */
router.post(
  '/initiate',
  authenticate,
  validate(initiatePaymentValidator),
  PaymentController.initiatePayment
);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify payment after successful payment
 * @access  Private
 */
router.post(
  '/verify',
  authenticate,
  validate(verifyPaymentValidator),
  PaymentController.verifyPayment
);

/**
 * @route   POST /api/v1/payments/refund
 * @desc    Process refund (admin)
 * @access  Admin
 */
router.post(
  '/refund',
  authenticate,
  isAdmin,
  validate(refundValidator),
  PaymentController.processRefund
);

export default router;

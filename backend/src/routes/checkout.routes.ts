import { Router } from 'express';
import CheckoutController from '../controllers/checkout.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  completeCheckoutValidator,
  pincodeValidator,
  reservationIdValidator,
} from '../validators/order.validator';

const router = Router();

// All checkout routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/checkout/initiate
 * @desc    Initiate checkout and reserve stock
 * @access  Private
 */
router.post(
  '/initiate',
  CheckoutController.initiateCheckout
);

/**
 * @route   POST /api/v1/checkout/complete
 * @desc    Complete checkout and create order
 * @access  Private
 */
router.post(
  '/complete',
  validate(completeCheckoutValidator),
  CheckoutController.completeCheckout
);

/**
 * @route   POST /api/v1/checkout/release/:reservationId
 * @desc    Release stock reservation
 * @access  Private
 */
router.post(
  '/release/:reservationId',
  validate(reservationIdValidator),
  CheckoutController.releaseReservation
);

/**
 * @route   GET /api/v1/checkout/validate-pincode/:pincode
 * @desc    Validate pincode for COD availability
 * @access  Private
 */
router.get(
  '/validate-pincode/:pincode',
  validate(pincodeValidator),
  CheckoutController.validatePincode
);

export default router;

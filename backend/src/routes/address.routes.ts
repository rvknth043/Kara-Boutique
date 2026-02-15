import { Router } from 'express';
import AddressController from '../controllers/address.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createAddressValidator,
  updateAddressValidator,
  addressIdValidator,
} from '../validators/address.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/addresses
 * @desc    Get user's addresses
 * @access  Private
 */
router.get(
  '/',
  AddressController.getUserAddresses
);

/**
 * @route   GET /api/v1/users/addresses/:id
 * @desc    Get address by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(addressIdValidator),
  AddressController.getAddressById
);

/**
 * @route   POST /api/v1/users/addresses
 * @desc    Create new address
 * @access  Private
 */
router.post(
  '/',
  validate(createAddressValidator),
  AddressController.createAddress
);

/**
 * @route   PUT /api/v1/users/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put(
  '/:id',
  validate(updateAddressValidator),
  AddressController.updateAddress
);

/**
 * @route   PUT /api/v1/users/addresses/:id/default
 * @desc    Set default address
 * @access  Private
 */
router.put(
  '/:id/default',
  validate(addressIdValidator),
  AddressController.setDefaultAddress
);

/**
 * @route   DELETE /api/v1/users/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete(
  '/:id',
  validate(addressIdValidator),
  AddressController.deleteAddress
);

export default router;

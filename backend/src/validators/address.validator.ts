import { body, param } from 'express-validator';

export const createAddressValidator = [
  body('address_line1')
    .notEmpty()
    .withMessage('Address line 1 is required')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters'),
  
  body('address_line2')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must be less than 200 characters'),
  
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('pincode')
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Invalid pincode format (must be 6 digits)'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),
];

export const updateAddressValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid address ID'),
  
  body('address_line1')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters'),
  
  body('address_line2')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must be less than 200 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('pincode')
    .optional()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Invalid pincode format (must be 6 digits)'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),
];

export const addressIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid address ID'),
];

export default {
  createAddressValidator,
  updateAddressValidator,
  addressIdValidator,
};

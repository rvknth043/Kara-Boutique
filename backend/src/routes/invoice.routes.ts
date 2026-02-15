import { Router } from 'express';
import InvoiceController from '../controllers/invoice.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/invoices/:orderId
 * @desc    Generate and download invoice
 * @access  Private
 */
router.get(
  '/:orderId',
  authenticate,
  InvoiceController.generateInvoice
);

/**
 * @route   GET /api/v1/invoices/:orderId/url
 * @desc    Get invoice URL
 * @access  Private
 */
router.get(
  '/:orderId/url',
  authenticate,
  InvoiceController.getInvoiceUrl
);

/**
 * @route   POST /api/v1/invoices/:orderId/generate
 * @desc    Generate invoice and save URL (admin)
 * @access  Admin
 */
router.post(
  '/:orderId/generate',
  authenticate,
  isAdmin,
  InvoiceController.generateAndSave
);

export default router;

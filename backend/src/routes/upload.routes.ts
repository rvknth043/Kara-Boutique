import { Router } from 'express';
import UploadController from '../controllers/upload.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { upload } from '../services/upload.service';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/upload/image
 * @desc    Upload single image
 * @access  Private (Admin)
 */
router.post(
  '/image',
  isAdmin,
  upload.single('image'),
  UploadController.uploadImage
);

/**
 * @route   POST /api/v1/upload/images
 * @desc    Upload multiple images (max 5)
 * @access  Private (Admin)
 */
router.post(
  '/images',
  isAdmin,
  upload.array('images', 5),
  UploadController.uploadMultipleImages
);

/**
 * @route   POST /api/v1/upload/product/:productId
 * @desc    Upload product images
 * @access  Private (Admin)
 */
router.post(
  '/product/:productId',
  isAdmin,
  upload.array('images', 10),
  UploadController.uploadProductImages
);

/**
 * @route   DELETE /api/v1/upload/image
 * @desc    Delete image
 * @access  Private (Admin)
 */
router.delete(
  '/image',
  isAdmin,
  UploadController.deleteImage
);

export default router;

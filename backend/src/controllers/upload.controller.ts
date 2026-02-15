import { Request, Response } from 'express';
import ImageUploadService from '../services/upload.service';
import { asyncHandler } from '../middleware/errorHandler';

export class UploadController {
  /**
   * Upload single image
   * POST /api/v1/upload/image
   */
  static uploadImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded',
        },
      });
    }

    const url = await ImageUploadService.uploadImage(req.file);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url },
    });
  });

  /**
   * Upload multiple images
   * POST /api/v1/upload/images
   */
  static uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No files uploaded',
        },
      });
    }

    const urls = await ImageUploadService.uploadMultipleImages(req.files);

    res.status(200).json({
      success: true,
      message: `${urls.length} images uploaded successfully`,
      data: { urls },
    });
  });

  /**
   * Delete image
   * DELETE /api/v1/upload/image
   */
  static deleteImage = asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'URL_REQUIRED',
          message: 'Image URL is required',
        },
      });
    }

    await ImageUploadService.deleteImage(url);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  });

  /**
   * Upload product images
   * POST /api/v1/upload/product/:productId
   */
  static uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No files uploaded',
        },
      });
    }

    const urls = await ImageUploadService.uploadMultipleImages(req.files);

    // Save URLs to product_images table
    // This would be done in ProductService, but for now just return URLs
    
    res.status(200).json({
      success: true,
      message: 'Product images uploaded successfully',
      data: { 
        productId,
        urls 
      },
    });
  });
}

export default UploadController;

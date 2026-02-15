import { Request, Response } from 'express';
import InvoiceService from '../services/invoice.service';
import { asyncHandler } from '../middleware/errorHandler';
import fs from 'fs';

export class InvoiceController {
  /**
   * Generate and download invoice
   * GET /api/v1/invoices/:orderId
   */
  static generateInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'manager';

    // Generate invoice
    const filepath = await InvoiceService.generateInvoice(orderId, isAdmin ? undefined : userId);

    // Send file
    res.download(filepath, `invoice-${orderId}.pdf`, (err) => {
      // Clean up temp file
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      
      if (err) {
        console.error('Error sending invoice:', err);
      }
    });
  });

  /**
   * Get invoice URL
   * GET /api/v1/invoices/:orderId/url
   */
  static getInvoiceUrl = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    
    const url = await InvoiceService.getInvoiceUrl(orderId);
    
    if (!url) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not yet generated',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { url },
    });
  });

  /**
   * Generate invoice for order (admin)
   * POST /api/v1/invoices/:orderId/generate
   */
  static generateAndSave = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    // Generate invoice
    const filepath = await InvoiceService.generateInvoice(orderId);

    // In production, upload to S3 and save URL
    // For now, just confirm generation
    const url = `/invoices/${orderId}.pdf`; // Placeholder
    await InvoiceService.saveInvoiceUrl(orderId, url);

    // Clean up temp file
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    res.status(200).json({
      success: true,
      message: 'Invoice generated successfully',
      data: { url },
    });
  });
}

export default InvoiceController;

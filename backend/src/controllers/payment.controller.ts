import { Request, Response } from 'express';
import PaymentService from '../services/payment.service';
import { asyncHandler } from '../middleware/errorHandler';

export class PaymentController {
  /**
   * Initiate payment (Create Razorpay order)
   * POST /api/v1/payments/initiate
   */
  static initiatePayment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { order_id } = req.body;
    
    const result = await PaymentService.initiatePayment({
      order_id,
      user_id: userId,
    });
    
    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      data: result,
    });
  });
  
  /**
   * Verify payment
   * POST /api/v1/payments/verify
   */
  static verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const {
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;
    
    const result = await PaymentService.verifyPayment({
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: result,
    });
  });
  
  /**
   * Handle Razorpay webhook
   * POST /api/v1/payments/webhook
   */
  static handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const event = req.body.event;
    const payload = req.body.payload;
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);
    
    await PaymentService.handleWebhook(event, payload, signature, body);
    
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  });
  
  /**
   * Process refund (admin)
   * POST /api/v1/payments/refund
   */
  static processRefund = asyncHandler(async (req: Request, res: Response) => {
    const { order_id, reason } = req.body;
    
    const refund = await PaymentService.processRefund(order_id, reason);
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: refund,
    });
  });
  
  /**
   * Get payment statistics (admin)
   * GET /api/v1/payments/statistics
   */
  static getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const dateFrom = req.query.date_from 
      ? new Date(req.query.date_from as string) 
      : undefined;
    const dateTo = req.query.date_to 
      ? new Date(req.query.date_to as string) 
      : undefined;
    
    const statistics = await PaymentService.getPaymentStatistics(dateFrom, dateTo);
    
    res.status(200).json({
      success: true,
      data: statistics,
    });
  });
}

export default PaymentController;

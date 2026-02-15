import PaymentModel, { CreatePaymentData } from '../models/Payment.model';
import OrderModel from '../models/Order.model';
import RazorpayService from './razorpay.service';
import { AppError } from '../middleware/errorHandler';
import { PaymentGateway, PaymentStatus, PaymentMethod } from '../types/shared.types';
import { transaction } from '../config/database';

export interface InitiatePaymentData {
  order_id: string;
  user_id: string;
}

export interface VerifyPaymentData {
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class PaymentService {
  /**
   * Initiate payment (Create Razorpay order)
   */
  static async initiatePayment(data: InitiatePaymentData) {
    // Get order details
    const order = await OrderModel.findById(data.order_id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    // Verify order belongs to user
    if (order.user_id !== data.user_id) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }
    
    // Check if payment already exists
    const existingPayment = await PaymentModel.findByOrderId(data.order_id);
    
    if (existingPayment && existingPayment.status === 'captured') {
      throw new AppError('Payment already completed', 400, 'PAYMENT_COMPLETED');
    }
    
    // Check if order payment method is not COD
    if (order.payment_method === PaymentMethod.COD) {
      throw new AppError(
        'Cannot initiate online payment for COD order',
        400,
        'COD_ORDER'
      );
    }
    
    // Create Razorpay order
    const razorpayOrder = await RazorpayService.createOrder({
      amount: Math.round(order.final_amount * 100), // Convert to paise
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        order_number: order.order_number,
      },
    });
    
    // Create payment record
    const payment = await PaymentModel.create({
      order_id: order.id,
      transaction_id: razorpayOrder.id,
      gateway: PaymentGateway.RAZORPAY,
      amount: order.final_amount,
      status: 'created',
      webhook_data: razorpayOrder,
    });
    
    return {
      payment,
      razorpay_order: razorpayOrder,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      order_details: {
        id: order.id,
        order_number: order.order_number,
        amount: order.final_amount,
      },
    };
  }
  
  /**
   * Verify payment after successful payment
   */
  static async verifyPayment(data: VerifyPaymentData) {
    // Get order
    const order = await OrderModel.findById(data.order_id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    // Verify signature
    const isValid = RazorpayService.verifyPaymentSignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature
    );
    
    if (!isValid) {
      throw new AppError('Invalid payment signature', 400, 'INVALID_SIGNATURE');
    }
    
    // Fetch payment details from Razorpay
    const razorpayPayment = await RazorpayService.fetchPayment(data.razorpay_payment_id);
    
    // Update payment and order in transaction
    await transaction(async (client) => {
      // Update payment record
      const payment = await PaymentModel.findByOrderId(data.order_id);
      
      if (payment) {
        await PaymentModel.update(payment.id, {
          status: razorpayPayment.status,
          webhook_data: razorpayPayment,
        });
      }
      
      // Update order payment status
      await client.query(
        'UPDATE orders SET payment_status = $1 WHERE id = $2',
        [PaymentStatus.PAID, data.order_id]
      );
    });
    
    const updatedOrder = await OrderModel.findByIdWithDetails(data.order_id);
    
    return {
      success: true,
      order: updatedOrder,
      payment_status: razorpayPayment.status,
    };
  }
  
  /**
   * Handle Razorpay webhook
   */
  static async handleWebhook(event: string, payload: any, signature: string, body: string) {
    // Verify webhook signature
    const isValid = RazorpayService.verifyWebhookSignature(body, signature);
    
    if (!isValid) {
      throw new AppError('Invalid webhook signature', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }
    
    // Handle different events
    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload.payment.entity);
        break;
        
      case 'payment.failed':
        await this.handlePaymentFailed(payload.payment.entity);
        break;
        
      case 'order.paid':
        await this.handleOrderPaid(payload.order.entity);
        break;
        
      default:
        console.log('Unhandled webhook event:', event);
    }
    
    return { received: true };
  }
  
  /**
   * Handle payment captured event
   */
  private static async handlePaymentCaptured(paymentData: any) {
    const orderId = paymentData.notes?.order_id;
    
    if (!orderId) {
      console.error('No order_id in payment notes');
      return;
    }
    
    await transaction(async (client) => {
      // Update payment
      const payment = await PaymentModel.findByOrderId(orderId);
      
      if (payment) {
        await PaymentModel.update(payment.id, {
          status: 'captured',
          webhook_data: paymentData,
        });
      }
      
      // Update order
      await client.query(
        'UPDATE orders SET payment_status = $1 WHERE id = $2',
        [PaymentStatus.PAID, orderId]
      );
    });
  }
  
  /**
   * Handle payment failed event
   */
  private static async handlePaymentFailed(paymentData: any) {
    const orderId = paymentData.notes?.order_id;
    
    if (!orderId) {
      console.error('No order_id in payment notes');
      return;
    }
    
    await transaction(async (client) => {
      // Update payment
      const payment = await PaymentModel.findByOrderId(orderId);
      
      if (payment) {
        await PaymentModel.update(payment.id, {
          status: 'failed',
          webhook_data: paymentData,
        });
      }
      
      // Update order
      await client.query(
        'UPDATE orders SET payment_status = $1 WHERE id = $2',
        [PaymentStatus.FAILED, orderId]
      );
    });
  }
  
  /**
   * Handle order paid event
   */
  private static async handleOrderPaid(orderData: any) {
    const orderId = orderData.notes?.order_id;
    
    if (!orderId) {
      console.error('No order_id in order notes');
      return;
    }
    
    await transaction(async (client) => {
      await client.query(
        'UPDATE orders SET payment_status = $1 WHERE id = $2',
        [PaymentStatus.PAID, orderId]
      );
    });
  }
  
  /**
   * Process refund
   */
  static async processRefund(orderId: string, reason?: string) {
    // Get order
    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    
    // Get payment
    const payment = await PaymentModel.findByOrderId(orderId);
    
    if (!payment) {
      throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }
    
    if (payment.status !== 'captured') {
      throw new AppError('Payment not captured, cannot refund', 400, 'PAYMENT_NOT_CAPTURED');
    }
    
    // Get Razorpay payment ID from webhook data
    const razorpayPaymentId = payment.webhook_data?.id;
    
    if (!razorpayPaymentId) {
      throw new AppError('Razorpay payment ID not found', 400, 'PAYMENT_ID_NOT_FOUND');
    }
    
    // Create refund
    const refund = await RazorpayService.createRefund(
      razorpayPaymentId,
      Math.round(order.final_amount * 100), // Amount in paise
      order.id
    );
    
    // Update order and payment status
    await transaction(async (client) => {
      await client.query(
        'UPDATE orders SET payment_status = $1 WHERE id = $2',
        [PaymentStatus.REFUNDED, orderId]
      );
      
      await PaymentModel.update(payment.id, {
        status: 'refunded',
        webhook_data: { ...payment.webhook_data, refund },
      });
    });
    
    return refund;
  }
  
  /**
   * Get payment statistics (admin)
   */
  static async getPaymentStatistics(dateFrom?: Date, dateTo?: Date) {
    return await PaymentModel.getStatistics(dateFrom, dateTo);
  }
}

export default PaymentService;
